import { createClient } from "@supabase/supabase-js"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase    = createClient(supabaseUrl, supabaseKey)

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS })
  }
  
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  try {
    // Lê clinic_id do body (POST via supabase.functions.invoke)
    // ou da query string (GET direto) — suporta ambos
    let clinicId: string | null = null

    if (req.method === "POST") {
      try {
        const body = await req.json()
        clinicId = body?.clinic_id ?? null
      } catch { /* body vazio — tenta query string */ }
    }

    if (!clinicId) {
      clinicId = new URL(req.url).searchParams.get("clinic_id")
    }

    if (!clinicId) return json({ error: "clinic_id is required" }, 400)

    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id, plan, trial_end")
      .eq("id", clinicId)
      .single()

    if (clinicError || !clinic) return json({ error: "Clinic not found" }, 404)

    // Trial ativo?
    if (clinic.trial_end && new Date(clinic.trial_end) > new Date()) {
      const daysRemaining = Math.ceil(
        (new Date(clinic.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return json({ active: true, status: "trial", daysRemaining,
        clinic: { plan: clinic.plan, trial_end: clinic.trial_end } })
    }

    // Plano free
    if (clinic.plan === "free") {
      return json({ active: false, status: "free", reason: "Plano free",
        clinic: { plan: clinic.plan } })
    }

    // Verifica assinatura ativa
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, status, billing_cycle, current_period_end, mercadopago_id")
      .eq("clinic_id", clinicId)
      .in("status", ["active", "trial"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!subscription) {
      await supabase.from("clinics").update({ plan: "free" }).eq("id", clinicId)
      return json({ active: false, status: "inactive",
        reason: "Nenhuma assinatura ativa", clinic: { plan: "free" } })
    }

    return json({
      active: true,
      status: subscription.status,
      subscription: {
        id: subscription.id,
        billingCycle: subscription.billing_cycle,
        currentPeriodEnd: subscription.current_period_end,
        mercadopagoId: subscription.mercadopago_id,
      },
      clinic: { plan: clinic.plan },
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("check-subscription-status error:", msg)
    return json({ error: msg }, 500)
  }
})