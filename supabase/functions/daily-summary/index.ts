import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SummaryContext {
  dayName: string
  workoutLabel: string
  week: number
  phase: string
  weightLbs: number
  daysToGoal: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const today = new Date().toISOString().split('T')[0]

    // Return cached summary if one exists for today
    const { data: cached } = await supabase
      .from('daily_summary_cache')
      .select('summary')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (cached?.summary) {
      return new Response(JSON.stringify({ summary: cached.summary }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ctx = await req.json() as SummaryContext
    const lbsToGoal = Math.max(0, ctx.weightLbs - 185)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [
          {
            role: 'user',
            content: `Write a 1-2 sentence personal morning briefing for Luke's fitness day. Be direct, specific, and motivating. No greeting, no emojis, no prefix labels.

Context: ${ctx.dayName} · ${ctx.workoutLabel} · Week ${ctx.week} ${ctx.phase} phase · ${ctx.weightLbs} lbs (${lbsToGoal > 0 ? `${lbsToGoal} lbs from goal` : 'goal reached'}) · ${ctx.daysToGoal} days to July 2026.`,
          },
        ],
      }),
    })

    if (!res.ok) throw new Error(`Anthropic error ${res.status}`)

    const data = await res.json()
    const summary: string = data.content?.[0]?.text ?? ''

    if (summary) {
      await supabase.from('daily_summary_cache').upsert(
        { user_id: user.id, date: today, summary },
        { onConflict: 'user_id,date' }
      )
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
