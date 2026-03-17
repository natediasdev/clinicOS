# Gráfico de Faturamento no Financeiro - Plano de Implementação

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar um gráfico de área mostrando o faturamento semanal na página Financeiro usando Recharts.

**Architecture:** Criar componente reutilizável `RevenueChart.jsx` que será integrado em `Financial.jsx`. O componente receberá dados processados via props, seguindo o padrão existente no Dashboard.

**Tech Stack:** React, Recharts, estilos inline (padrão do projeto)

---

## Mapeamento de Arquivos

**Novos Arquivos:**
- `src/components/financial/RevenueChart.jsx` - Componente do gráfico

**Arquivos Modificados:**
- `src/pages/app/Financial.jsx` - Importar e renderizar o componente
- `src/pages/app/Financial.jsx` - Adicionar função de agregação semanal

---

### Task 1: Criar diretório do componente

**Files:**
- Create: `src/components/financial/` (diretório)

- [ ] **Step 1: Criar diretório**

```bash
mkdir -p src/components/financial
```

- [ ] **Step 2: Verificar criação**

```bash
ls -la src/components/
```
Expected: Diretório `financial` listado

- [ ] **Step 3: Commit**

```bash
git add src/components/financial
git commit -m "feat: criar diretório components/financial"
```

---

### Task 2: Criar componente RevenueChart

**Files:**
- Create: `src/components/financial/RevenueChart.jsx`

- [ ] **Step 1: Escrever o componente**

```jsx
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Formatação de moeda em português brasileiro
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <p style={{ color: '#64748b', margin: '0 0 6px', fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ color: '#3b82f6', margin: 0, fontWeight: 700 }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

export default function RevenueChart({ data, loading, theme }) {
  if (loading) {
    return (
      <div style={{ background: theme.bgCard, borderRadius: 12, padding: 24 }}>
        <div className="skeleton-shimmer" style={{ height: 200 }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ background: theme.bgCard, borderRadius: 12, padding: 24 }}>
        <p style={{ color: theme.textGhost, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
          Nenhum dado de faturamento no período
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: theme.bgCard, borderRadius: 12, padding: 24 }}>
      <p style={{
        fontSize: 12,
        fontWeight: 700,
        color: theme.textGhost,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        margin: '0 0 20px',
      }}>
        Faturamento no Período
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="semana"
            tick={{ fill: '#475569', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="valor"
            name="Faturamento"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={{ fill: '#3b82f6', r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Salvar arquivo**

```bash
# (O conteúdo acima foi escrito via write tool)
```

- [ ] **Step 3: Verificar sintaxe**

```bash
npx eslint src/components/financial/RevenueChart.jsx --no-eslintrc --parser-options=ecmaVersion:2020,sourceType:module,ecmaFeatures:jsx:true
```
Expected: Sem erros de sintaxe

- [ ] **Step 4: Commit**

```bash
git add src/components/financial/RevenueChart.jsx
git commit -m "feat: criar componente RevenueChart"
```

---

### Task 3: Adicionar função de agregação em Financial.jsx

**Files:**
- Modify: `src/pages/app/Financial.jsx` (adicionar função após `fetchPayments`)

- [ ] **Step 1: Adicionar função de agregação**

No arquivo `Financial.jsx`, adicione esta função após a definição de `fetchPayments` (aproximadamente linha 297):

```javascript
const aggregateRevenueByWeek = (payments) => {
  const weekBuckets = {};
  
  payments.forEach(p => {
    if (p.status !== 'paid') return;
    
    const d = new Date(p.created_at);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const key = `${startOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${endOfWeek.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
    
    weekBuckets[key] = (weekBuckets[key] || 0) + parseFloat(p.final_amount || 0);
  });
  
  return Object.entries(weekBuckets).map(([semana, valor]) => ({ semana, valor }));
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/app/Financial.jsx
git commit -m "feat: adicionar função de agregação semanal"
```

---

### Task 4: Importar e integrar RevenueChart em Financial.jsx

**Files:**
- Modify: `src/pages/app/Financial.jsx` (seção de imports)
- Modify: `src/pages/app/Financial.jsx` (seção de renderização)

- [ ] **Step 1: Adicionar import**

No topo do arquivo, após outros imports:

```javascript
import RevenueChart from '../../components/financial/RevenueChart';
```

- [ ] **Step 2: Adicionar cálculo derivado de dados do gráfico**

Dentro do componente `Financial`, após a linha `const [query, setQuery] = useState("")`:

```javascript
// Dados derivados de payments para o gráfico de faturamento
const revenueData = aggregateRevenueByWeek(payments);
```

**Nota:** `revenueData` é um valor derivado (não um estado separado) que é recalculado automaticamente sempre que `payments` mudar.

- [ ] **Step 3: Renderizar o componente**

No JSX do `Financial`, **antes** da seção "Lista" (após os cards de métricas), adicione:

```jsx
{/* Gráfico de faturamento */}
<div style={{ marginBottom: 16 }}>
  <RevenueChart 
    data={revenueData} 
    loading={fetching}
    theme={t}
  />
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/app/Financial.jsx
git commit -m "feat: integrar RevenueChart na página Financeiro"
```

---

### Task 5: Verificar e testar a implementação

**Files:**
- Test: Executar a aplicação

- [ ] **Step 1: Iniciar a aplicação**

```bash
npm run dev
```

- [ ] **Step 2: Verificar Financeiro**

Abrir `http://localhost:5173/financeiro` (ou porta correspondente) e verificar:
- Gráfico de área aparece abaixo das métricas
- Dados semanais são exibidos corretamente
- Tooltip funciona ao passar o mouse

- [ ] **Step 3: Testar filtros de período**

Selecionar diferentes períodos (Esta semana, 2 semanas, Este mês, etc.) e verificar que o gráfico atualiza

- [ ] **Step 4: Testar estado vazio**

Selecionar período sem pagamentos e verificar mensagem "Nenhum dado de faturamento no período"

- [ ] **Step 5: Commit testes**

```bash
git add .
git commit -m "test: verificar implementação do gráfico de faturamento"
```

---

## Resumo do Plano

1. **Task 1**: Criar diretório `src/components/financial/`
2. **Task 2**: Criar componente `RevenueChart.jsx` com gráfico de área
3. **Task 3**: Adicionar função `aggregateRevenueByWeek` em `Financial.jsx`
4. **Task 4**: Importar e integrar o componente na página Financeiro
5. **Task 5**: Testar a implementação

**Total de arquivos**: 1 criado, 1 modificado
**Tempo estimado**: 15-20 minutos

## Notas da Revisão

1. **Data labeling**: O formato `DD/MM - DD/MM` pode ser ambíguo para intervalos que cruzam ano (ex: "30/12 - 05/01"). A especificação foi aprovada com este formato, então está correto implementar conforme planejado.

2. **Período "Tudo"**: A função `aggregateRevenueByWeek` funciona corretamente com o array completo de `payments` quando o período é "Tudo" (all).

3. **Estado derivado**: `revenueData` é calculado como valor derivado de `payments`, não como estado separado.
