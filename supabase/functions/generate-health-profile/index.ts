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

    const inputs = await req.json() as {
      age?: number
      heightIn?: number
      weightLbs?: number
      goalWeightLbs?: number
      activityLevel?: string
      healthGoals?: string
      knownConditions?: string
      bloodwork?: string
      medications?: string
      sleepHours?: number
    }

    const prompt = buildPrompt(inputs)

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are an expert health analyst. Generate a concise, structured health profile based on the information provided. Focus on actionable insights, key biomarker context, and personalized recommendations. Be specific and data-driven.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        return_citations: true,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `Perplexity error ${res.status}`)
    }

    const data = await res.json()
    const profile: string = data.choices?.[0]?.message?.content ?? ''

    // Save to user's profile health_context
    await supabase.from('profiles').upsert(
      { id: user.id, health_context: profile },
      { onConflict: 'id' }
    )

    return new Response(JSON.stringify({ profile }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function buildPrompt(inputs: Record<string, unknown>): string {
  const lines: string[] = ['Generate a structured health profile for use as AI coaching context. Include relevant health insights, risk factors, and personalized recommendations based on this data:\n']

  if (inputs.age) lines.push(`Age: ${inputs.age}`)
  if (inputs.heightIn) {
    const ft = Math.floor((inputs.heightIn as number) / 12)
    const inches = (inputs.heightIn as number) % 12
    lines.push(`Height: ${ft}'${inches}"`)
  }
  if (inputs.weightLbs) lines.push(`Current weight: ${inputs.weightLbs} lbs`)
  if (inputs.goalWeightLbs) lines.push(`Goal weight: ${inputs.goalWeightLbs} lbs`)
  if (inputs.activityLevel) lines.push(`Activity level: ${inputs.activityLevel}`)
  if (inputs.sleepHours) lines.push(`Average sleep: ${inputs.sleepHours} hours/night`)
  if (inputs.healthGoals) lines.push(`\nHealth goals: ${inputs.healthGoals}`)
  if (inputs.knownConditions) lines.push(`Known conditions: ${inputs.knownConditions}`)
  if (inputs.medications) lines.push(`Medications/supplements: ${inputs.medications}`)
  if (inputs.bloodwork) lines.push(`\nBloodwork / lab results:\n${inputs.bloodwork}`)

  lines.push('\nFormat the profile with these sections: ## Current Status, ## Key Insights, ## Optimization Priorities, ## Watch Points. Keep it under 600 words. Be specific to the numbers provided.')

  return lines.join('\n')
}
