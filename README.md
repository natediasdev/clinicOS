<div align="center">

# ClinicOS

**Sistema de gestão para clínicas de saúde**

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)

</div>

---

## Sobre

O **ClinicOS** é um SaaS de gestão para clínicas de saúde — odontologia, psicologia, fisioterapia, nutrição e mais. Multi-tenant, com isolamento total de dados por clínica via Row Level Security.

## Funcionalidades

- 🦷 **Pacientes** — cadastro, busca e histórico
- 📅 **Agendamentos** — visualização em lista e calendário, controle de status
- 👥 **Equipe** — convite de membros por email com roles (admin, dentista, recepcionista...)
- 📊 **Dashboard** — métricas em tempo real (ocupação, faltas, agendamentos do dia)
- ⚙️ **Perfil da clínica** — configurações e resumo de uso
- 🔐 **Autenticação** — login, recuperação de senha, onboarding guiado
- 🌙 **Tema** — modo claro e escuro

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite |
| Estilização | CSS-in-JS (inline styles + tema dinâmico) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Edge Functions | Deno (convite de membros) |
| Deploy | Netlify |

## Estrutura

```
src/
├── context/
│   ├── AuthContext.jsx      # Autenticação e dados da clínica
│   └── ThemeContext.jsx     # Tema claro/escuro
├── hooks/
│   ├── usePermissions.js    # Permissões por role
│   └── usePlanLimits.js     # Limites por plano
├── pages/
│   ├── auth/                # Login, ForgotPassword, ResetPassword
│   ├── app/                 # Dashboard, Patients, Appointments, Team, ClinicProfile
│   ├── onboarding/          # Wizard de configuração inicial
│   ├── public/              # LandingPage, PrivacyPolicy, TermsOfUse
│   └── AppLayout.jsx        # Shell com sidebar e navegação
└── supabaseClient.js
```

## Configuração local

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/clinic-app.git
cd clinic-app
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env` com suas chaves do Supabase:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

As chaves estão em **Supabase → Project Settings → API**.

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

## Deploy

O projeto está configurado para deploy no **Netlify**.

1. Conecte o repositório no Netlify
2. Configure as variáveis de ambiente (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)
3. Build command: `npm run build`
4. Publish directory: `dist`

## Banco de dados

As migrations estão em `supabase/`. Para rodar localmente:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

## Edge Functions

```bash
supabase functions deploy invite-member --no-verify-jwt
```

## Licença

Proprietário — todos os direitos reservados © 2026 ClinicOS

---

<div align="center">
  <sub>Feito com ☕ em Japeri/RJ, Brasil</sub>
</div>
