# ClinicOS — Padrões de Código e Arquitetura

## 🎯 Princípios Fundamentais

### 1. Privacidade Multi-Tenant (CRÍTICO)
- **SEMPRE** filtre queries por `clinic_id`
- Nunca exponha dados de uma clínica para outra
- Use RLS + filtro explícito no código

### 2. Hooks Obrigatórios
Todo componente que precisa de dados de contexto **DEVE** usar:

```jsx
// ✅ Padrão correto
const { clinicId, user } = useAuth()        // Dados da clínica/usuário
const permissions = usePermissions()          // Controle de acesso
const { t } = useTheme()                    // Estilos themáticos
```

### 3. Estrutura de Componentes
- Props explícitas (sem dependência externa de estado)
- Separação: UI (presentational) vs Lógica (container)
- useTheme para todos os estilos

---

## 📋 Regras por Tipo de Recurso

### Queries ao Banco
```jsx
// ✅ CORRETO - sempre com clinic_id
supabase.from("patients").select("*").eq("clinic_id", clinicId)

// ❌ ERRADO - sem filtro de clínica
supabase.from("patients").select("*")
```

### Permissões
```jsx
const permissions = usePermissions()

// Usar em render condicional
{permissions.canViewFinancial && <Financial />}
{permissions.isAdmin && <AdminOnly />}
```

### Tema
```jsx
const { t } = useTheme()

// Usar cores do tema
<div style={{ background: t.bgCard, color: t.textPrimary }}>
```

---

## 🏗️ Estrutura de Arquivos

```
src/
├── components/ui/          # Componentes compartilhados
├── context/              # React Context (Auth, Theme)
├── hooks/                # Custom hooks (usePermissions, usePlanLimits)
├── pages/
│   ├── app/             # Páginas autenticadas
│   └── auth/            # Páginas públicas/auth
└── config/               # Configurações centralizadas
```

---

## ✅ Checklist antes de codar

- [ ] Usei `useAuth` para obter `clinicId`?
- [ ] Usei `usePermissions` para verificar acesso?
- [ ] Usei `useTheme` para estilos?
- [ ] Todas as queries filtram por `clinic_id`?
- [ ] Tratei null/undefined de dados do Supabase?

---

## 🔐 Padrões de Segurança

### Dados Sensíveis
- Nunca logue dados de pacientes
- Não exponha IDs internos em URLs públicas
- Use soft delete (`deleted_at`) ao invés de delete permanente

### Acesso
- Admin tem acesso total
- Staff (profissional) vê apenas seus próprios dados
- Verificar permissões antes de renderizar componentes sensíveis

---

## 🎨 Padrões de UI

### Estilos
- Use `useTheme()` para obter cores consistentes
- Evite hardcoded colors
- Follow: background, border, text, accent pattern

### Responsividade
- Use hook `useIsMobile()` para detectar viewport
- Teste em mobile first

---

## 📦 Padrões de Componentes

### Motion/Animações
- Use Framer Motion via MotionComponents
- Mantenha animações sutis (0.2-0.4s)
- Use variants para consistência

### Formulários
- Validação client-side básica
- Feedback visual de loading/error
- useState para Controlled inputs
