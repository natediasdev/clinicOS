import { createClient } from "https://esm.sh"

const supabaseUrl  = Deno.env.get("SUPABASE_URL")!
const supabaseKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!
const MP_WEBHOOK_SECRET = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET")!
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173"

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  })
}

const PLAN_PRICES = {
  monthly:    79,
  quarterly:  Math.round(79 * 0.90 * 3),
  semiannual: Math.round(79 * 0.85 * 6),
}

const CYCLE_DAYS = {
  monthly:    30,
  quarterly:  90,
  semiannual: 180,
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS })
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  try {
    const body = await req.json()
    const { clinic_id, billing_cycle = "monthly" } = body

    if (!clinic_id) {
      return json({ error: "clinic_id is required" }, 400)
    }

    if (!PLAN_PRICES[billing_cycle as keyof typeof PLAN_PRICES]) {
      return json({ error: "Invalid billing_cycle. Use: monthly, quarterly, or semiannual" }, 400)
    }

    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id, name, plan")
      .eq("id", clinic_id)
      .single()

    if (clinicError || !clinic) {
      return json({ error: "Clinic not found" }, 404)
    }

    const { data: owner, error: ownerError } = await supabase
      .from("clinic_staff")
      .select("user_id, user:users(email)")
      .eq("clinic_id", clinic_id)
      .eq("role", "owner")
      .single()

    if (ownerError || !owner) {
      return json({ error: "Clinic owner not found" }, 404)
    }

    const payerEmail = owner.user?.email
    if (!payerEmail) {
      return json({ error: "Owner has no email" }, 400)
    }

    const amount = PLAN_PRICES[billing_cycle as keyof typeof PLAN_PRICES]
    const externalRef = `CLINIC-${clinic_id}-${Date.now()}`

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: `ClinicOS Pro - ${clinic.name}`,
        external_reference: externalRef,
        payer_email: payerEmail,
        auto_recurring: {
          frequency: billing_cycle === "monthly" ? 1 : billing_cycle === "quarterly" ? 3 : 6,
          frequency_type: "months",
          transaction_amount: billing_cycle === "monthly" ? amount : undefined,
          currency_id: "BRL",
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + (CYCLE_DAYS[billing_cycle as keyof typeof CYCLE_DAYS] * 24 * 60 * 60 * 1000) + (30 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        back_url: `${APP_URL}/subscription/success?clinic_id=${clinic_id}`,
        status: "pending",
      }),
    })

    const mpData = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error("Mercado Pago error:", mpData)
      return json({ error: "Failed to create subscription", details: mpData }, 500)
    }

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        clinic_id,
        billing_cycle,
        status: "pending",
        mercadopago_id: mpData.id,
        current_period_end: new Date(Date.now() + (CYCLE_DAYS[billing_cycle as keyof typeof CYCLE_DAYS] * 24 * 60 * 60 * 1000)).toISOString(),
      })
      .select()
      .single()

    if (subError) {
      console.error("Subscription insert error:", subError)
      return json({ error: "Failed to save subscription" }, 500)
    }

    await supabase
      .from("clinics")
      .update({ 
        plan: "pro",
        subscription_id: subscription.id 
      })
      .eq("id", clinic_id)

    return json({
      subscriptionId: subscription.id,
      mercadopagoId: mpData.id,
      initPoint: mpData.init_point,
      status: "pending",
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Create checkout error:", msg)
    return json({ error: msg }, 500)
  }
})
