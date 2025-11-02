import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, taskTitle, imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Verifying task proof:', { taskId, taskTitle, imageUrl });

    // Update status to verifying
    await supabase
      .from('daily_tasks')
      .update({ verification_status: 'verifying' })
      .eq('id', taskId);

    // Call Lovable AI with vision to verify the proof
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a task verification AI. Your job is to verify if the uploaded image/video shows genuine proof of task completion. 
            
Analyze the image carefully and respond with a JSON object:
{
  "verified": true/false,
  "confidence": 0-100,
  "feedback": "Brief explanation of what you see and why you approved/rejected"
}

Be encouraging but honest. Look for signs of genuine effort. If the image is blurry, unclear, or unrelated to the task, set verified to false.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Task: "${taskTitle}"\n\nPlease verify if this image/video shows proof of completing this task.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI verification error:', response.status, errorText);
      throw new Error('AI verification failed');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '{}';
    
    let verificationResult;
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonString = aiResponse;
      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      }
      
      verificationResult = JSON.parse(jsonString);
      
      // Ensure we have the required fields
      if (typeof verificationResult.verified !== 'boolean') {
        throw new Error('Invalid verification result format');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse, e);
      // If AI doesn't return proper JSON, be conservative and reject
      verificationResult = {
        verified: false,
        confidence: 0,
        feedback: 'Unable to verify - please try uploading a clearer image that shows proof of task completion.'
      };
    }

    console.log('AI verification result:', verificationResult);

    // Only update task to completed if verification is approved
    const updateData: any = {
      verification_status: verificationResult.verified ? 'approved' : 'rejected',
      notes: `AI Verification (${verificationResult.confidence}% confidence): ${verificationResult.feedback}`
    };

    // CRITICAL: Only set completed and completed_at if verified is true
    if (verificationResult.verified) {
      updateData.completed = true;
      updateData.completed_at = new Date().toISOString();
    } else {
      // If rejected, ensure task remains incomplete
      updateData.completed = false;
      updateData.completed_at = null;
    }

    const { error: updateError } = await supabase
      .from('daily_tasks')
      .update(updateData)
      .eq('id', taskId);

    if (updateError) throw updateError;

    // If verified, update user streak
    if (verificationResult.verified) {
      const { data: taskData } = await supabase
        .from('daily_tasks')
        .select('user_id')
        .eq('id', taskId)
        .single();

      if (taskData) {
        const { data: streakData } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', taskData.user_id)
          .single();

        const today = new Date().toISOString().split('T')[0];
        const lastCompleted = streakData?.last_completed_date;
        
        let newStreak = streakData?.current_streak || 0;
        if (lastCompleted !== today) {
          newStreak += 1;
        }

        await supabase
          .from('streaks')
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streakData?.longest_streak || 0),
            last_completed_date: today
          })
          .eq('user_id', taskData.user_id);
      }
    }

    return new Response(
      JSON.stringify({
        verified: verificationResult.verified,
        feedback: verificationResult.feedback,
        confidence: verificationResult.confidence
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-task-proof function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unable to verify proof. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
