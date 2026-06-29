/* ============================================
   Supabase 클라이언트 초기화
   .env의 VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY로 연결
   ============================================ */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// URL과 Key가 없으면 null (개발 모드에서는 Mock 사용)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export default supabase;
