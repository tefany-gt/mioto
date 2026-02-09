import { createClient } from '@supabase/supabase-js';

// Valores de Fallback (Atualizados)
// Isso garante que o app funcione mesmo se o Vite não carregar o arquivo .env
const FALLBACK_URL = 'https://qnksjblsrpihfgkoiuvz.supabase.co';
const FALLBACK_KEY = 'sb_publishable_7B1BNoM8VzJZn3g4e-JPUw_7MXqUq9p';

let supabaseUrl = FALLBACK_URL;
let supabaseKey = FALLBACK_KEY;

// 1. Tenta obter do import.meta.env (Padrão Vite) para sobrescrever se disponível
try {
  // @ts-ignore
  if (import.meta.env?.VITE_SUPABASE_URL) {
      // @ts-ignore
      supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  }
  // @ts-ignore
  if (import.meta.env?.VITE_SUPABASE_KEY) {
      // @ts-ignore
      supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
  }
} catch (e) {
  // Ignora erros de acesso
}

// 2. Validação e Log
if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ IOTU: Credenciais do Supabase ausentes.');
} else {
  // console.log('✅ IOTU: Cliente Supabase iniciado.');
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;