# ClinicOS — Roadmap: Primeiro cliente + Especialidades + Cobranças

## O que foi feito agora

### 1. Banco de dados ✅
- `clinics.specialty` — campo de especialidade (fisioterapia, pilates, odontologia, psicologia, nutricao, estetica, geral)
- `record_templates` — templates de prontuário por especialidade com ~40 campos pré-cadastrados
- `patient_custom_fields` — campos preenchidos por paciente (sem quebrar patient_records existente)
- `email_logs` — rastreamento de emails enviados

### 2. DayView.jsx ✅
Componente de agenda do dia. Integrar em Appointments.jsx:

```jsx
// Adicionar ao Appointments.jsx
import DayView from "../../components/DayView"

// Adicionar estado
const [view, setView] = useState("list") // "list" | "calendar" | "day"
const [dayViewDate, setDayViewDate] = useState(new Date())

// Adicionar botão no toggle de view
<Button onClick={() => setView("day")} variant={view==="day"?"primary":"ghost"}>
  📅 Dia
</Button>

// Adicionar condicional no render
{view === "day" && (
  <DayView
    appointments={appointments}
    patientMap={patientMap}
    staffMap={staffMap}
    onStatusChange={handleStatusChange}
    onDelete={handleDelete}
    selectedDate={dayViewDate}
    onDateChange={setDayViewDate}
    isMobile={isMobile}
  />
)}
```

---

## Próximas fases

### Fase 2 — Prontuário adaptado por especialidade

**O que fazer:**
1. No `PatientRecord.jsx`, aba "Dados":
   - Buscar `record_templates` filtrando por `clinic.specialty`
   - Renderizar campos dinamicamente baseado no template
   - Salvar em `patient_custom_fields` ao invés de `patient_records` (campos fixos)
   - Manter compatibilidade: clinics com specialty='odontologia' continuam usando patient_records

2. No Onboarding (step 1), adicionar seleção de especialidade:
   - Cards visuais: Fisioterapia | Pilates | Odontologia | Psicologia | Nutrição | Estética | Outra
   - Salva em `clinics.specialty`

3. No ClinicProfile, permitir alterar especialidade

**Impacto:** O cliente de fisio/pilates verá campos específicos para cada área,
sem campos irrelevantes como "histórico odontológico".

---

### Fase 3 — Email de cobrança (requer conta Resend)

**Pré-requisito:** Conta no Resend (resend.com) — gratuito até 3.000 emails/mês

**Arquitetura:**
```
Supabase Edge Function
  └── send-email (Deno + Resend API)
        ├── type: "reminder"    → 24h antes da consulta
        ├── type: "charge"      → cobrança de pagamento pendente
        └── type: "confirmation"→ confirmação de agendamento
```

**Trigger manual (no Financial.jsx):**
```
Botão "Enviar cobrança" ao lado de pagamentos com status=pending
→ Chama edge function → Email para patient.email
→ Registra em email_logs
```

**Trigger automático (pg_cron):**
```sql
-- Todo dia às 09h, envia lembretes para consultas de amanhã
SELECT cron.schedule('send-reminders', '0 9 * * *',
  'SELECT net.http_post(url, body) FROM ...'
);
```

**Template de email de cobrança:**
```
Assunto: Lembrete de pagamento — [Clínica X]

Olá [Nome],

Identificamos um pagamento pendente referente à sua consulta
em [data] na [Clínica X].

Valor: R$ [valor]

Entre em contato para regularizar: [telefone da clínica]

[Clínica X]
```

---

### Fase 4 — Monetização do ClinicOS (após validar com primeiro cliente)

Esta fase é sobre **cobrar seus próprios clientes** (os donos de clínica),
não sobre a cobrança deles para os pacientes.

**Opções técnicas:**
- **Stripe** — padrão de mercado, aceita cartão/Pix, API robusta
- **Pagar.me** — alternativa brasileira, Pix nativo
- **Cobrança manual Pix** — o que você já faz, escala até ~20 clientes

**Recomendação:** Manter Pix manual até ter 5-10 clientes pagantes.
Integrar Stripe/Pagar.me quando o volume justificar o custo de implementação (~2 semanas).

---

## Resumo de arquivos a criar/modificar

| Arquivo | Ação | Fase |
|---------|------|------|
| `components/DayView.jsx` | ✅ Criado | 1 |
| `pages/auth/Appointments.jsx` | ✅ Integrar DayView (3ª aba) | 1 |
| `pages/onboarding/Onboarding.jsx` | ✅ Adicionar step de especialidade | 2 |
| `pages/app/PatientRecord.jsx` | ✅ Campos dinâmicos por specialty | 2 |
| `pages/app/ClinicProfile.jsx` | ✅ Editar specialty | 2 |
| `supabase/functions/send-email/index.ts` | Edge Function Resend | 3 |
| `pages/app/Financial.jsx` | Botão "Enviar cobrança" | 3 |
