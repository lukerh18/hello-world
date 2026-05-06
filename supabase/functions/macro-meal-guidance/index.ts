import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  sugar?: number
}

interface MealOption {
  id: string
  name: string
  time?: string
  totals: MacroTotals
  items: string[]
}

interface MealRanking {
  id?: string
  fitScore?: number
  reason?: string
  caution?: string
}

interface MacroGuidance {
  headline?: string
  summary?: string
  eatMore?: string[]
  easeUp?: string[]
  mealRankings?: MealRanking[]
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function extractJson(text: string): MacroGuidance {
  const trimmed = text.trim()
  const withoutFence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1] ?? trimmed
  const jsonText = withoutFence.match(/\{[\s\S]*\}/)?.[0]
  if (!jsonText) throw new Error('AI returned unreadable macro guidance. Please try again.')
  return JSON.parse(jsonText) as MacroGuidance
}

function toMacro(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0
}

function cleanList(items: unknown): string[] {
  return Array.isArray(items)
    ? items.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
    : []
}

function cleanGuidance(raw: MacroGuidance, meals: MealOption[]): Required<MacroGuidance> {
  const knownMealIds = new Set(meals.map((meal) => meal.id))
  const mealRankings = Array.isArray(raw.mealRankings)
    ? raw.mealRankings
      .filter((ranking) => ranking.id && knownMealIds.has(ranking.id))
      .slice(0, meals.length)
      .map((ranking) => ({
        id: String(ranking.id),
        fitScore: Math.min(100, Math.max(0, toMacro(ranking.fitScore))),
        reason: String(ranking.reason ?? '').trim().slice(0, 160),
        caution: ranking.caution ? String(ranking.caution).trim().slice(0, 120) : '',
      }))
    : []

  return {
    headline: String(raw.headline ?? 'Macro guidance ready').trim().slice(0, 90),
    summary: String(raw.summary ?? 'Use the ranked meals below to steer the rest of today.').trim().slice(0, 220),
    eatMore: cleanList(raw.eatMore),
    easeUp: cleanList(raw.easeUp),
    mealRankings,
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Please sign in before using AI macro guidance.' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return jsonResponse({ error: 'Please sign in before using AI macro guidance.' }, 401)

    const { totals, targets, meals } = await req.json() as {
      totals: MacroTotals
      targets: MacroTotals
      meals: MealOption[]
    }
    if (!totals || !targets || !Array.isArray(meals) || meals.length === 0) {
      return jsonResponse({ error: 'Macro guidance needs today totals, targets, and meal options.' }, 400)
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return jsonResponse({ error: 'AI macro guidance is not configured. Add ANTHROPIC_API_KEY to Supabase Edge Function secrets.' }, 500)
    }

    const macroSnapshot = {
      consumed: totals,
      targets,
      remaining: {
        calories: Math.round((targets.calories ?? 0) - (totals.calories ?? 0)),
        protein: Math.round((targets.protein ?? 0) - (totals.protein ?? 0)),
        carbs: Math.round((targets.carbs ?? 0) - (totals.carbs ?? 0)),
        fat: Math.round((targets.fat ?? 0) - (totals.fat ?? 0)),
        sugar: Math.round((targets.sugar ?? 40) - (totals.sugar ?? 0)),
      },
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('ANTHROPIC_MACRO_GUIDANCE_MODEL') ?? 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [
          {
            role: 'user',
            content: `You are a calm nutrition macro coach inside a personal life tracker. Help the user reach today's macro goals without shame, intensity, or medical claims.

Macro snapshot:
${JSON.stringify(macroSnapshot, null, 2)}

Available suggested meals:
${JSON.stringify(meals, null, 2)}

Rank each available meal for the rest of today. Prefer meals that close protein/calorie gaps without pushing already-high macros much further. If a macro is over target, clearly name what to ease up on for the rest of the day. Keep guidance brief and practical.

Respond ONLY with valid JSON, no markdown:
{
  "headline":"<short outcome-focused headline>",
  "summary":"<1 sentence explaining what to do next>",
  "eatMore":["<macro or food type to prioritize>", "..."],
  "easeUp":["<macro or food type to limit>", "..."],
  "mealRankings":[
    {"id":"<meal id>","fitScore":<0-100>,"reason":"<why this helps>","caution":"<optional what to watch>"}
  ]
}`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const message = (err as { error?: { message?: string } }).error?.message ?? `Anthropic error ${res.status}`
      return jsonResponse({ error: message }, 502)
    }

    const data = await res.json()
    const raw: string = data.content?.[0]?.text ?? ''
    return jsonResponse(cleanGuidance(extractJson(raw), meals))
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
  }
})
