# Problemas Encontrados - Dashboard.jsx e Team.jsx

## Objetivo
Este documento serve como contexto para que um agente de IA compreenda os problemas identificados nos arquivos `Dashboard.jsx` e `Team.jsx`, facilitando a correção automatizada.

---

## Arquivos Analisados

1. `src/pages/app/Dashboard.jsx` (403 linhas)
2. `src/pages/app/Team.jsx` (241 linhas)

---

## Problemas Identificados

### Dashboard.jsx - Falta de filtro por `clinic_id`

Todas as queries ao banco de dados no hook `useDashboardData(clinicId)` não filtram os dados pela `clinicId` fornecida. Isso é crítico porque:

- O parâmetro `clinicId` é recebido como argumento (linha 42)
- Porém, **nenhuma** das 8 queries utiliza esse filtro

#### Queries afetadas (todas em `src/pages/app/Dashboard.jsx`):

| Linha | Query | Problema |
|-------|-------|----------|
| 63 | `patients` count | Sem `.eq("clinic_id", clinicId)` |
| 64 | `appointments` hoje | Sem `.eq("clinic_id", clinicId)` |
| 65 | `appointments` próximos | Sem `.eq("clinic_id", clinicId)` |
| 66 | `appointments` semana | Sem `.eq("clinic_id", clinicId)` |
| 84-89 | `payments` faturamento | Sem `.eq("clinic_id", clinicId)` |
| 102-104 | `appointments` mês (status pie) | Sem `.eq("clinic_id", clinicId)` |
| 115-117 | `appointments` todos (ocupação) | Sem `.eq("clinic_id", clinicId)` |
| 128-129 | `patients` todos (crescimento) | Sem `.eq("clinic_id", clinicId)` |

### Team.jsx - Status: OK ✅

A página de equipe está implementada corretamente:
- Filtra por `clinic_id` na query principal (linha 68)
- Trata erros adequadamente
- Implementa soft delete corretamente

---

## Ação Necessária

Adicionar `.eq("clinic_id", clinicId)` em todas as queries do `useDashboardData` no arquivo `src/pages/app/Dashboard.jsx`.

### Exemplo de correção:

```javascript
// ANTES (linha 63):
supabase.from("patients").select("id",{count:"exact",head:true}).is("deleted_at",null)

// DEPOIS:
supabase.from("patients").select("id",{count:"exact",head:true}).eq("clinic_id", clinicId).is("deleted_at",null)
```

Repetir o mesmo padrão para todas as demais queries afetadas.

---

## Contexto Adicional

- O `clinicId` é obtido do `AuthContext` via `useAuth()` (linha 238)
- O hook `useDashboardData(clinicId)` recebe o `clinicId` corretamente
- A correção deve ser aplicada dentro da função `fetchAll()` no `useEffect`
