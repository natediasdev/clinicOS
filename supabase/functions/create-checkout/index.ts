import { createClient } from "@supabase/supabase-js"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  })
}

const PLAN_PRICES = {
  monthly: 79,
  quarterly: Math.round(79 * 0.9 * 3),
  semiannual: Math.round(79 * 0.85 * 6),
}

const CYCLE_CONFIG = {
  monthly: { frequency: 1, frequency_type: "months" },
  quarterly: { frequency: 3, frequency_type: "months" },
  semiannual: { frequency: 6, frequency_type: "months" },
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

    // Validações
    if (!clinic_id || typeof clinic_id !== "string") {
      return json({ error: "clinic_id (string) is required" }, 400)
    }

    const cycle = billing_cycle as keyof typeof PLAN_PRICES
    if (!PLAN_PRICES[cycle]) {
      return json({ error: "Invalid billing_cycle: monthly, quarterly, or semiannual" }, 400)
    }

    // 1. Verificar clinic existe
    const { data: clinic } = await supabase
      .from("clinics")
      .select("id, name")
      .eq("id", clinic_id)
      .single()

    if (!clinic) {
      return json({ error: "Clinic not found" }, 404)
    }

    // 2. Buscar user da clinic (primeira pessoa que se registrou)
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("clinic_id", clinic_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .single()

    if (!userProfile) {
      return json({ error: "No users in clinic" }, 404)
    }

    // 3. Buscar email do user em auth.users
    let payerEmail: string | undefined
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(userProfile.id)
      payerEmail = authUser?.user?.email
    } catch (err) {
      console.error("Failed to fetch user email:", err)
    }

    if (!payerEmail) {
      return json({ error: "User has no email" }, 400)
    }

    // 4. Verificar se já existe subscription ativa para esta clinic
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("clinic_id", clinic_id)
      .in("status", ["active", "pending"])
      .limit(1)
      .single()

    if (existingSub) {
      return json({ 
        error: "Clinic already has an active or pending subscription",
        subscription_id: existingSub.id,
        status: existingSub.status 
      }, 409)
    }

    // 5. Criar preapproval no Mercado Pago
    const amount = PLAN_PRICES[cycle]
    const config = CYCLE_CONFIG[cycle]
    const externalRef = `SUB-${clinic_id}-${Date.now()}`

    const mpPayload = {
      reason: `ClinicOS Pro - ${clinic.name}`,
      external_reference: externalRef,
      payer_email: payerEmail,
      auto_recurring: {
        frequency: config.frequency,
        frequency_type: config.frequency_type,
        transaction_amount: amount,
        currency_id: "BRL",
        start_date: new Date().toISOString(),
        trial_days: 14, // 14 dias de trial
      },
      back_urls: {
        success: `${APP_URL}/dashboard?payment=success`,
        failure: `${APP_URL}/dashboard?payment=failure`,
        pending: `${APP_URL}/dashboard?payment=pending`,
      },
      statement_descriptor: "CLINICOS", // Nome que aparece no extrato
      notification_url: `${APP_URL}/webhook/mercadopago`, // Seu webhook
    }

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": externalRef, // Evita duplicatas
      },
      body: JSON.stringify(mpPayload),
    })

    const mpData = await mpResponse.json() as Record<string, unknown>

    if (!mpResponse.ok) {
      console.error("MP Error:", mpData)
      return json({ error: "Failed to create preapproval", details: mpData }, 400)
    }

    // 6. Salvar subscription no banco
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        clinic_id,
        billing_cycle: cycle,
        status: "pending",
        mercadopago_id: mpData.id,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (subError) {
      console.error("Database error:", subError)
      return json({ error: "Failed to create subscription record", details: subError }, 500)
    }

    // 7. Retornar init_point (URL do checkout)
    return json({
      success: true,
      subscription_id: subscription.id,
      init_point: mpData.init_point, // URL para redirecionar user
      mercadopago_id: mpData.id,
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Unexpected error:", msg)
    return json({ error: msg }, 500)
  }
})
