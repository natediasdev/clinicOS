# Especificação: Gráfico de Faturamento no Financeiro

## Objetivo
Adicionar um gráfico de área mostrando a evolução do faturamento (receita) ao longo do tempo na página Financeiro, usando a biblioteca Recharts com agregação semanal.

## Escopo
- **Arquivo modificado**: `src/pages/app/Financial.jsx`
- **Novo arquivo**: `src/components/financial/RevenueChart.jsx`
- **Biblioteca**: Recharts (já instalada e em uso no Dashboard)

## Requisitos Funcionais

### 1. Visualização do Gráfico
- **Tipo**: Gráfico de área (AreaChart)
- **Dados**: Faturamento acumulado por semana
- **Eixo X**: Semanas do período selecionado
- **Eixo Y**: Valor em Reais (R$)
- **Formato de dado**: `{ semana: string, valor: number }`

### 2. Integração com Período
- O gráfico deve reagir ao filtro de período selecionado (Esta semana, 2 semanas, Este mês, etc.)
- Dados devem ser agregados por semana dentro do período selecionado

### 3. Elementos do Gráfico
- Linha de área com gradiente preenchido
- Tooltip customizado mostrando valor formatado em Reais
- Eixo X com labels de data formatadas (ex: "01/01 - 07/01")
- Eixo Y formatado em Reais (ex: "R$ 1.500")

## Design do Componente

### Estrutura de Arquivos
```
src/
├── components/
│   └── financial/
│       └── RevenueChart.jsx      # Novo componente
└── pages/
    └── app/
        └── Financial.jsx         # Modificado
```

### RevenueChart.jsx (Novo Componente)

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

// Formata data para "DD/MM - DD/MM"
const formatWeekRange = (dateStr) => {
  if (!dateStr) return '';
  return dateStr; // Mantém formato já processado
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

### Modificações em Financial.jsx

1. **Importar o novo componente**:
```jsx
import RevenueChart from '../../components/financial/RevenueChart';
```

2. **Adicionar estado para dados do gráfico** (opcional - pode usar os dados de `payments`):
```jsx
const [revenueData, setRevenueData] = useState([]);
```

3. **Adicionar função de agregação semanal**:
```jsx
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

4. **Atualizar o layout do Financial.jsx**:
```jsx
{/* ... métricas existentes ... */}

{/* Gráfico de faturamento */}
<div style={{ marginBottom: 16 }}>
  <RevenueChart 
    data={revenueData} 
    loading={fetching}
    theme={t}
  />
</div>

{/* ... lista de pagamentos ... */}
```

## Padrões de Código

### Cores e Tema
- Seguir o mesmo padrão de cores do Dashboard:
  - Azul principal: `#3b82f6`
  - Gradiente: 25% opacidade no topo, 0% no fundo
  - Fundo do tooltip: `#0f172a`
  - Texto do tooltip: `#64748b` (label), `#3b82f6` (valor)

### Formatação
- **Moeda**: `pt-BR`, `BRL`, 0 casas decimais (consistente com Dashboard.jsx)
- **Data**: `DD/MM - DD/MM` (ex: "01/01 - 07/01") - intervalo semanal

### Responsividade
- Usar `ResponsiveContainer` do Recharts (como no Dashboard)
- Altura fixa de 220px (padrão Dashboard)

## Testes

### Testes Manuais
1. Selecionar período "Este mês" → Verificar gráfico com dados semanais
2. Selecionar período "Tudo" → Verificar gráfico com todas as semanas (ações de longo prazo)
3. Verificar tooltip ao passar mouse sobre a área
4. Verificar formato de data e valor em português brasileiro

### Casos de Borda
- Período sem pagamentos → Mostrar mensagem "Nenhum dado de faturamento no período"
- Carregando dados → Mostrar skeleton loader
- Dados insuficientes para uma semana → Agregar corretamente
- "Tudo" (All) period → Inclui todos os pagamentos pagos desde o início dos registros

## Prioridade
- **Alta**: Implementar gráfico básico com dados semanais
- **Média**: Adicionar gradiente e tooltip customizado
- **Baixa**: Animações e efeitos visuais extras

## Dependências
- Recharts (já instalado no projeto)
- Nenhum novo pacote necessário

## Observações da Revisão
1. **Formatação de data**: O spéc usa intervalo semanal (`DD/MM - DD/MM`), enquanto o Dashboard usa data única. Ambos são aceitáveis, mas o intervalo semanal é mais claro para o Financeiro.
2. **Decimais de moeda**: Alinhado com Dashboard.jsx (0 decimais) para consistência.
3. **Diretório do componente**: Criar `src/components/financial/` se não existir.
4. **Período "Tudo"**: Manipulado implicitamente pelo filtro de período existente.
