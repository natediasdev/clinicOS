-- =====================================================
-- CLINICOS - MONETIZAÇÃO MERCADO PAGO
-- Execute este SQL no Dashboard do Supabase > SQL Editor
-- =====================================================

-- 1. Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'semiannual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'paused', 'trial')),
  mercadopago_id TEXT,
  mercadopago_preapproval_id TEXT,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Política de acesso para clínicas (apenas dono)
CREATE POLICY "Clínicas podem ver suas próprias assinaturas"
ON subscriptions FOR SELECT
USING (clinic_id IN (SELECT clinic_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Clínicas podem inserir suas próprias assinaturas"
ON subscriptions FOR INSERT
WITH CHECK (clinic_id IN (SELECT clinic_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Clínicas podem atualizar suas próprias assinaturas"
ON subscriptions FOR UPDATE
USING (clinic_id IN (SELECT clinic_id FROM auth.users WHERE id = auth.uid()));

-- 4. Adicionar colunas de trial na tabela clinics (se não existirem)
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);

-- 5. Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_subscriptions_clinic_id ON subscriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mercadopago_id ON subscriptions(mercadopago_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 6. Adicionar specialty nas tabelas (se ainda não existir)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS specialty TEXT;

-- 7. Criar função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- FIM DO SQL
-- Execute no Supabase SQL Editor
-- =====================================================
