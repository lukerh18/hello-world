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

    const { data: profile } = await supabase
      .from('profiles')
      .select('oura_token')
      .eq('id', user.id)
      .single()

    const token = profile?.oura_token as string | null
    if (!token) {
      return new Response(JSON.stringify({ error: 'No Oura token configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { date } = await req.json() as { date: string }
    if (!date) {
      return new Response(JSON.stringify({ error: 'date is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    async function fetchEndpoint(endpoint: string) {
      const url = `https://api.ouraring.com/v2/usercollection/${endpoint}?start_date=${date}&end_date=${date}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return null
      const json = await res.json()
      return (json.data ?? [])[0] ?? null
    }

    const [readiness, sleep, activity] = await Promise.all([
      fetchEndpoint('daily_readiness'),
      fetchEndpoint('daily_sleep'),
      fetchEndpoint('daily_activity'),
    ])

    return new Response(JSON.stringify({ readiness, sleep, activity }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
