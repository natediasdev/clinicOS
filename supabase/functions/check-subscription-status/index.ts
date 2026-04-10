import { createClient } from "@supabase/supabase-js"

const supabaseUrl  = Deno.env.get("SUPABASE_URL")!
const supabaseKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

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
    const url = new URL(req.url)
    let clinicId = url.searchParams.get("clinic_id")

    // Se não veio na query string, tenta ler do body (POST)
    if (!clinicId && req.method === "POST") {
      try {
        const body = await req.json()
        clinicId = body?.clinic_id
      } catch {
        // ignore JSON parse errors
      }
    }

    if (!clinicId) {
      return json({ error: "clinic_id is required" }, 400)
    }

    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("*, trial_end")
      .eq("id", clinicId)
      .single()

    if (clinicError || !clinic) {
      return json({ error: "Clinic not found" }, 404)
    }

    if (clinic.trial_end && new Date(clinic.trial_end) > new Date()) {
      return json({
        active: true,
        status: "trial",
        daysRemaining: Math.ceil((new Date(clinic.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        clinic: { plan: clinic.plan, trial_end: clinic.trial_end },
      })
    }

    if (clinic.plan === "free") {
      return json({
        active: false,
        status: "free",
        reason: "Plano free",
        clinic: { plan: clinic.plan },
      })
    }

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("clinic_id", clinicId)
      .in("status", ["active", "trial"])
      .single()

    if (subError || !subscription) {
      await supabase
        .from("clinics")
        .update({ plan: "free" })
        .eq("id", clinicId)

      return json({
        active: false,
        status: "inactive",
        reason: "Nenhuma assinatura ativa",
        clinic: { plan: "free" },
      })
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
    console.error("Check subscription error:", msg)
    return json({ error: msg }, 500)
  }
})
