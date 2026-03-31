# SaaS Updates Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 6 correções e atualizações no SaaS: corrigir limite de pacientes Pro, adicionar especialidades, filtro por especialidade, investigar erro de renderização Appointments, desabilitar landing page no capacitor, e verificar integração Resend.

**Architecture:** Correções pontuais em arquivos existentes + nova coluna no banco + verificação de integrações.

**Tech Stack:** React, Supabase, Capacitor

---

## Task 1: Corrigir Limite de Pacientes Pro

**Files:**
- Modify: `src/hooks/usePlanLimits.js:92`
- Modify: `src/hooks/usePlanLimits.js:104`
- Modify: `src/pages/app/Team.jsx:76`
- Modify: `src/pages/app/Team.jsx:95`

- [ ] **Step 1: Corrigir checkPatientLimit() em usePlanLimits.js**

Localizar a função `checkPatientLimit()` e alterar a linha que calcula o limite:

```js
// Substituir linha 92:
const limit = (clinic.patient_limit !== null && clinic.patient_limit !== undefined) 
  ? clinic.patient_limit 
  : (PLAN_CONFIG[clinic.plan]?.patient_limit ?? 20)
```

- [ ] **Step 2: Corrigir checkStaffLimit() em usePlanLimits.js**

Localizar a função `checkStaffLimit()` e alterar:

```js
// Substituir linha 104:
const limit = (clinic.staff_limit !== null && clinic.staff_limit !== undefined)
  ? clinic.staff_limit
  : (PLAN_CONFIG[clinic.plan]?.staff_limit ?? 1)
```

- [ ] **Step 3: Corrigir staffLimit em Team.jsx linha 76**

```js
// Substituir linha 76:
const staffLimit = (clinic?.staff_limit !== null && clinic?.staff_limit !== undefined)
  ? clinic.staff_limit
  : (PLAN_CONFIG[clinic?.plan]?.staff_limit ?? 1)
```

- [ ] **Step 4: Corrigir staffLimit em Team.jsx linha 95**

```js
// Substituir linha 95:
const staffLimit = (clinic?.staff_limit !== null && clinic?.staff_limit !== undefined)
  ? clinic.staff_limit
  : (PLAN_CONFIG[clinic?.plan]?.staff_limit ?? 1)
```

- [ ] **Step 5: Testar criando paciente em clínica Pro**

Executar app e verificar se não exibe mensagem de limite atingido.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePlanLimits.js src/pages/app/Team.jsx
git commit -m "fix: corrigir limite null sendo tratado como 20"
```

---

## Task 2: Adicionar Especialidades da Clínica

**Files:**
- Modify: `supabase/migrations/xxx_add_specialties.sql` (criar migration)
- Modify: `src/context/AuthContext.jsx` (adicionar specialties ao clinic)
- Modify: `src/pages/app/Settings.jsx` (campo de edição)

- [ ] **Step 1: Criar migration para adicionar coluna specialties**

Criar arquivo `supabase/migrations/2026-03-31-add-specialties.sql`:

```sql
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';
```

Executar migration no Supabase.

- [ ] **Step 2: Verificar se AuthContext carrega specialties**

Verificar se `clinic` do AuthContext já tem acesso ao campo ou precisa adicionar no select do Supabase.

- [ ] **Step 3: Adicionar campo de edição em Settings.jsx**

Adicionar componente de input para adicionar/editar especialidades:
- Input de texto + botão "Adicionar"
- Exibir como tags removíveis
- Salvar array no banco

```jsx
// Exemplo de estrutura:
const [specialties, setSpecialties] = useState(clinic?.specialties || [])
const [newSpecialty, setNewSpecialty] = useState("")

function addSpecialty() {
  if (!newSpecialty.trim()) return
  setSpecialties([...specialties, newSpecialty.trim()])
  setNewSpecialty("")
}

function removeSpecialty(index) {
  setSpecialties(specialties.filter((_, i) => i !== index))
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/ src/pages/app/Settings.jsx
git commit -m "feat: adicionar especialidades da clínica"
```

---

## Task 3: Filtro por Especialidade

**Files:**
- Modify: `src/pages/app/Patients.jsx`
- Modify: `src/pages/auth/Appointments.jsx`

- [ ] **Step 1: Adicionar dropdown de filtro em Patients.jsx**

Acima da lista de pacientes, adicionar:
- Select com opções de especialidades (pull de `clinic.specialties`)
- State `filterSpecialty` 
- Filtrar pacientes que têm prontuário com especialidade

```jsx
const [filterSpecialty, setFilterSpecialty] = useState("all")

// Na função de fetch, adicionar filtro se especialidade selecionada
const filteredPatients = filterSpecialty === "all" 
  ? patients 
  : patients.filter(p => /* prontuário tem especialidade X */)
```

- [ ] **Step 2: Adicionar dropdown de filtro em Appointments.jsx**

imilar ao Patients.jsx:
- Select dropdown acima da lista
- State `filterSpecialty`
- Filtrar appointments onde o prontuário tem especialidade X

- [ ] **Step 3: Commit**

```bash
git add src/pages/app/Patients.jsx src/pages/auth/Appointments.jsx
git commit -m "feat: adicionar filtro por especialidade"
```

---

## Task 4: Investigar Erro de Renderização Appointments

**Files:**
- Investigate: `src/pages/auth/Appointments.jsx`
- Investigate: `src/components/DayView.jsx`

- [ ] **Step 1: Verificar console do navegador**

Executar app e abrir DevTools. Verificar se há errors no console.

- [ ] **Step 2: Verificar importações em Appointments.jsx**

Todas as imports estão corretas? `DayView`, `MotionToast`, etc.

- [ ] **Step 3: Verificar se há erros de runtime**

Adicionar try-catch ou verificar logs.

- [ ] **Step 4: Corrigir conforme erro encontrado**

[Ajustar conforme erro específico encontrado]

- [ ] **Step 5: Commit se houver correção**

```bash
git add src/pages/auth/Appointments.jsx src/components/DayView.jsx
git commit -m "fix: corrigir erro de renderização em Appointments"
```

---

## Task 5: Desabilitar Landing Page no Capacitor

**Files:**
- Modify: `capacitor.config.json`

- [ ] **Step 1: Verificar config atual**

Ler `capacitor.config.json` e verificar se há propriedade `showLanding`.

- [ ] **Step 2: Adicionar showLanding: false**

```json
{
  "appId": "com.clinic.app",
  "appName": "ClinicOS",
  "showLanding": false
}
```

- [ ] **Step 3: Commit**

```bash
git add capacitor.config.json
git commit -m "config: desabilitar landing page no capacitor"
```

---

## Task 6: Verificar Integração Resend/E-mail

**Files:**
- Investigate: `supabase/functions/send-email/index.ts`
- Investigate: `.env` ou variáveis de ambiente
- Investigate: funções de cobrança

- [ ] **Step 1: Verificar se RESEND_API_KEY está configurada**

Verificar vars de ambiente no Supabase functions.

- [ ] **Step 2: Revisar código send-email/index.ts**

Verificar se usa corretamente a API do Resend:
```js
const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}` },
  body: JSON.stringify({ ... })
})
```

- [ ] **Step 3: Verificar integração de cobrança por e-mail**

Procurar onde cobranças são disparadas por e-mail.

- [ ] **Step 4: Verificar se há keys hardcoded**

Se houver, remover e usar variável de ambiente.

- [ ] **Step 5: Commit se houver correções**

```bash
git add supabase/functions/send-email/index.ts
git commit -m "fix: verificar integração Resend"
```

---

## Execution

Execute as tasks em ordem. Após completar todas, fazer commit final resumindo todas as alterações.

**Teste final:**
- [ ] Clínica Pro consegue criar mais de 500 pacientes
- [ ] Especialidades aparecem no dropdown ao criar agendamento
- [ ] Filtro por especialidade funciona em Patients e Appointments
- [ ] Página Appointments renderiza corretamente
- [ ] App mobile não exibe landing page
- [ ] E-mails são enviados corretamente via Resend
