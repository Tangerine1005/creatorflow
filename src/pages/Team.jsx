/* ============================================
   Team Page — 팀 관리
   역할 변경, 팀원 제거, 초대 코드, 활동 로그, 팀 정보
   ============================================ */

import { useState, useMemo } from 'react';
import {
  Users, Crown, Edit3, Eye, UserPlus, Copy, Shield, Trash2,
  Clock, RefreshCw, Activity, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { mockTeamMembers, mockActivityLogs } from '../mocks/mockData';
import { generateInviteCode, copyToClipboard, getRelativeTime } from '../utils/helpers';
import { ROLE_LABELS } from '../utils/constants';
import styles from './Team.module.css';

const ROLE_ICONS = {
  admin: Crown,
  editor: Edit3,
  viewer: Eye,
};

const ROLE_VARIANTS = {
  admin: 'accent',
  editor: 'success',
  viewer: 'default',
};

const ROLE_OPTIONS = [
  { value: 'editor', label: '에디터' },
  { value: 'viewer', label: '뷰어' },
];

const ACTION_LABELS = {
  created: '생성',
  edited: '수정',
  published: '업로드',
  deleted: '삭제',
};

const ACTION_ICONS = {
  created: '🆕',
  edited: '✏️',
  published: '🚀',
  deleted: '🗑️',
};

export default function Team() {
  const toast = useToast();

  /* ── 팀원 상태 ── */
  const [members, setMembers] = useState(mockTeamMembers);

  /* ── 초대 코드 ── */
  const [inviteCode, setInviteCode] = useState(generateInviteCode());
  const [copied, setCopied] = useState(false);

  /* ── 삭제 확인 모달 ── */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  /* ── 활동 로그 접기/펼치기 ── */
  const [showAllLogs, setShowAllLogs] = useState(false);
  const INITIAL_LOG_COUNT = 3;
  const visibleLogs = showAllLogs
    ? mockActivityLogs
    : mockActivityLogs.slice(0, INITIAL_LOG_COUNT);

  /* ── 팀 정보 ── */
  const teamInfo = useMemo(() => ({
    name: 'CreatorFlow 팀',
    memberCount: members.length,
    createdAt: '2025-06-01T00:00:00+09:00',
  }), [members.length]);

  /* ── 핸들러: 초대 코드 복사 ── */
  const handleCopy = async () => {
    await copyToClipboard(inviteCode);
    setCopied(true);
    toast.success('📋 초대 코드가 복사되었습니다.');
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── 핸들러: 새 초대 코드 생성 ── */
  const handleRegenerate = () => {
    const newCode = generateInviteCode();
    setInviteCode(newCode);
    toast.info('🔄 새로운 초대 코드가 생성되었습니다.');
  };

  /* ── 핸들러: 역할 변경 ── */
  const handleRoleChange = (memberId, newRole) => {
    setMembers(prev =>
      prev.map(m =>
        m.id === memberId ? { ...m, role: newRole } : m
      )
    );
    const member = members.find(m => m.id === memberId);
    toast.success(
      `✅ 역할 변경 완료`,
      `${member?.displayName}님의 역할이 ${ROLE_LABELS[newRole].ko}(으)로 변경되었습니다.`
    );
  };

  /* ── 핸들러: 팀원 제거 모달 열기 ── */
  const handleDeleteClick = (member) => {
    setDeleteTarget(member);
    setIsDeleteModalOpen(true);
  };

  /* ── 핸들러: 팀원 제거 확인 ── */
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setMembers(prev => prev.filter(m => m.id !== deleteTarget.id));
    toast.success(
      `🗑️ 팀원 제거 완료`,
      `${deleteTarget.displayName}님이 팀에서 제거되었습니다.`
    );
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  /* ── 핸들러: 팀원 제거 취소 ── */
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className={styles.team}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Users size={24} />
          팀 관리
        </h2>
      </div>

      {/* ─── 팀 정보 카드 ─── */}
      <Card className={styles.teamInfoCard}>
        <div className={styles.teamInfoGrid}>
          <div className={styles.teamInfoItem}>
            <Shield size={20} className={styles.teamInfoIcon} />
            <div>
              <span className={styles.teamInfoLabel}>팀명</span>
              <span className={styles.teamInfoValue}>{teamInfo.name}</span>
            </div>
          </div>
          <div className={styles.teamInfoItem}>
            <Users size={20} className={styles.teamInfoIcon} />
            <div>
              <span className={styles.teamInfoLabel}>멤버</span>
              <span className={styles.teamInfoValue}>{teamInfo.memberCount}명</span>
            </div>
          </div>
          <div className={styles.teamInfoItem}>
            <Calendar size={20} className={styles.teamInfoIcon} />
            <div>
              <span className={styles.teamInfoLabel}>생성일</span>
              <span className={styles.teamInfoValue}>
                {new Date(teamInfo.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── 초대 코드 ─── */}
      <Card className={styles.inviteCard}>
        <div className={styles.inviteHeader}>
          <div>
            <h3 className={styles.inviteTitle}>
              <UserPlus size={20} />
              팀원 초대
            </h3>
            <p className={styles.inviteDesc}>아래 초대 코드를 팀원에게 공유하세요</p>
          </div>
          <div className={styles.inviteRight}>
            <div className={styles.inviteCode}>
              <span className={styles.codeText}>{inviteCode}</span>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={copied ? <Shield size={16} /> : <Copy size={16} />}
                onClick={handleCopy}
              >
                {copied ? '복사됨!' : '복사'}
              </Button>
            </div>
            <div className={styles.inviteMeta}>
              <span className={styles.inviteExpiry}>
                <Clock size={14} />
                유효기간: 24시간
              </span>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RefreshCw size={14} />}
                onClick={handleRegenerate}
              >
                새 코드 생성
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── 팀원 목록 ─── */}
      <div className={styles.memberList}>
        <h3 className={styles.listTitle}>
          팀원 ({members.length}명)
        </h3>

        {members.map((member, index) => {
          const RoleIcon = ROLE_ICONS[member.role];
          return (
            <div
              key={member.id}
              className={`${styles.memberRow} animate-fade-in-up stagger-${index + 1}`}
            >
              <div className={styles.memberAvatar}>
                {member.displayName.charAt(0)}
              </div>

              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{member.displayName}</span>
                <span className={styles.memberEmail}>{member.email}</span>
              </div>

              <Badge variant={ROLE_VARIANTS[member.role]} size="sm">
                <RoleIcon size={12} /> {ROLE_LABELS[member.role].ko}
              </Badge>

              {member.role !== 'admin' && (
                <div className={styles.memberActions}>
                  <select
                    className={styles.roleSelect}
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  >
                    {ROLE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className={styles.removeBtn}
                    title="제거"
                    onClick={() => handleDeleteClick(member)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── 활동 로그 ─── */}
      <Card className={styles.activityCard}>
        <h3 className={styles.activityTitle}>
          <Activity size={20} />
          최근 활동
        </h3>
        <div className={styles.activityTimeline}>
          {visibleLogs.map((log, idx) => (
            <div key={log.id} className={`${styles.activityItem} animate-fade-in-up stagger-${idx + 1}`}>
              <div className={styles.timelineDot} />
              {idx < visibleLogs.length - 1 && <div className={styles.timelineLine} />}
              <div className={styles.activityContent}>
                <div className={styles.activityTop}>
                  <span className={styles.activityEmoji}>
                    {ACTION_ICONS[log.action] || '📌'}
                  </span>
                  <span className={styles.activityUser}>{log.userName}</span>
                  <span className={styles.activityAction}>
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                </div>
                <p className={styles.activityDetails}>{log.details}</p>
                <span className={styles.activityTime}>
                  <Clock size={12} />
                  {getRelativeTime(log.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
        {mockActivityLogs.length > INITIAL_LOG_COUNT && (
          <button
            className={styles.showMoreBtn}
            onClick={() => setShowAllLogs(!showAllLogs)}
          >
            {showAllLogs ? (
              <>접기 <ChevronUp size={16} /></>
            ) : (
              <>더 보기 ({mockActivityLogs.length - INITIAL_LOG_COUNT}개) <ChevronDown size={16} /></>
            )}
          </button>
        )}
      </Card>

      {/* ─── 권한 설명 ─── */}
      <Card className={styles.rolesCard}>
        <h3 className={styles.rolesTitle}>역할별 권한</h3>
        <div className={styles.rolesGrid}>
          <div className={styles.roleItem}>
            <Crown size={20} className={styles.roleIconAdmin} />
            <div>
              <strong>관리자</strong>
              <p>모든 기능 사용, 팀원 관리, 설정 변경</p>
            </div>
          </div>
          <div className={styles.roleItem}>
            <Edit3 size={20} className={styles.roleIconEditor} />
            <div>
              <strong>에디터</strong>
              <p>콘텐츠 생성/편집, 라이브러리 사용</p>
            </div>
          </div>
          <div className={styles.roleItem}>
            <Eye size={20} className={styles.roleIconViewer} />
            <div>
              <strong>뷰어</strong>
              <p>콘텐츠 열람, 분석 데이터 확인</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── 삭제 확인 모달 ─── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        title="팀원 제거"
        size="sm"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="secondary" onClick={handleDeleteCancel}>
              취소
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              <Trash2 size={16} /> 제거
            </Button>
          </div>
        }
      >
        <div className={styles.deleteModalBody}>
          {deleteTarget && (
            <>
              <div className={styles.deleteAvatar}>
                {deleteTarget.displayName.charAt(0)}
              </div>
              <p className={styles.deleteText}>
                <strong>{deleteTarget.displayName}</strong>님을 팀에서 제거하시겠습니까?
              </p>
              <p className={styles.deleteWarning}>
                이 작업은 되돌릴 수 없으며, 해당 팀원은 더 이상 콘텐츠에 접근할 수 없습니다.
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
