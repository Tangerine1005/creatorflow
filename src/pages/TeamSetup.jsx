/**
 * TeamSetup 페이지
 *
 * - 새 팀 만들기 / 팀 참가 탭 전환 (useState)
 * - 팀 생성 시 초대 코드 자동 생성 + 복사 기능
 * - 글래스모피즘 카드 + 배경 데코
 * - Supabase 연동 없이 로컬 상태만으로 동작
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Ticket,
  Copy,
  ArrowRight,
  Sparkles,
  Check,
  UserPlus,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { generateInviteCode, copyToClipboard } from '../utils/helpers';
import styles from './TeamSetup.module.css';

export default function TeamSetup() {
  const navigate = useNavigate();

  /* ── 탭 상태 ── */
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'

  /* ── 새 팀 만들기 상태 ── */
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [teamCreated, setTeamCreated] = useState(false);

  /* ── 팀 참가 상태 ── */
  const [joinCode, setJoinCode] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);

  /* ── 복사 피드백 ── */
  const [copied, setCopied] = useState(false);

  /* ── 핸들러 ── */

  /** 팀 생성 */
  const handleCreateTeam = (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    const code = generateInviteCode();
    setInviteCode(code);
    setTeamCreated(true);
  };

  /** 초대 코드 복사 */
  const handleCopyCode = async () => {
    const success = await copyToClipboard(inviteCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /** 팀 참가 */
  const handleJoinTeam = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    // 개발 모드: 성공 처리 후 대시보드로 이동
    setJoinSuccess(true);
    setTimeout(() => navigate('/'), 1500);
  };

  /** 대시보드로 이동 */
  const handleGoToDashboard = () => {
    navigate('/');
  };

  return (
    <div className={styles.page}>
      {/* ── 배경 데코 ── */}
      <div className={styles.bgOrbs}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
      </div>

      {/* ── 글래스 카드 ── */}
      <div className={styles.card}>
        {/* 헤더 */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Sparkles size={24} />
          </div>
          <h1 className={styles.headerTitle}>팀 설정</h1>
          <p className={styles.headerSubtitle}>
            팀을 만들거나 기존 팀에 참가하세요
          </p>
        </div>

        {/* ── 탭 버튼 ── */}
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'create' ? styles.tabActive : ''}`}
            onClick={() => {
              setActiveTab('create');
              setJoinSuccess(false);
            }}
          >
            <UserPlus size={16} />
            새 팀 만들기
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'join' ? styles.tabActive : ''}`}
            onClick={() => {
              setActiveTab('join');
              setTeamCreated(false);
            }}
          >
            <Ticket size={16} />
            팀 참가
          </button>
        </div>

        {/* ============================================
            새 팀 만들기 탭
            ============================================ */}
        {activeTab === 'create' && (
          <>
            {!teamCreated ? (
              /* 팀 생성 폼 */
              <form className={styles.tabContent} onSubmit={handleCreateTeam}>
                <Input
                  label="팀 이름"
                  placeholder="예: 크리에이터 스튜디오"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  leftIcon={<Users size={18} />}
                />
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  leftIcon={<UserPlus size={18} />}
                  rightIcon={<ArrowRight size={18} />}
                >
                  팀 생성
                </Button>
              </form>
            ) : (
              /* 생성 완료: 초대 코드 표시 */
              <div className={styles.inviteSection}>
                <div className={styles.successMessage}>
                  <Check size={16} />
                  팀 &quot;{teamName}&quot;이(가) 생성되었습니다!
                </div>

                <p className={styles.inviteLabel}>
                  아래 초대 코드를 팀원에게 공유하세요
                </p>

                <div className={styles.inviteCodeBox}>
                  <span className={styles.inviteCode}>{inviteCode}</span>
                  <button
                    type="button"
                    className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                    onClick={handleCopyCode}
                    aria-label="초대 코드 복사"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <div className={styles.divider} />

                <Button
                  variant="primary"
                  fullWidth
                  rightIcon={<ArrowRight size={18} />}
                  onClick={handleGoToDashboard}
                >
                  대시보드로 이동
                </Button>
              </div>
            )}
          </>
        )}

        {/* ============================================
            팀 참가 탭
            ============================================ */}
        {activeTab === 'join' && (
          <>
            {!joinSuccess ? (
              <form className={styles.tabContent} onSubmit={handleJoinTeam}>
                <Input
                  label="초대 코드"
                  placeholder="8자리 초대 코드 입력"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  leftIcon={<Ticket size={18} />}
                  maxLength={8}
                />
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  leftIcon={<Users size={18} />}
                  rightIcon={<ArrowRight size={18} />}
                >
                  팀 참가
                </Button>
              </form>
            ) : (
              <div className={styles.inviteSection}>
                <div className={styles.successMessage}>
                  <Check size={16} />
                  팀에 성공적으로 참가했습니다!
                </div>
                <p className={styles.inviteLabel}>
                  잠시 후 대시보드로 이동합니다…
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
