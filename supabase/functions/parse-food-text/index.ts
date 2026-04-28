import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { text } = await req.json() as { text: string }
    if (!text?.trim()) return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400, headers: corsHeaders })

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: `Estimate the total nutritional content for this food description. If multiple items, sum them all together into one total. Use standard US portion sizes when amounts aren't specified.

Food: "${text}"

Respond ONLY with valid JSON, no markdown, no explanation:
{"name":"<short descriptive name>","calories":<number>,"protein":<grams>,"carbs":<grams>,"fat":<grams>,"note":"<optional brief note about assumptions>"}`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: { message?: string } }).error?.message ?? `Anthropic error ${res.status}`)
    }

    const data = await res.json()
    const raw: string = data.content?.[0]?.text ?? ''
    const food = JSON.parse(raw)

    return new Response(JSON.stringify(food), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
