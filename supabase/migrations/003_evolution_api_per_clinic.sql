-- Migration: Add Evolution API instance name per clinic
-- URL and API key are global secrets, instance is per-clinic

ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS evolution_instance TEXT;

COMMENT ON COLUMN clinics.evolution_instance IS 'Nome da instância na Evolution (cada clínica tem a sua)';