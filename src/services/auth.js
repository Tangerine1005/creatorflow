/* ============================================
   Auth 서비스
   Supabase Auth 연동 (로그인/회원가입/로그아웃/세션)
   ============================================ */

import { supabase } from './supabase';

/**
 * Supabase가 연결되어 있는지 확인
 */
function isConnected() {
  return supabase !== null;
}

const authService = {
  /**
   * 이메일+비밀번호 회원가입
   */
  async signUp(email, password, displayName) {
    if (!isConnected()) {
      return { user: { id: 'mock-user', email }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    return { user: data?.user, error };
  },

  /**
   * 이메일+비밀번호 로그인
   */
  async signIn(email, password) {
    if (!isConnected()) {
      return { user: { id: 'mock-user', email }, session: { access_token: 'mock-token' }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { user: data?.user, session: data?.session, error };
  },

  /**
   * Google OAuth 로그인
   */
  async signInWithGoogle() {
    if (!isConnected()) {
      return { error: { message: 'Supabase가 연결되지 않았습니다.' } };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    return { data, error };
  },

  /**
   * 로그아웃
   */
  async signOut() {
    if (!isConnected()) return { error: null };

    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * 현재 세션 가져오기
   */
  async getSession() {
    if (!isConnected()) return { session: null };

    const { data } = await supabase.auth.getSession();
    return { session: data?.session };
  },

  /**
   * 현재 사용자 가져오기
   */
  async getUser() {
    if (!isConnected()) return { user: null };

    const { data } = await supabase.auth.getUser();
    return { user: data?.user };
  },

  /**
   * 인증 상태 변경 리스너
   */
  onAuthStateChange(callback) {
    if (!isConnected()) return { data: { subscription: { unsubscribe: () => {} } } };

    return supabase.auth.onAuthStateChange(callback);
  },

  /**
   * 비밀번호 재설정 이메일 발송
   */
  async resetPassword(email) {
    if (!isConnected()) {
      return { error: { message: 'Supabase가 연결되지 않았습니다.' } };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });

    return { error };
  },
};

export default authService;
