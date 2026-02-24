-- Tornar o utilizador suedjosue@gmail.com administrador verdadeiro na tabela profiles
UPDATE public.profiles
SET is_admin = true
WHERE email = 'suedjosue@gmail.com';