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
    const { taskName, userName, userEmail, dreamGoal, aiTone = 'motivational' } = await req.json();

    // Get EmailJS credentials
    const EMAILJS_SERVICE_ID = Deno.env.get('EMAILJS_SERVICE_ID');
    const EMAILJS_TEMPLATE_ID = Deno.env.get('EMAILJS_TEMPLATE_ID');
    const EMAILJS_PUBLIC_KEY = Deno.env.get('EMAILJS_PUBLIC_KEY');

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      throw new Error('EmailJS credentials not configured');
    }
    
    // Generate AI message based on tone using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let aiMessage = "Remember — small steps build big dreams! 💪🔥";

    const tonePrompts: Record<string, string> = {
      motivational: 'You are a motivational AI coach. Generate a short, inspiring and encouraging message (max 2 sentences) for someone who missed their task. Be uplifting and empowering. Use emojis.',
      funny: 'You are a funny and humorous AI coach. Generate a short, witty and amusing message (max 2 sentences) for someone who missed their task. Be lighthearted and make them smile. Use emojis.',
      professional: 'You are a professional AI coach. Generate a short, straightforward and constructive message (max 2 sentences) for someone who missed their task. Be respectful and goal-oriented. Use minimal emojis.',
      friendly: 'You are a friendly AI coach. Generate a short, warm and supportive message (max 2 sentences) for someone who missed their task. Be kind and understanding. Use emojis.'
    };

    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                content: tonePrompts[aiTone] || tonePrompts.motivational
              },
              {
                role: 'user',
                content: `Generate a message for ${userName} who missed their task "${taskName}" for their goal: ${dreamGoal}`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiMessage = aiData.choices[0]?.message?.content || aiMessage;
        }
      } catch (error) {
        console.log('AI generation failed, using default message:', error);
      }
    }

    // Send email via EmailJS
    const emailData = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: userEmail,
        to_name: userName,
        task_name: taskName,
        dream_goal: dreamGoal,
        motivational_message: aiMessage,
        subject: `Hey ${userName}, your dream needs you!`,
      },
    };

    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`EmailJS failed: ${errorText}`);
    }

    console.log(`Email sent successfully to ${userEmail} for task: ${taskName}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email reminder sent successfully! 📧',
        aiMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send email reminder',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});