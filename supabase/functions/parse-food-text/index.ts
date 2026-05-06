import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParsedFood {
  name?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  sugar?: number
  note?: string
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function toMacroNumber(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0
}

function extractJson(text: string): ParsedFood {
  const trimmed = text.trim()
  const withoutFence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1] ?? trimmed
  const jsonText = withoutFence.match(/\{[\s\S]*\}/)?.[0]
  if (!jsonText) throw new Error('AI returned an unreadable nutrition estimate. Please try again.')
  return JSON.parse(jsonText) as ParsedFood
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Please sign in before using AI nutrition estimates.' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return jsonResponse({ error: 'Please sign in before using AI nutrition estimates.' }, 401)

    const { text } = await req.json() as { text: string }
    if (!text?.trim()) return jsonResponse({ error: 'Describe what you ate before estimating macros.' }, 400)

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return jsonResponse({ error: 'AI nutrition is not configured. Add ANTHROPIC_API_KEY to Supabase Edge Function secrets.' }, 500)
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('ANTHROPIC_FOOD_TEXT_MODEL') ?? 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `Estimate the total nutritional content for this food description. If multiple items, sum them all together into one total. Use standard US portion sizes when amounts aren't specified.

Food: "${text}"

Respond ONLY with valid JSON, no markdown, no explanation:
{"name":"<short descriptive name>","calories":<number>,"protein":<grams>,"carbs":<grams>,"fat":<grams>,"sugar":<grams>,"note":"<optional brief note about assumptions>"}`,
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
    const parsed = extractJson(raw)
    const food = {
      name: parsed.name?.trim() || text.trim().slice(0, 60),
      calories: toMacroNumber(parsed.calories),
      protein: toMacroNumber(parsed.protein),
      carbs: toMacroNumber(parsed.carbs),
      fat: toMacroNumber(parsed.fat),
      ...(parsed.sugar != null ? { sugar: toMacroNumber(parsed.sugar) } : {}),
      ...(parsed.note?.trim() ? { note: parsed.note.trim() } : {}),
    }

    return jsonResponse(food)
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
  }
})
