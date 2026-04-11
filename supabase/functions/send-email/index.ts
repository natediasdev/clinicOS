import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase    = createClient(supabaseUrl, supabaseKey)

// CRÍTICO: não usar ! aqui — se RESEND_API_KEY não estiver configurada,
// o Deno crasha no module init e o OPTIONS retorna 500 (causa do bug CORS).
const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? ""

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json", ...CORS },
  })
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

function buildChargeEmail(patientName: string, clinicName: string, clinicPhone: string | null, amount: number, description: string) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb">
  <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
    <h2 style="margin:0 0 16px">Lembrete de pagamento</h2>
    <p>Olá <strong>${patientName}</strong>,</p>
    <p>Identificamos um pagamento pendente em <strong>${clinicName}</strong>.</p>
    <div style="background:#eff6ff;border-radius:8px;padding:20px;margin:16px 0;border-left:4px solid #3b82f6">
      <p style="margin:0;font-size:13px;color:#6b7280">VALOR PENDENTE</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#dc2626">${fmtBRL(amount)}</p>
      ${description ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280">${description}</p>` : ""}
    </div>
    ${clinicPhone ? `<p>☎️ <strong>${clinicPhone}</strong></p>` : ""}
    <p style="font-size:12px;color:#9ca3af">${clinicName} · Enviado via ClinicOS</p>
  </div>
</body></html>`
}

function buildReminderEmail(patientName: string, clinicName: string, clinicPhone: string | null, datetime: string) {
  const d = new Date(datetime)
  const dateStr = d.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", timeZone:"America/Sao_Paulo" })
  const timeStr = d.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit", timeZone:"America/Sao_Paulo" })
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb">
  <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
    <h2 style="margin:0 0 16px">Lembrete de consulta</h2>
    <p>Olá <strong>${patientName}</strong>,</p>
    <p>Lembrete do seu agendamento em <strong>${clinicName}</strong>.</p>
    <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:16px 0;border-left:4px solid #22c55e">
      <p style="margin:0;font-size:18px;font-weight:800;color:#15803d">${dateStr}</p>
      <p style="margin:4px 0 0;color:#166534">às ${timeStr}</p>
    </div>
    ${clinicPhone ? `<p>☎️ <strong>${clinicPhone}</strong></p>` : ""}
    <p style="font-size:12px;color:#9ca3af">${clinicName} · Enviado via ClinicOS</p>
  </div>
</body></html>`
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405)

  // Verificação da key aqui — não no top-level
  if (!resendApiKey) {
    return json({ error: "RESEND_API_KEY not configured. Set it via: supabase secrets set RESEND_API_KEY=re_..." }, 503)
  }

  try {
    const body = await req.json()
    const { type, patient_id, clinic_id, payment_id, appointment_id } = body

    if (!type || !patient_id || !clinic_id) {
      return json({ error: "Missing required fields: type, patient_id, clinic_id" }, 400)
    }
    if (type !== "charge" && type !== "reminder") {
      return json({ error: `Type "${type}" not supported. Use "charge" or "reminder"` }, 400)
    }

    const { data: patient } = await supabase.from("patients").select("name, email").eq("id", patient_id).single()
    if (!patient)       return json({ error: "Patient not found" }, 404)
    if (!patient.email) return json({ error: "Patient has no email" }, 400)

    const { data: clinic } = await supabase.from("clinics").select("name, phone, sender_email").eq("id", clinic_id).single()
    if (!clinic)              return json({ error: "Clinic not found" }, 404)
    if (!clinic.sender_email) return json({ error: "sender_email not configured in clinic profile" }, 400)

    const from = `${clinic.name} <${clinic.sender_email}>`
    let subject = ""
    let html    = ""

    if (type === "charge") {
      if (!payment_id) return json({ error: "payment_id required for type=charge" }, 400)
      const { data: payment } = await supabase.from("payments")
        .select("amount, final_amount, description").eq("id", payment_id).single()
      subject = `Pagamento pendente — ${clinic.name}`
      html    = buildChargeEmail(patient.name, clinic.name, clinic.phone,
        payment?.final_amount ?? payment?.amount ?? 0, payment?.description ?? "")
    }

    if (type === "reminder") {
      if (!appointment_id) return json({ error: "appointment_id required for type=reminder" }, 400)
      const { data: appt } = await supabase.from("appointments").select("datetime").eq("id", appointment_id).single()
      if (!appt) return json({ error: "Appointment not found" }, 404)
      subject = `Lembrete de consulta — ${clinic.name}`
      html    = buildReminderEmail(patient.name, clinic.name, clinic.phone, appt.datetime)
    }

    const resend = new Resend(resendApiKey)
    const result = await resend.emails.send({ from, to: patient.email, subject, html })
    const status = result.error ? "failed" : "sent"

    await supabase.from("email_logs").insert({
      clinic_id, patient_id,
      payment_id:     payment_id ?? null,
      appointment_id: appointment_id ?? null,
      type, to_email: patient.email, subject, status,
      error_message: result.error?.message ?? null,
      sent_at: new Date().toISOString(),
    })

    if (result.error) return json({ success: false, error: result.error.message }, 500)
    return json({ success: true, emailId: result.data?.id })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return json({ success: false, error: msg }, 500)
  }
})
