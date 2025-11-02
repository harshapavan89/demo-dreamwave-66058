import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const funnyMessages = [
  "🦥 Even sloths are judging your productivity today... and they're SLOW!",
  "🍕 Your dreams called. They're eating pizza without you because you didn't check off your tasks!",
  "🚀 NASA just confirmed: You're moving slower than a space turtle. Time to catch up!",
  "🎯 Plot twist: Your tasks completed themselves... JUST KIDDING! Get to work!",
  "🦖 Fun fact: Dinosaurs went extinct because they didn't finish their daily tasks. Don't be a dinosaur!",
  "☕ Your coffee is disappointed in you. Your tasks are disappointed. Even your pet goldfish is disappointed.",
  "🎪 Breaking news: The circus called. They want to hire you because you're such a great procrastinator!",
  "🌟 Remember when you said 'I'll do it later'? Well, it's later. MUCH later!",
  "🎮 Achievement Unlocked: Master Procrastinator! (P.S. This isn't the achievement you want)",
  "🌈 Your tasks are hiding at the end of a rainbow. Spoiler: There's no gold, just stuff you need to do!"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all users with incomplete tasks
    const { data: users } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name');

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check each user for incomplete tasks
    const usersWithIncompleteTasks = [];
    for (const user of users) {
      const { data: tasks } = await supabaseClient
        .from('daily_tasks')
        .select('id, completed')
        .eq('user_id', user.id)
        .eq('completed', false);

      if (tasks && tasks.length > 0) {
        usersWithIncompleteTasks.push(user);
      }
    }

    if (usersWithIncompleteTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users with incomplete tasks found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailPromises = usersWithIncompleteTasks.map(async (user) => {
      const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      const firstName = user.full_name?.split(' ')[0] || 'Friend';

      try {
        // Use Resend REST API directly
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'DreamFlow <onboarding@resend.dev>',
            to: [user.email],
            subject: '⚡ Your Tasks Are Feeling Lonely!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <h1 style="color: #333; font-size: 28px; margin-bottom: 20px;">Hey ${firstName}! 👋</h1>
                  
                  <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                    <p style="color: #555; font-size: 18px; margin: 0; font-weight: 500;">${randomMessage}</p>
                  </div>
                  
                  <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    We noticed you have some tasks waiting for you. No judgment! Well... maybe a little. 😏
                  </p>
                  
                  <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Your future self will thank you for getting these done today. Plus, think of all the satisfaction of checking those boxes! ✅
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || ''}/portal" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; 
                              padding: 15px 40px; 
                              text-decoration: none; 
                              border-radius: 25px; 
                              font-weight: bold; 
                              display: inline-block;
                              font-size: 16px;">
                      Complete Your Tasks Now! 🚀
                    </a>
                  </div>
                  
                  <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    Keep crushing those goals! 💪<br>
                    <strong>The DreamFlow Team</strong>
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.text();
          console.error(`Failed to send email to ${user.email}:`, errorData);
          return { success: false, email: user.email, error: errorData };
        }

        console.log(`Reminder email sent to ${user.email}`);
        return { success: true, email: user.email };
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
        return { success: false, email: user.email, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successCount} reminder emails`,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log detailed error server-side for debugging
    console.error('[Send Reminder Error]', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ 
        error: 'Unable to send reminder emails. Please try again later.',
        code: 'EMAIL_ERROR'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
