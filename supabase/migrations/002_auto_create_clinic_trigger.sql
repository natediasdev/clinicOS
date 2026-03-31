-- =====================================================
-- TRIGGER: Criar clínica automaticamente ao registrar
-- Execute este SQL no Dashboard do Supabase > SQL Editor
-- =====================================================

-- 1. Recriar a função de trigger atualizada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_clinic_id uuid;
  v_clinic_name text;
BEGIN
  -- Pega clinic_id dos metadados (se enviado)
  v_clinic_id := (NEW.raw_user_meta_data->>'clinic_id')::uuid;

  -- Se não veio clinic_id, cria uma clínica automaticamente
  IF v_clinic_id IS NULL THEN
    -- Gera um novo UUID para a clínica
    v_clinic_id := gen_random_uuid();
    
    -- Pega o nome do usuário para nomear a clínica
    v_clinic_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email) || ' Clínica';
    
    -- Cria a clínica com o UUID gerado
    INSERT INTO public.clinics (id, name, plan, created_at)
    VALUES (v_clinic_id, v_clinic_name, 'free', NOW());
  END IF;

  -- Cria o profile com o clinic_id (ou novo ou dos metadados)
  INSERT INTO public.profiles (id, clinic_id, role, onboarding_completed)
  VALUES (
    NEW.id,
    v_clinic_id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
    false  -- sempre começa com onboarding incompleto
  );

  -- Se veio com clinic_id nos metadados (usuário convidado),
  -- linka o user_id na tabela staff pelo email
  IF (NEW.raw_user_meta_data->>'clinic_id') IS NOT NULL THEN
    UPDATE public.staff
    SET user_id = NEW.id
    WHERE email = NEW.email
    AND clinic_id = v_clinic_id
    AND user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recriar o trigger (apaga o antigo primeiro se existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FIM DO SQL
-- Execute no Supabase SQL Editor
-- =====================================================