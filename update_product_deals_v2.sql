-- SQL Migration: Add category support to product_deals
-- Enables organizing discounts into Alimentação, Limpeza, etc.
ALTER TABLE public.product_deals
ADD COLUMN IF NOT EXISTS category TEXT;
-- Update RLS to ensure category is viewable
-- (Existing READ policy already uses TRUE, so it covers all columns)
COMMENT ON COLUMN public.product_deals.category IS 'Categoria do produto (ex: Alimentação, Bebidas, Higiene)';