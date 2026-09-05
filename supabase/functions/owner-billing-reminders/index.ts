/**
 * owner-billing-reminders — Edge Function
 *
 * Roda 1x por dia via pg_cron (ver migration 004 + comentário no fim deste
 * arquivo pro SQL do agendamento). Não é chamada pelo front do app.
 *
 * Avisa o DONO da clínica (não pacientes) em dois casos:
 *   1. trial_ending — trial acaba em até TRIAL_WARNING_DAYS dias e ainda
 *      não existe assinatura "active" (Nathan não aprovou ainda)
 *   2. payment_due  — assinatura "active" com current_period_end chegando
 *      em até PAYMENT_WARNING_DAYS dias (convenção: ao aprovar manualmente,
 *      definir current_period_end = data da próxima cobrança, ex: +30 dias)
 *
 * Canais: WhatsApp (clinics.phone via Evolution) e e-mail (clinics.email,
 * com fallback pra clinics.sender_email) via Resend.
 *
 * Evita reenviar no mesmo dia checando billing_reminders_log.
 */

import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase    = createClient(supabaseUrl, supabaseKey)

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!
const resendApiKey      = Deno.env.get("RESEND_API_KEY") ?? ""
// Ajuste pro seu domínio verificado no Resend quando tiver um.
const SENDER_EMAIL      = Deno.env.get("BILLING_SENDER_EMAIL") ?? "ClinicOS <onboarding@resend.dev>"

const TRIAL_WARNING_DAYS   = 3
const PAYMENT_WARNING_DAYS = 5

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

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("55") && digits.length >= 12) return digits
  if (digits.length === 11 || digits.length === 10) return `55${digits}`
  return digits
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

// Já mandamos esse tipo de aviso pra essa clínica nas últimas 20h?
async function alreadySentToday(clinicId: string, type: string) {
  const since = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from("billing_reminders_log")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("type", type)
    .eq("status", "sent")
    .gte("sent_at", since)
    .limit(1)
    .maybeSingle()
  return !!data
}

async function logResult(clinicId: string, type: string, channel: "whatsapp" | "email", status: "sent" | "failed" | "skipped", error?: string | null) {
  await supabase.from("billing_reminders_log").insert({ clinic_id: clinicId, type, channel, status, error: error ?? null })
}

async function sendWhatsapp(clinic: any, type: "trial_ending" | "payment_due", daysLeft: number) {
  if (!clinic.phone) { await logResult(clinic.id, type, "whatsapp", "skipped", "clinic sem telefone"); return }
  if (!clinic.evolution_instance) { await logResult(clinic.id, type, "whatsapp", "skipped", "clinic sem evolution_instance"); return }
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) { await logResult(clinic.id, type, "whatsapp", "failed", "Evolution API não configurada"); return }

  const text = type === "trial_ending"
    ? `👋 Olá! Seu período de teste do ClinicOS termina em *${daysLeft} dia${daysLeft !== 1 ? "s" : ""}*.\n\nPra continuar com acesso liberado, entraremos em contato pra confirmar sua assinatura. Qualquer dúvida, responda aqui mesmo.`
    : `👋 Olá! Sua assinatura do ClinicOS vence em *${daysLeft} dia${daysLeft !== 1 ? "s" : ""}*.\n\nPra manter seu acesso sem interrupção, vamos confirmar o pagamento com você em breve.`

  try {
    const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${clinic.evolution_instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": EVOLUTION_API_KEY },
      body: JSON.stringify({ number: formatPhone(clinic.phone), text, delay: 1000, linkPreview: false }),
    })
    const data = await res.json()
    if (!res.ok) { await logResult(clinic.id, type, "whatsapp", "failed", JSON.stringify(data)); return }
    await logResult(clinic.id, type, "whatsapp", "sent")
  } catch (err) {
    await logResult(clinic.id, type, "whatsapp", "failed", err instanceof Error ? err.message : String(err))
  }
}

async function sendEmail(clinic: any, type: "trial_ending" | "payment_due", daysLeft: number) {
  const to = clinic.email ?? clinic.sender_email
  if (!to) { await logResult(clinic.id, type, "email", "skipped", "clinic sem e-mail cadastrado"); return }
  if (!resendApiKey) { await logResult(clinic.id, type, "email", "failed", "RESEND_API_KEY não configurada"); return }

  const subject = type === "trial_ending"
    ? `Seu teste do ClinicOS termina em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}`
    : `Sua assinatura do ClinicOS vence em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}`

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb">
  <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
    <h2 style="margin:0 0 16px">${subject}</h2>
    <p>Olá, <strong>${clinic.name}</strong>!</p>
    <p>${type === "trial_ending"
      ? "Seu período de teste gratuito do ClinicOS está terminando. Vamos entrar em contato pra confirmar sua assinatura e manter seu acesso liberado."
      : "Sua assinatura do ClinicOS está próxima do vencimento. Vamos confirmar o pagamento com você pra manter seu acesso sem interrupção."}</p>
    <p style="font-size:12px;color:#9ca3af">ClinicOS</p>
  </div>
</body></html>`

  try {
    const resend = new Resend(resendApiKey)
    const result = await resend.emails.send({ from: SENDER_EMAIL, to, subject, html })
    if (result.error) { await logResult(clinic.id, type, "email", "failed", result.error.message); return }
    await logResult(clinic.id, type, "email", "sent")
  } catch (err) {
    await logResult(clinic.id, type, "email", "failed", err instanceof Error ? err.message : String(err))
  }
}

async function handleTrialEnding() {
  const now    = new Date()
  const limit  = new Date(now.getTime() + TRIAL_WARNING_DAYS * 24 * 60 * 60 * 1000)

  const { data: clinics } = await supabase
    .from("clinics")
    .select("id, name, phone, email, sender_email, evolution_instance, trial_end")
    .eq("plan", "pro")
    .not("trial_end", "is", null)
    .gte("trial_end", now.toISOString())
    .lte("trial_end", limit.toISOString())

  let processed = 0
  for (const clinic of clinics ?? []) {
    const { data: activeSub } = await supabase
      .from("subscriptions").select("id")
      .eq("clinic_id", clinic.id).eq("status", "active")
      .limit(1).maybeSingle()
    if (activeSub) continue // já aprovado, não é mais "trial acabando"

    if (await alreadySentToday(clinic.id, "trial_ending")) continue

    const daysLeft = Math.max(0, daysUntil(clinic.trial_end))
    await sendWhatsapp(clinic, "trial_ending", daysLeft)
    await sendEmail(clinic, "trial_ending", daysLeft)
    processed++
  }
  return processed
}

async function handlePaymentDue() {
  const now   = new Date()
  const limit = new Date(now.getTime() + PAYMENT_WARNING_DAYS * 24 * 60 * 60 * 1000)

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("id, clinic_id, current_period_end, clinic:clinics(id, name, phone, email, sender_email, evolution_instance)")
    .eq("status", "active")
    .not("current_period_end", "is", null)
    .gte("current_period_end", now.toISOString())
    .lte("current_period_end", limit.toISOString())

  let processed = 0
  for (const sub of subs ?? []) {
    const clinic = sub.clinic as any
    if (!clinic) continue
    if (await alreadySentToday(clinic.id, "payment_due")) continue

    const daysLeft = Math.max(0, daysUntil(sub.current_period_end))
    await sendWhatsapp(clinic, "payment_due", daysLeft)
    await sendEmail(clinic, "payment_due", daysLeft)
    processed++
  }
  return processed
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })

  try {
    const trialEndingCount = await handleTrialEnding()
    const paymentDueCount  = await handlePaymentDue()
    return json({ ok: true, trialEndingCount, paymentDueCount })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("owner-billing-reminders error:", msg)
    return json({ error: msg }, 500)
  }
})

/**
 * AGENDAMENTO (rodar 1x no SQL Editor, requer extensões pg_cron e pg_net
 * habilitadas em Database > Extensions):
 *
 * select cron.schedule(
 *   'owner-billing-reminders-daily',
 *   '0 12 * * *', -- 09:00 América/São_Paulo (12:00 UTC)
 *   $$
 *   select net.http_post(
 *     url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/owner-billing-reminders',
 *     headers := jsonb_build_object(
 *       'Authorization', 'Bearer SUA_SERVICE_ROLE_KEY',
 *       'Content-Type', 'application/json'
 *     ),
 *     body := '{}'::jsonb
 *   );
 *   $$
 * );
 */