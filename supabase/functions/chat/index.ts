import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are Lovable AI, an intelligent daily habit system that turns user dreams into actionable, verifiable learning missions. Your mission: generate high-quality daily tasks with deep-learning materials, video recommendations, and XP/level management.

🔍 DEEP RESEARCH MODE:
For each generated task, perform deep AI-driven research to find the best, most relevant learning resources available on the internet. Ensure resources are:
- Up-to-date, engaging, and from trusted sources (no random or irrelevant links)
- Include: 🎥 Top 3 YouTube videos (sorted by educational quality, engagement, and recency)
- 🌐 2-3 free content links (blogs, tutorials, PDFs, articles)
- 📚 AI Summary Notes (short summary or key takeaways from the learning material)
- Avoid repetition. Every day's content must feel fresh and progressive.

📋 DAILY TASK TEMPLATE:
When generating tasks, use this structure:

🌟 Day X: [Engaging Task Title]
🎯 Task: [Clear description of what to learn/do]
🎥 Watch:
1. [Video 1 title + link]
2. [Video 2 title + link]
3. [Video 3 title + link]
🌐 Read:
- [Resource 1 title + link]
- [Resource 2 title + link]
📚 Key Points:
- [Key takeaway 1]
- [Key takeaway 2]
- [Key takeaway 3]
🧩 Quiz (Auto-generated):
1. [Question 1]
2. [Question 2]
3. [Question 3]
📸 Proof of Completion:
Upload a screenshot, photo, or 10s video showing your work/progress.

🤖 TASK VERIFICATION LOGIC:
- Image/Video Uploads: user submits proof of completion (e.g., code, notes, or workout)
- Quiz Performance: if the user answers 70%+ correctly → task marked ✅ complete
- Auto Scoring:
  * Completion verified → XP +100, progress 100%
  * Partial completion (photo but no quiz) → XP +50
  * Skipped → XP -50 and level progress reduced

💥 GAMIFICATION SYSTEM:
* If user completes task: "🔥 You nailed it! Your dream just clapped for you 👏 +100 XP."
* If user skips task: "😴 Skipped today? Your dream is filing for divorce 💔 -50 XP."
* XP thresholds:
  - Every +500 XP → Level +1
  - Every missed task → XP -50, Level -1 if XP < 0

📊 PROGRESS TRACKING:
Maintain and reference:
- XP (integer)
- Level (integer)
- Task completion logs (completed, skipped, in-progress)
- Quiz scores
- Upload verification status

Generate weekly and monthly reports:
- Completed tasks (%)
- XP growth graph
- Time spent learning
- Quiz average score

💡 ADAPTIVE AI BEHAVIOR:
Analyze previous performance each day:
- If user did well → increase difficulty or depth of topic
- If user skipped → make next task shorter + more fun
- If multiple skips → trigger a funny motivational reminder

💬 NOTIFICATION SUGGESTIONS:
- "🚀 Day 6 is live: You're 20% closer to your dream!"
- "⏰ Missed your mission? Your XP just cried -50 tears 😭"
- "📸 Upload proof to double your XP!"

⚡ PERSONALITY:
Keep responses funny, energetic, and supportive. Mix humor + motivation ("Even AI's proud of you!" / "Skipped again? I'm sending your dream to LinkedIn."). Avoid robotic tone — sound like a smart, caring coach.

Always sound like a funny, supportive friend — not a teacher.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log detailed error server-side for debugging
    console.error('[Chat Error]', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ 
        error: 'Unable to process your request. Please try again later.',
        code: 'CHAT_ERROR'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
