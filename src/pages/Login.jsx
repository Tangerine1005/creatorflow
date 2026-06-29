/**
 * Login 페이지
 *
 * - 로그인 / 회원가입 모드 전환 (useState)
 * - 글래스모피즘 카드 + 다크 그라디언트 배경
 * - 떠다니는 반투명 원 (보라/시안 그라디언트)
 * - 비밀번호 표시/숨김 토글
 * - 개발 모드: 버튼 클릭 → /setup 으로 이동
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Sparkles,
  LogIn,
  UserPlus,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();

  /* ── 상태 ── */
  const [isLogin, setIsLogin] = useState(true);         // true: 로그인, false: 회원가입
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // 폼 필드
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /* ── 핸들러 ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    // 개발 모드: 유효성 검사 없이 바로 이동
    navigate('/setup');
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    // 모드 전환 시 비밀번호 관련 상태 초기화
    setShowPassword(false);
    setAgreed(false);
  };

  /* ── 비밀번호 토글 아이콘 ── */
  const passwordToggleBtn = (
    <button
      type="button"
      className={styles.passwordToggle}
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <div className={styles.page}>
      {/* ── 배경 떠다니는 원 ── */}
      <div className={styles.bgOrbs}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
      </div>

      {/* ── 글래스 카드 ── */}
      <div className={styles.card}>
        {/* 로고 영역 */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <Sparkles size={24} />
          </div>
          <h1 className={styles.logoText}>CreatorFlow</h1>
          <p className={styles.logoSubtitle}>유튜브 콘텐츠 자동화</p>
        </div>

        {/* 폼 */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* 회원가입 모드: 이름 입력 */}
          {!isLogin && (
            <Input
              label="이름"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User size={18} />}
            />
          )}

          {/* 이메일 */}
          <Input
            type="email"
            label="이메일"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={18} />}
          />

          {/* 비밀번호 */}
          <Input
            type={showPassword ? 'text' : 'password'}
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={18} />}
            rightIcon={passwordToggleBtn}
          />

          {/* 회원가입 모드: 개인정보 동의 */}
          {!isLogin && (
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className={styles.checkboxLabel}>
                <a href="#terms">이용약관</a> 및{' '}
                <a href="#privacy">개인정보 처리방침</a>에 동의합니다 (필수)
              </span>
            </label>
          )}

          {/* 제출 버튼 */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            leftIcon={isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            rightIcon={<ArrowRight size={18} />}
          >
            {isLogin ? '로그인' : '회원가입'}
          </Button>
        </form>

        {/* 모드 전환 */}
        <div className={styles.switchRow}>
          {isLogin ? (
            <>
              계정이 없으신가요?{' '}
              <button type="button" className={styles.switchLink} onClick={toggleMode}>
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button type="button" className={styles.switchLink} onClick={toggleMode}>
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
