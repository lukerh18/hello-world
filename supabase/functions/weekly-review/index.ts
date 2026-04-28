import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const context = await req.json()

    const prompt = buildPrompt(context)

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `Anthropic error ${anthropicRes.status}`)
    }

    const data = await anthropicRes.json()
    const review: string = data.content?.[0]?.text ?? ''

    return new Response(JSON.stringify({ review }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function buildPrompt(ctx: Record<string, unknown>): string {
  const p = ctx.programStatus as Record<string, unknown>
  const weights = (ctx.recentWeights as Array<{ date: string; weight: number }> ?? [])
    .map((e) => `  ${e.date}: ${e.weight} lbs`).join('\n') || '  No weigh-ins this week'

  const workouts = (ctx.weekWorkouts as Array<Record<string, unknown>> ?? [])
  const workoutSummary = workouts.length === 0
    ? '  No workouts logged this week'
    : workouts.map((w) => {
        const exs = (w.exercises as Array<Record<string, unknown>> ?? [])
          .map((e) => `    • ${e.exerciseName}: ${(e.sets as Array<Record<string, unknown>>).filter((s) => s.completed).length} sets`)
          .join('\n')
        return `  ${w.date}\n${exs}`
      }).join('\n\n')

  const maxes = ctx.strengthMaxes as Record<string, number> ?? {}
  const maxesText = Object.entries(maxes).map(([k, v]) => `  ${k}: ${v} lbs`).join('\n') || '  No data'

  const nutrition = ctx.nutritionAvg as Record<string, unknown> | null
  const nutritionText = nutrition
    ? `  Calories: ${nutrition.calories}/${(nutrition.targets as Record<string, number>).calories} | Protein: ${nutrition.protein}g`
    : '  No nutrition data'

  return `You are an expert performance coach with deep knowledge of modern sports science (Huberman, Attia, Galpin, Israetel). Analyze this week's data for Luke and write a focused, specific weekly review.

HEALTH CONTEXT:
${ctx.healthContext || '  Not provided'}

PROGRAM STATUS:
  Week ${p.weekNumber} of 12 · ${p.phase} Phase
  Current: ${p.currentWeight} lbs → Goal: ${p.goalWeight} lbs (${(p.lbsToGoal as number) > 0 ? `${p.lbsToGoal} lbs remaining` : 'GOAL REACHED'})

WEIGHT THIS WEEK:
${weights}

WORKOUTS THIS WEEK:
${workoutSummary}

CURRENT STRENGTH MAXES:
${maxesText}

NUTRITION (7-day avg):
${nutritionText}

Respond with EXACTLY these four sections using ### headers. Be specific to the numbers above — no generic advice. Max 300 words total.

### What's Working
2-3 specific observations backed by the data

### Needs Attention
2-3 specific gaps or issues from the data

### This Week's Priority
One clear, actionable focus for the coming week

### Science-Based Insight
One evidence-based recommendation directly relevant to Luke's current data, goals, or health context`
}
