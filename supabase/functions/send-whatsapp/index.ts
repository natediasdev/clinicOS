/**
 * send-whatsapp — Edge Function
 * 
 * Tipos suportados:
 *   "reminder"     — lembrete 24h antes da consulta (chamado pelo cron)
 *   "confirmation" — confirmação imediata ao criar agendamento
 *   "charge"       — cobrança de pagamento pendente
 * 
 * Vars de ambiente necessárias:
 *   EVOLUTION_API_URL      — ex: https://seu-app.railway.app
 *   EVOLUTION_API_KEY      — apikey global da Evolution API
 *   EVOLUTION_INSTANCE     — nome da instância criada (ex: "clinicos-dev")
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase    = createClient(supabaseUrl, supabaseKey)

const EVO_URL      = Deno.env.get("EVOLUTION_API_URL")!
const EVO_KEY      = Deno.env.get("EVOLUTION_API_KEY")!
const EVO_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE") ?? "clinicos"

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

// Formata número para WhatsApp: remove não-dígitos, garante DDI 55
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("55") && digits.length >= 12) return digits
  if (digits.length === 11 || digits.length === 10) return `55${digits}`
  return digits
}

// Envia mensagem via Evolution API e loga resultado
async function sendMessage(
  phone: string,
  text: string,
  logData: {
    clinic_id?: string
    patient_id?: string
    appointment_id?: string
    payment_id?: string
    type: string
  }
) {
  const number = formatPhone(phone)
  let status = "sent"
  let error: string | null = null

  try {
    const res = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVO_KEY,
      },
      body: JSON.stringify({
        number,
        text,
        delay: 1000,
        linkPreview: false,
      }),
    })

    const data = await res.json()
    console.log(`WA send to ${number}:`, res.status, JSON.stringify(data))

    if (!res.ok) {
      status = "failed"
      error = JSON.stringify(data)
    }
  } catch (err) {
    status = "failed"
    error = err instanceof Error ? err.message : String(err)
    console.error("WA send error:", error)
  }

  // Loga no banco
  await supabase.from("whatsapp_logs").insert({
    ...logData,
    phone: number,
    message: text,
    status,
    error,
  })

  return status === "sent"
}

// ── Handler: lembretes 24h (chamado pelo cron) ────────────────────────────────
async function handleReminders() {
  const now   = new Date()
  const from  = new Date(now.getTime() + 23 * 60 * 60 * 1000)  // +23h
  const to    = new Date(now.getTime() + 25 * 60 * 60 * 1000)  // +25h

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id, datetime, clinic_id,
      patient:patients(id, name, phone),
      clinic:clinics(name)
    `)
    .eq("status", "scheduled")
    .gte("datetime", from.toISOString())
    .lte("datetime", to.toISOString())
    .is("deleted_at", null)

  if (error) return { error: error.message }

  const results = { sent: 0, failed: 0, skipped: 0 }

  for (const appt of appointments ?? []) {
    const patient = appt.patient as any
    const clinic  = appt.clinic as any

    if (!patient?.phone) { results.skipped++; continue }

    // Evita lembrete duplicado
    const { data: existing } = await supabase
      .from("whatsapp_logs")
      .select("id")
      .eq("appointment_id", appt.id)
      .eq("type", "reminder")
      .limit(1)
      .maybeSingle()

    if (existing) { results.skipped++; continue }

    const dt = new Date(appt.datetime)
    const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })
    const dia  = dt.toLocaleDateString("pt-BR",  { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" })

    const text = [
      `👋 Olá, *${patient.name}*!`,
      ``,
      `Lembramos que você tem uma consulta amanhã:`,
      `📅 *${dia}* às *${hora}*`,
      `🏥 *${clinic?.name ?? "nossa clínica"}*`,
      ``,
      `Em caso de dúvidas ou para reagendar, entre em contato conosco.`,
      `Até lá! 😊`,
    ].join("\n")

    const ok = await sendMessage(patient.phone, text, {
      clinic_id:      appt.clinic_id,
      patient_id:     patient.id,
      appointment_id: appt.id,
      type:           "reminder",
    })

    ok ? results.sent++ : results.failed++
  }

  return results
}

// ── Handler: confirmação de agendamento ───────────────────────────────────────
async function handleConfirmation(appointment_id: string) {
  const { data: appt } = await supabase
    .from("appointments")
    .select(`
      id, datetime, clinic_id,
      patient:patients(id, name, phone),
      clinic:clinics(name)
    `)
    .eq("id", appointment_id)
    .single()

  if (!appt) return { error: "Appointment not found" }

  const patient = appt.patient as any
  const clinic  = appt.clinic as any
  if (!patient?.phone) return { skipped: true, reason: "no phone" }

  const dt   = new Date(appt.datetime)
  const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })
  const dia  = dt.toLocaleDateString("pt-BR",  { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" })

  const text = [
    `✅ *Agendamento confirmado!*`,
    ``,
    `Olá, *${patient.name}*! Seu agendamento foi realizado com sucesso.`,
    ``,
    `📅 *${dia}* às *${hora}*`,
    `🏥 *${clinic?.name ?? "nossa clínica"}*`,
    ``,
    `Qualquer dúvida, estamos à disposição!`,
  ].join("\n")

  const ok = await sendMessage(patient.phone, text, {
    clinic_id:      appt.clinic_id,
    patient_id:     patient.id,
    appointment_id: appt.id,
    type:           "confirmation",
  })

  return { sent: ok ? 1 : 0, failed: ok ? 0 : 1 }
}

// ── Handler: cobrança de pagamento ────────────────────────────────────────────
async function handleCharge(payment_id: string) {
  const { data: payment } = await supabase
    .from("payments")
    .select(`
      id, amount, final_amount, description, clinic_id,
      patient:patients(id, name, phone),
      clinic:clinics(name)
    `)
    .eq("id", payment_id)
    .single()

  if (!payment) return { error: "Payment not found" }

  const patient = payment.patient as any
  const clinic  = payment.clinic as any
  if (!patient?.phone) return { skipped: true, reason: "no phone" }

  const valor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
    .format(parseFloat(payment.final_amount ?? payment.amount ?? 0))

  const text = [
    `💰 *Lembrete de pagamento*`,
    ``,
    `Olá, *${patient.name}*!`,
    ``,
    `Identificamos um pagamento pendente:`,
    `💵 Valor: *${valor}*`,
    payment.description ? `📋 Ref: ${payment.description}` : "",
    `🏥 ${clinic?.name ?? "nossa clínica"}`,
    ``,
    `Caso já tenha efetuado o pagamento, desconsidere esta mensagem.`,
    `Em caso de dúvidas, entre em contato conosco.`,
  ].filter(Boolean).join("\n")

  const ok = await sendMessage(patient.phone, text, {
    clinic_id:  payment.clinic_id,
    patient_id: patient.id,
    payment_id: payment.id,
    type:       "charge",
  })

  return { sent: ok ? 1 : 0, failed: ok ? 0 : 1 }
}

// ── Entry point ───────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405)

  try {
    const body = await req.json()
    const { type, appointment_id, payment_id } = body

    console.log("send-whatsapp called:", { type, appointment_id, payment_id })

    switch (type) {
      case "reminder":     return json(await handleReminders())
      case "confirmation": return json(await handleConfirmation(appointment_id))
      case "charge":       return json(await handleCharge(payment_id))
      default:             return json({ error: `Unknown type: ${type}` }, 400)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("send-whatsapp error:", msg)
    return json({ error: msg }, 500)
  }
})