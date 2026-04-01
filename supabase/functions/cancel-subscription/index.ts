import { createClient } from "@supabase/supabase-js"

const supabaseUrl  = Deno.env.get("SUPABASE_URL")!
const supabaseKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!

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

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  try {
    const body = await req.json()
    const { subscription_id } = body

    if (!subscription_id) {
      return json({ error: "subscription_id is required" }, 400)
    }

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*, clinic:clinics(*)")
      .eq("id", subscription_id)
      .single()

    if (subError || !subscription) {
      return json({ error: "Subscription not found" }, 404)
    }

    if (subscription.status !== "active" && subscription.status !== "trial") {
      return json({ error: "Subscription is not active" }, 400)
    }

    if (subscription.mercadopago_id) {
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscription.mercadopago_id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      })

      if (!mpResponse.ok) {
        const mpError = await mpResponse.json()
        console.error("Mercado Pago cancel error:", mpError)
      }
    }

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription_id)

    if (updateError) {
      return json({ error: "Failed to update subscription" }, 500)
    }

    await supabase
      .from("clinics")
      .update({ plan: "free" })
      .eq("id", subscription.clinic_id)

    return json({ success: true, status: "cancelled" })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Cancel subscription error:", msg)
    return json({ error: msg }, 500)
  }
})
