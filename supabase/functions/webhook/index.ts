import { createClient } from "@supabase/supabase-js"

const supabaseUrl  = Deno.env.get("SUPABASE_URL")!
const supabaseKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

const MP_WEBHOOK_SECRET = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET")!

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

function validateSignature(request: Request): boolean {
  const signature = request.headers.get("x-signature")
  const requestId = request.headers.get("x-request-id")
  
  if (!signature || !requestId) {
    return false
  }

  const url = new URL(request.url)
  const dataId = url.searchParams.get("data.id") || ""
  
  const parts = signature.split(",")
  let ts = ""
  let hashReceived = ""
  
  for (const part of parts) {
    const [key, value] = part.split("=", 1)
    if (key.trim() === "ts") ts = value.trim()
    if (key.trim() === "v1") hashReceived = value.trim()
  }

  if (!ts || !hashReceived) {
    return false
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const hmac = createHmac("sha256", MP_WEBHOOK_SECRET)
  const hashCalculated = hmac.update(manifest).digest("hex")

  return hashCalculated === hashReceived
}

async function updateClinicAccess(clinicId: string, blocked: boolean) {
  const { error } = await supabase
    .from("clinics")
    .update({ 
      plan: blocked ? "free" : "pro",
    })
    .eq("id", clinicId)

  if (error) {
    console.error("Failed to update clinic plan:", error)
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS })
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  if (!validateSignature(req)) {
    console.warn("Invalid webhook signature")
    return json({ error: "Invalid signature" }, 401)
  }

  try {
    const body = await req.json()
    const { type, action, data } = body

    console.log("Webhook received:", { type, action, data })

    if (type === "preapproval") {
      const mpSubscriptionId = data?.id
      if (!mpSubscriptionId) {
        return json({ error: "Missing subscription ID" }, 400)
      }

      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("*, clinic:clinics(*)")
        .eq("mercadopago_id", mpSubscriptionId)
        .single()

      if (subError || !subscription) {
        console.error("Subscription not found:", mpSubscriptionId)
        return json({ error: "Subscription not found" }, 404)
      }

      let newStatus = subscription.status

      switch (action) {
        case "preapproval.approved":
          newStatus = "active"
          break
        case "preapproval.cancelled":
          newStatus = "cancelled"
          await updateClinicAccess(subscription.clinic_id, true)
          break
        case "preapproval.paused":
          newStatus = "paused"
          await updateClinicAccess(subscription.clinic_id, true)
          break
        case "preapproval.resumed":
          newStatus = "active"
          await updateClinicAccess(subscription.clinic_id, false)
          break
        case "preapproval.updated":
          const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${mpSubscriptionId}`, {
            headers: { "Authorization": `Bearer ${Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")}` },
          })
          if (mpResponse.ok) {
            const mpData = await mpResponse.json()
            if (mpData.status === "active") {
              newStatus = "active"
            } else if (mpData.status === "cancelled") {
              newStatus = "cancelled"
              await updateClinicAccess(subscription.clinic_id, true)
            }
          }
          break
        default:
          console.log("Unhandled action:", action)
      }

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)

      if (updateError) {
        console.error("Failed to update subscription:", updateError)
        return json({ error: "Failed to update subscription" }, 500)
      }

      return json({ success: true, status: newStatus })
    }

    if (type === "payment") {
      const paymentId = data?.id
      if (!paymentId) {
        return json({ error: "Missing payment ID" }, 400)
      }

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { "Authorization": `Bearer ${Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")}` },
      })

      if (!mpResponse.ok) {
        return json({ error: "Failed to fetch payment" }, 500)
      }

      const payment = await mpResponse.json()

      if (payment.status === "rejected" || payment.status === "cancelled" || payment.status === "refunded") {
        const { data: subByClinic } = await supabase
          .from("subscriptions")
          .select("clinic_id")
          .eq("status", "active")
          .single()

        if (subByClinic) {
          await updateClinicAccess(subByClinic.clinic_id, true)
        }
      }

      return json({ success: true, paymentStatus: payment.status })
    }

    return json({ success: true, handled: false })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Webhook error:", msg)
    return json({ error: msg }, 500)
  }
})
