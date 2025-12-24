-- Tabela para armazenar códigos temporários de vinculação Telegram
CREATE TABLE public.telegram_link_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  used boolean NOT NULL DEFAULT false
);

-- Habilitar RLS
ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - usuários podem gerenciar seus próprios códigos
CREATE POLICY "Users can view their own link codes"
ON public.telegram_link_codes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own link codes"
ON public.telegram_link_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own link codes"
ON public.telegram_link_codes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own link codes"
ON public.telegram_link_codes
FOR DELETE
USING (auth.uid() = user_id);

-- Índice para busca rápida por código
CREATE INDEX idx_telegram_link_codes_code ON public.telegram_link_codes(code);

-- Índice para limpeza de códigos expirados
CREATE INDEX idx_telegram_link_codes_expires_at ON public.telegram_link_codes(expires_at);