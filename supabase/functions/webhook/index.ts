import { createClient } from "@supabase/supabase-js"
import { createHmac } from "node:crypto"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseKey)

const MP_WEBHOOK_SECRET = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET")!
const MP_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  })
}

/**
 * Valida assinatura do webhook conforme documentação MP
 * https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/notifications/webhooks
 */
function validateSignature(request: Request): boolean {
  const signature = request.headers.get("x-signature")
  const requestId = request.headers.get("x-request-id")

  if (!signature || !requestId) {
    console.warn("Missing signature or request ID")
    return false
  }

  const url = new URL(request.url)
  const dataId = url.searchParams.get("data.id") || ""

  // Parser signature: "ts=1699564800,v1=hash_value"
  const parts = signature.split(",")
  let ts = ""
  let v1Hash = ""

  for (const part of parts) {
    const [key, value] = part.trim().split("=")
    if (key === "ts") ts = value
    if (key === "v1") v1Hash = value
  }

  if (!ts || !v1Hash) {
    console.warn("Invalid signature format")
    return false
  }

    // Validar timestamp (não deve ser muito antigo)
  const timestamp = parseInt(ts)
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  if (diff > 600) { // 10 minutos de tolerância
    console.warn("Signature timestamp too old:", diff, "seconds")
    return false
  }

  // Calcular hash: SHA256(id:DATA.ID;request-id:REQUEST-ID;ts:TIMESTAMP;SECRET)
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const hmac = createHmac("sha256", MP_WEBHOOK_SECRET)
  const calculatedHash = hmac.update(manifest).digest("hex")

  const isValid = calculatedHash === v1Hash
  if (!isValid) {
    console.warn("Signature mismatch")
  }

  return isValid
}

/**
 * Fetch subscription details from Mercado Pago API
 */
async function fetchSubscriptionFromMP(preapprovalId: string) {
  try {
    const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`MP API error: ${response.status}`)
    }

    return await response.json()
  } catch (err) {
    console.error("Failed to fetch from MP:", err)
    return null
  }
}

/**
 * Update subscription status in DB and clinic plan
 */
async function updateSubscriptionStatus(
  subscriptionId: string,
  clinicId: string,
  newStatus: string
) {
  // Atualizar subscription
  const { error: subError } = await supabase
    .from("subscriptions")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId)

  if (subError) {
    console.error("Failed to update subscription:", subError)
    return false
  }

  // Se ativada, atualizar clinic para pro
  if (newStatus === "active") {
    const { error: clinicError } = await supabase
      .from("clinics")
      .update({ plan: "pro" })
      .eq("id", clinicId)

    if (clinicError) {
      console.error("Failed to update clinic:", clinicError)
    }
  }

  // Se cancelada/parada, downgrade para free
  if (newStatus === "cancelled" || newStatus === "paused" || newStatus === "payment_failed") {
    const { error: clinicError } = await supabase
      .from("clinics")
      .update({ plan: "free" })
      .eq("id", clinicId)

    if (clinicError) {
      console.error("Failed to downgrade clinic:", clinicError)
    }
  }

  return true
}

Deno.serve(async (req: Request) => {
  // OPTIONS para CORS
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

    console.log("Webhook received - type:", type, "action:", action, "data.id:", data?.id)

    if (type === "preapproval") {
      const mpPreapprovalId = data?.id
      if (!mpPreapprovalId) {
        return json({ error: "Missing preapproval ID" }, 400)
      }

      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("id, clinic_id, status")
        .eq("mercadopago_id", mpPreapprovalId)
        .single()

      if (subError || !subscription) {
        console.warn("Subscription not found for:", mpPreapprovalId)
        return json({ error: "Subscription not found" }, 404)
      }

      let newStatus = subscription.status

      switch (action) {
        case "preapproval.approved":
          newStatus = "active"
          console.log("Preapproval approved:", mpPreapprovalId)
          break

        case "preapproval.authorization_requested":
          newStatus = "pending"
          console.log("Authorization requested:", mpPreapprovalId)
          break

        case "preapproval.cancelled":
          newStatus = "cancelled"
          console.log("Preapproval cancelled:", mpPreapprovalId)
          break

        case "preapproval.paused":
          newStatus = "paused"
          console.log("Preapproval paused:", mpPreapprovalId)
          break

        case "preapproval.resumed":
          newStatus = "active"
          console.log("Preapproval resumed:", mpPreapprovalId)
          break

        case "preapproval.updated":
          const mpData = await fetchSubscriptionFromMP(mpPreapprovalId)
          if (mpData) {
            if (mpData.status === "active") {
              newStatus = "active"
            } else if (mpData.status === "cancelled") {
              newStatus = "cancelled"
            }
          }
          break
          console.log("Unhandled preapproval action:", action)
          return json({ success: true, action: "ignored" })
      }

      // Atualizar
      await updateSubscriptionStatus(subscription.id, subscription.clinic_id, newStatus)
      return json({ success: true, status: newStatus })
    }

        // PAYMENT (Authorized payment from preapproval)
    if (type === "payment") {
      const paymentId = data?.id
      if (!paymentId) {
        return json({ error: "Missing payment ID" }, 400)
      }

      console.log("Payment webhook - action:", action, "payment_id:", paymentId)

      // Buscar detalhes do pagamento
      const payment = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
      }).then(r => r.json()).catch(() => null)

      if (!payment) {
        console.error("Failed to fetch payment:", paymentId)
        return json({ success: true })
      }

      // Se tem preapproval_id vinculado
      const preapprovalId = payment.preapproval_id
      if (preapprovalId) {
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("id, clinic_id")
          .eq("mercadopago_id", preapprovalId)
          .single()

        if (subscription) {
          // Pagamento rejeitado -> downgrade
          if (payment.status === "rejected" || payment.status === "cancelled") {
            console.log("Payment failed, downgrading clinic:", subscription.clinic_id)
            await updateSubscriptionStatus(subscription.id, subscription.clinic_id, "payment_failed")
          }
        }
      }

      return json({ success: true, payment_status: payment.status })
    }

    console.log("Webhook type not handled:", type)
    return json({ success: true, handled: false })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Webhook error:", msg)
    return json({ error: msg }, 500)
  }
})