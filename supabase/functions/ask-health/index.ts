import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Citation {
  url: string
  title?: string
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

    const { question, userContext } = await req.json() as { question: string; userContext?: string }
    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: 'question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = `You are a knowledgeable health and fitness assistant. You provide evidence-based answers grounded in current sports science and medicine. Be specific, practical, and cite sources when possible. ${userContext ? `User context: ${userContext}` : ''}`

    const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        max_tokens: 800,
        return_citations: true,
        search_domain_filter: ['pubmed.ncbi.nlm.nih.gov', 'examine.com', 'nih.gov', 'mayoclinic.org', 'health.harvard.edu'],
      }),
    })

    if (!perplexityRes.ok) {
      const err = await perplexityRes.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `Perplexity error ${perplexityRes.status}`)
    }

    const data = await perplexityRes.json()
    const answer: string = data.choices?.[0]?.message?.content ?? ''
    const citations: Citation[] = (data.citations ?? []).map((c: string | { url: string; title?: string }) =>
      typeof c === 'string' ? { url: c } : { url: c.url, title: c.title }
    )

    // Persist to health_qa history
    await supabase.from('health_qa').insert({
      user_id: user.id,
      question,
      answer,
      citations,
    })

    return new Response(JSON.stringify({ answer, citations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
