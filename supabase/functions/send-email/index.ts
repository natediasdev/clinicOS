import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabaseUrl  = Deno.env.get("SUPABASE_URL")!
const supabaseKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const resendApiKey = Deno.env.get("RESEND_API_KEY")!

const supabase = createClient(supabaseUrl, supabaseKey)
const resend   = new Resend(resendApiKey)

// ─── CORS ─────────────────────────────────────────────────────────────────────
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

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

// ─── Templates ────────────────────────────────────────────────────────────────
function buildChargeEmail(
  patientName: string,
  clinicName: string,
  clinicPhone: string | null,
  amount: number,
  description: string,
) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb">
  <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
    <div style="margin-bottom:24px">
      <span style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.5px">
        Clinic<span style="color:#3b82f6">OS</span>
      </span>
    </div>
    <h2 style="margin:0 0 8px;font-size:20px;color:#1f2937">Lembrete de pagamento</h2>
    <p style="margin:0 0 20px;color:#6b7280">Olá <strong style="color:#1f2937">${patientName}</strong>,</p>
    <p style="margin:0 0 20px;color:#374151">
      Identificamos um pagamento pendente referente aos seus atendimentos em
      <strong>${clinicName}</strong>.
    </p>
    <div style="background:#eff6ff;border-radius:8px;padding:20px;margin:0 0 20px;border-left:4px solid #3b82f6">
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Valor pendente</p>
      <p style="margin:0;font-size:28px;font-weight:800;color:#dc2626;letter-spacing:-1px">${fmtBRL(amount)}</p>
      ${description ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280">${description}</p>` : ""}
    </div>
    <p style="margin:0 0 20px;color:#374151">Por favor, entre em contato para regularizar o pagamento.</p>
    ${clinicPhone ? `<p style="margin:0 0 20px;color:#374151">📞 <strong>${clinicPhone}</strong></p>` : ""}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="margin:0;font-size:12px;color:#9ca3af">${clinicName} · Enviado via ClinicOS</p>
  </div>
</body>
</html>`
}

function buildReminderEmail(
  patientName: string,
  clinicName: string,
  clinicPhone: string | null,
  datetime: string,
) {
  const d       = new Date(datetime)
  const dateStr = d.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" })
  const timeStr = d.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb">
  <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
    <div style="margin-bottom:24px">
      <span style="font-size:20px;font-weight:800;color:#0f172a;letter-spacing:-0.5px">
        Clinic<span style="color:#3b82f6">OS</span>
      </span>
    </div>
    <h2 style="margin:0 0 8px;font-size:20px;color:#1f2937">Lembrete de consulta</h2>
    <p style="margin:0 0 20px;color:#6b7280">Olá <strong style="color:#1f2937">${patientName}</strong>,</p>
    <p style="margin:0 0 20px;color:#374151">
      Este é um lembrete do seu agendamento em <strong>${clinicName}</strong>.
    </p>
    <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:0 0 20px;border-left:4px solid #22c55e">
      <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Seu agendamento</p>
      <p style="margin:0;font-size:18px;font-weight:800;color:#15803d">${dateStr}</p>
      <p style="margin:4px 0 0;font-size:15px;color:#166534">às ${timeStr}</p>
    </div>
    <p style="margin:0 0 20px;color:#374151">Caso precise reagendar ou cancelar, entre em contato com antecedência.</p>
    ${clinicPhone ? `<p style="margin:0 0 20px;color:#374151">📞 <strong>${clinicPhone}</strong></p>` : ""}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="margin:0;font-size:12px;color:#9ca3af">${clinicName} · Enviado via ClinicOS</p>
  </div>
</body>
</html>`
}

// ─── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {

  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS })
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  try {
    const body = await req.json()
    const { type, patient_id, clinic_id, payment_id, appointment_id } = body

    if (!type || !patient_id || !clinic_id) {
      return json({ error: "Missing required fields: type, patient_id, clinic_id" }, 400)
    }

    if (type !== "charge" && type !== "reminder") {
      return json({ error: `Type "${type}" not supported. Use "charge" or "reminder"` }, 400)
    }

    // 1. Paciente
    const { data: patient, error: patientError } = await supabase
      .from("patients").select("name, email").eq("id", patient_id).single()

    if (patientError || !patient) return json({ error: "Patient not found" }, 404)
    if (!patient.email)           return json({ error: "Patient has no email address" }, 400)

    // 2. Clínica
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics").select("name, phone, sender_email").eq("id", clinic_id).single()

    if (clinicError || !clinic) return json({ error: "Clinic not found" }, 404)

    // sender_email obrigatório e verificado no Resend
    if (!clinic.sender_email) {
      return json({
        error: "sender_email not configured. Set it in Perfil da Clínica and verify the domain in Resend."
      }, 400)
    }

    const from = `${clinic.name} <${clinic.sender_email}>`
    let subject = ""
    let html    = ""

    // 3. Montar por tipo
    if (type === "charge") {
      if (!payment_id) return json({ error: "payment_id required for type=charge" }, 400)

      const { data: payment } = await supabase
        .from("payments")
        .select("amount, final_amount, description")
        .eq("id", payment_id).single()

      subject = `Pagamento pendente — ${clinic.name}`
      html    = buildChargeEmail(
        patient.name, clinic.name, clinic.phone,
        payment?.final_amount ?? payment?.amount ?? 0,
        payment?.description ?? "",
      )
    }

    if (type === "reminder") {
      if (!appointment_id) return json({ error: "appointment_id required for type=reminder" }, 400)

      const { data: appt } = await supabase
        .from("appointments").select("datetime").eq("id", appointment_id).single()

      if (!appt) return json({ error: "Appointment not found" }, 404)

      subject = `Lembrete de consulta — ${clinic.name}`
      html    = buildReminderEmail(patient.name, clinic.name, clinic.phone, appt.datetime)
    }

    // 4. Enviar
    const result = await resend.emails.send({ from, to: patient.email, subject, html })

    const status       = result.error ? "failed" : "sent"
    const errorMessage = result.error ? result.error.message : null

    // 5. Log
    await supabase.from("email_logs").insert({
      clinic_id,
      patient_id,
      payment_id:     payment_id     ?? null,
      appointment_id: appointment_id ?? null,
      type,
      to_email:      patient.email,
      subject,
      status,
      error_message: errorMessage,
      sent_at:       new Date().toISOString(),
    })

    if (result.error) {
      return json({ success: false, error: result.error.message }, 500)
    }

    return json({ success: true, emailId: result.data?.id })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return json({ success: false, error: msg }, 500)
  }
})
