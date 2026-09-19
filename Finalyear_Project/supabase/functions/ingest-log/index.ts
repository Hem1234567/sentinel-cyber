import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // The SDK will send api_key, method, endpoint, status_code, response_time, ip_address, payload, user_identifier
    const body = await req.json()
    const { api_key, project_id: legacy_project_id, method, endpoint, status_code, response_time, ip_address, payload, user_agent } = body
    
    // 1. Identity Resolution
    const user_identifier = body.user_identifier || req.headers.get('x-user-id') || ip_address || 'unknown'
    const payload_size_bytes = payload ? JSON.stringify(payload).length : 0

    const provided_key = api_key || legacy_project_id

    // Look up actual project_id (UUID) using the api_key
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('api_key', provided_key)
      .single()

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Invalid API Key' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const project_id = project.id

    // 2. Baseline Lookup & Enforcement
    const { data: baseline } = await supabase
      .from('user_baselines')
      .select('*')
      .eq('project_id', project_id)
      .eq('user_identifier', user_identifier)
      .single()

    if (baseline?.is_blocked) {
      // Immediately log a CRITICAL alert and abort
      const { data: blockedLog } = await supabase.from('logs').insert([{ 
        project_id, method, endpoint, status_code: 403, response_time, ip_address, payload, user_identifier, payload_size_bytes 
      }]).select().single()
      
      await supabase.from('alerts').insert([{
        project_id,
        log_id: blockedLog?.id,
        type: 'BEHAVIORAL_ANOMALY',
        severity: 'CRITICAL',
        message: `Blocked user attempted access: ${user_identifier}`,
        metadata: { reason: 'User identity is revoked.' }
      }])

      return new Response(JSON.stringify({ error: 'Forbidden. Identity revoked.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Multi-Factor UEBA Scoring & Rule Engine Analysis
    let totalScore = 0
    const reasons: string[] = []
    const alertsToCreate: any[] = []

    let decodedEndpoint = endpoint
    try {
      decodedEndpoint = decodeURIComponent(endpoint)
    } catch (e) {}

    const inputString = JSON.stringify({ endpoint: decodedEndpoint, payload })
    
    // Calculate current hour in IST
    const now = new Date()
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const currentHour = istTime.getHours()

    if (baseline) {
      if (currentHour < baseline.typical_start_hour || currentHour > baseline.typical_end_hour) {
        totalScore += 30
        reasons.push(`Off-hours activity at ${currentHour}:00`)
      }

      if (baseline.frequent_endpoints && baseline.frequent_endpoints.length > 0 && !baseline.frequent_endpoints.includes(endpoint)) {
        totalScore += 35
        reasons.push(`Unusual endpoint access: ${endpoint}`)
      }

      if (payload_size_bytes > (baseline.max_expected_bytes * 2)) {
        totalScore += 35
        reasons.push(`Abnormal payload volume: ${payload_size_bytes} bytes`)
      }
    }

    if ([401, 403, 404].includes(status_code)) {
      totalScore += 15
      reasons.push(`Suspicious HTTP status: ${status_code}`)
    }

    // Rule Engine Checks
    // SQL Injection Detection
    const sqliPattern = /(\b(UNION\s+(?:ALL\s+)?SELECT|INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+.*?\s+SET|DROP\s+TABLE|ALTER\s+TABLE)\b|OR\s+1=1|'\s*OR\s*'1'\s*=\s*'1|"\s*OR\s*"1"\s*=\s*"1|--|;.*?\b(?:DROP|ALTER|INSERT|UPDATE|DELETE|SELECT)\b)/i;
    if (sqliPattern.test(inputString)) {
      totalScore += 80
      alertsToCreate.push({ project_id, type: 'SQL_INJECTION', severity: 'CRITICAL', message: 'Potential SQL Injection payload detected in request.' })
    }

    // XSS Detection
    const xssPattern = /<script.*?>|javascript:|onload=|onerror=|eval\(/i;
    if (xssPattern.test(inputString)) {
      totalScore += 60
      alertsToCreate.push({ project_id, type: 'XSS_ATTEMPT', severity: 'HIGH', message: 'Potential XSS payload detected in request.' })
    }

    // Directory Traversal Detection
    const dirTraversalPattern = /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c|etc\/passwd|windows\\system32)/i;
    if (dirTraversalPattern.test(inputString)) {
      totalScore += 60
      alertsToCreate.push({ project_id, type: 'DIRECTORY_TRAVERSAL', severity: 'HIGH', message: 'Potential Directory Traversal attempt detected.' })
    }

    // Suspicious User Agent Detection
    if (user_agent) {
      const suspiciousUAPattern = /(sqlmap|nmap|curl|wget|nikto|scanner|postman)/i;
      if (suspiciousUAPattern.test(user_agent)) {
        totalScore += 20
        alertsToCreate.push({ project_id, type: 'SUSPICIOUS_USER_AGENT', severity: 'MEDIUM', message: `Suspicious User-Agent detected: ${user_agent}` })
      }
    }

    // Malformed JSON / Bad Request
    if (status_code === 400) {
      totalScore += 10
      alertsToCreate.push({ project_id, type: 'MALFORMED_PAYLOAD', severity: 'MEDIUM', message: `Bad Request (400) detected. Possible malformed payload or syntax error.` })
    }

    // High Latency
    if (response_time > 2000) {
      alertsToCreate.push({ project_id, type: 'HIGH_LATENCY', severity: 'MEDIUM', message: `High latency detected: ${response_time}ms.` })
    }

    // 4. Insert the log
    const { data: logData, error: logError } = await supabase
      .from('logs')
      .insert([
        {
          project_id,
          method,
          endpoint,
          status_code,
          response_time,
          ip_address,
          payload,
          user_identifier,
          payload_size_bytes,
          risk_score: totalScore
        }
      ])
      .select()
      .single()

    if (logError) {
      console.error('Error inserting log:', logError)
      return new Response(JSON.stringify({ error: logError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const logId = logData.id

    // 5. Update alerts with logId
    alertsToCreate.forEach(a => a.log_id = logId)

    if (totalScore >= 40 && reasons.length > 0) {
      let severity = 'MEDIUM'
      if (totalScore >= 80) severity = 'CRITICAL'
      else if (totalScore >= 60) severity = 'HIGH'

      alertsToCreate.push({
        project_id,
        type: 'BEHAVIORAL_ANOMALY',
        severity,
        message: reasons.join(' | '),
        log_id: logId,
        metadata: {
          risk_score: totalScore,
          user_identifier,
          reasons,
          expected: baseline ? {
            hours: `${baseline.typical_start_hour}:00 - ${baseline.typical_end_hour}:00`,
            endpoints: baseline.frequent_endpoints,
            max_bytes: baseline.max_expected_bytes
          } : null,
          observed: {
            hour: `${currentHour}:00`,
            endpoint,
            bytes: payload_size_bytes,
            status_code
          }
        }
      })
    }

    // Insert alerts if any
    if (alertsToCreate.length > 0) {
      const { error: alertError } = await supabase
        .from('alerts')
        .insert(alertsToCreate)
      
      if (alertError) {
        console.error('Error inserting alerts:', alertError)
      }
    }

    return new Response(JSON.stringify({ success: true, logId }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
