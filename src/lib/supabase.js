import { createClient } from '@supabase/supabase-js';
import useSettingsStore from '../stores/settingsStore';

// 환경 변수 또는 설정에서 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getSupabase() {
  if (supabase) return supabase;
  
  // 설정 스토어에서 동적으로 가져오기
  const settings = useSettingsStore.getState();
  if (settings.supabaseUrl && settings.supabaseAnonKey) {
    return createClient(settings.supabaseUrl, settings.supabaseAnonKey);
  }
  
  return null;
}

export function isSupabaseConfigured() {
  return !!getSupabase();
}
