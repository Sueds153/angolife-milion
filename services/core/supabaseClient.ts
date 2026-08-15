/**
 * @copyright (c) 2024-2026 Resolve.AO by Su-Golden. All rights reserved.
 * @license Proprietary. Unauthorized copying, modification, or reverse engineering is strictly prohibited.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Publishable key (recomendada) com fallback para a anon key legada.
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO CRÍTICO: Credenciais do Supabase não encontradas!');
  console.info('Certifique-se de configurar VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (ou VITE_SUPABASE_ANON_KEY) no seu arquivo .env ou no painel do Netlify.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseKey || 'placeholder-key'
);
