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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const EMAILJS_SERVICE_ID = Deno.env.get('EMAILJS_SERVICE_ID');
    const EMAILJS_TEMPLATE_ID = Deno.env.get('EMAILJS_TEMPLATE_ID');
    const EMAILJS_PUBLIC_KEY = Deno.env.get('EMAILJS_PUBLIC_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      throw new Error('EmailJS credentials not configured');
    }

    const { notificationType = 'daily_summary' } = await req.json();

    // Get all users with enabled notifications matching this type
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id, ai_tone, notification_types')
      .eq('enabled', true);

    if (prefsError) throw prefsError;

    const results = [];

    for (const pref of preferences || []) {
      // Check if user wants this notification type
      if (!pref.notification_types.includes(notificationType)) continue;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', pref.user_id)
        .single();

      if (!profile?.email) continue;

      let subject = '';
      let messageContent = '';
      let aiSystemPrompt = '';

      if (notificationType === 'daily_summary') {
        // Get today's tasks
        const { data: tasks } = await supabase
          .from('daily_tasks')
          .select('title, completed')
          .eq('user_id', pref.user_id)
          .gte('created_at', new Date().toISOString().split('T')[0]);

        const completedCount = tasks?.filter(t => t.completed).length || 0;
        const totalCount = tasks?.length || 0;
        const pendingTasks = tasks?.filter(t => !t.completed).map(t => t.title).join(', ') || 'No pending tasks';

        subject = `📊 Your Daily Summary - ${completedCount}/${totalCount} Tasks Complete`;
        aiSystemPrompt = `You are a supportive AI coach. Generate a brief daily summary message (2-3 sentences) about their progress. Completed: ${completedCount}/${totalCount}. Pending: ${pendingTasks}. Be encouraging.`;
        messageContent = `Today's Progress: ${completedCount}/${totalCount} tasks completed.\n\nPending: ${pendingTasks}`;

      } else if (notificationType === 'weekly_progress') {
        // Get this week's streak data
        const { data: streak } = await supabase
          .from('streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', pref.user_id)
          .single();

        subject = `🌟 Your Weekly Progress - ${streak?.current_streak || 0} Day Streak!`;
        aiSystemPrompt = `You are an inspiring AI coach. Generate a brief weekly progress message (2-3 sentences) celebrating their ${streak?.current_streak || 0} day streak. Best streak: ${streak?.longest_streak || 0}. Be celebratory and motivating.`;
        messageContent = `Current Streak: ${streak?.current_streak || 0} days\nLongest Streak: ${streak?.longest_streak || 0} days`;
      }

      // Generate AI message
      let aiMessage = "Keep up the great work! 🌟";
      if (LOVABLE_API_KEY && aiSystemPrompt) {
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
                { role: 'system', content: aiSystemPrompt },
                { role: 'user', content: `Generate a ${pref.ai_tone} message for ${profile.full_name}` }
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            aiMessage = aiData.choices[0]?.message?.content || aiMessage;
          }
        } catch (error) {
          console.log('AI generation failed:', error);
        }
      }

      // Send email
      const emailData = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: profile.email,
          to_name: profile.full_name,
          subject,
          task_name: messageContent,
          dream_goal: '',
          motivational_message: aiMessage,
        },
      };

      const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      const status = emailResponse.ok ? 'sent' : 'failed';

      // Save to history
      await supabase.from('notification_history').insert({
        user_id: pref.user_id,
        notification_type: notificationType,
        status,
        message_content: aiMessage,
        email: profile.email,
      });

      results.push({ email: profile.email, status });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error sending scheduled notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});