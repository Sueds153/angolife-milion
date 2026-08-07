-- Adiciona coluna premium_expiry (timestamp em ms) para suportar planos com
-- expiração (Prata 30 dias) vs premium vitalício (sem expiração).
-- Utilizada por referral-reward (gold) e subscription-approve.
alter table public.profiles
  add column if not exists premium_expiry bigint;
