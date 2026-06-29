/* ============================================
   Library Page — 콘텐츠 라이브러리
   그리드/리스트 뷰, 필터, 정렬, 검색, 페이지네이션
   상세 모달, 편집/삭제/복제 인터랙션
   ============================================ */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Grid3X3, List, Edit, Trash2, Copy, Eye, Plus,
  Filter, ArrowUpDown, FolderOpen, FileEdit, CheckCircle,
  Clock, Upload
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { mockContents } from '../mocks/mockData';
import { useToast } from '../components/ui/Toast';
import { formatDate, getRelativeTime, generateId } from '../utils/helpers';
import { CATEGORIES } from '../utils/constants';
import styles from './Library.module.css';

/* ── 상수 ── */
const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  draft:     { label: '초안',   variant: 'warning', icon: FileEdit },
  completed: { label: '완성',   variant: 'success', icon: CheckCircle },
  scheduled: { label: '예약됨', variant: 'info',    icon: Clock },
  published: { label: '발행됨', variant: 'accent',  icon: Upload },
};

const STATUS_FILTERS = [
  { key: 'all',       label: '전체' },
  { key: 'draft',     label: '초안' },
  { key: 'completed', label: '완성' },
  { key: 'scheduled', label: '예약' },
  { key: 'published', label: '발행' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'name',   label: '이름순' },
  { value: 'status', label: '상태순' },
];

const STATUS_ORDER = { draft: 0, completed: 1, scheduled: 2, published: 3 };

export default function Library() {
  const navigate = useNavigate();
  const toast = useToast();

  /* ── 로컬 콘텐츠 상태 (삭제/복제 반영) ── */
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../services/db').then(({ contentService }) => {
      import('../services/auth').then(({ default: authService }) => {
        authService.getUser().then(({ user }) => {
          const teamId = user?.id;
          if (!teamId) {
            setLoading(false);
            return;
          }
          contentService.list(teamId).then(({ data, error }) => {
            if (!error && data) {
              setContents(data);
            } else {
              console.error(error);
            }
            setLoading(false);
          });
        });
      });
    });
  }, []);

  /* ── 뷰 모드 ── */
  const [viewMode, setViewMode] = useState('grid');

  /* ── 필터/정렬/검색 ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  /* ── 페이지네이션 ── */
  const [currentPage, setCurrentPage] = useState(1);

  /* ── 모달 상태 ── */
  const [detailModal, setDetailModal] = useState(null);   // 상세 모달용 콘텐츠
  const [deleteTarget, setDeleteTarget] = useState(null);  // 삭제 확인 대상

  /* ── 필터 + 정렬 + 검색 적용 ── */
  const processedContents = useMemo(() => {
    let items = [...contents];

    // 상태 필터
    if (statusFilter !== 'all') {
      items = items.filter(c => c.status === statusFilter);
    }
    // 카테고리 필터
    if (categoryFilter !== 'all') {
      items = items.filter(c => c.category === categoryFilter);
    }
    // 검색
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(c =>
        c.topic?.toLowerCase().includes(q) ||
        c.titles?.some(t => t?.toLowerCase().includes(q))
      );
    }
    // 정렬
    items.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'name') {
        const nameA = (a.titles?.[a.selectedTitleIndex] || a.topic || '').toLowerCase();
        const nameB = (b.titles?.[b.selectedTitleIndex] || b.topic || '').toLowerCase();
        return nameA.localeCompare(nameB, 'ko');
      }
      if (sortBy === 'status') return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      return 0;
    });

    return items;
  }, [contents, statusFilter, categoryFilter, searchQuery, sortBy]);

  /* ── 페이지네이션 계산 ── */
  const totalPages = Math.ceil(processedContents.length / PAGE_SIZE);
  const paginatedContents = processedContents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  /* ── 헬퍼 ── */
  const getTitle = (c) => c.titles?.[c.selectedTitleIndex] || c.topic || '(제목 없음)';
  const getCategoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat;
  const getCategoryEmoji = (cat) => cat === 'work' ? '💼' : cat === 'daily' ? '🏠' : '🔥';

  /* ── 필터 변경 시 페이지 리셋 ── */
  const resetPage = () => setCurrentPage(1);

  /* ── 액션 핸들러 ── */
  const handleEdit = useCallback((content) => {
    console.log(`[편집] 콘텐츠 "${getTitle(content)}" → /create 이동`);
    navigate('/create');
  }, [navigate]);

  const handleDelete = useCallback((content) => {
    setDeleteTarget(content);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    
    try {
      const { contentService } = await import('../services/db');
      await contentService.delete(deleteTarget.id);
      
      setContents(prev => prev.filter(c => c.id !== deleteTarget.id));
      toast.success('삭제 완료', `"${getTitle(deleteTarget)}" 콘텐츠가 삭제되었습니다.`);
      setDeleteTarget(null);
      setDetailModal(null);
    } catch (e) {
      toast.error('삭제 실패', e.message);
    }
  }, [deleteTarget, toast]);

  const handleDuplicate = useCallback(async (content) => {
    try {
      const { contentService } = await import('../services/db');
      const newContentData = {
        team_id: content.team_id,
        status: 'draft',
        titles: content.titles?.length
          ? [content.titles[content.selectedTitleIndex] + ' (복사본)', ...content.titles.slice(1)]
          : [],
        topic: content.topic + ' (복사본)',
        category: content.category,
        tone: content.tone,
        selectedTitleIndex: 0,
        // DB 테이블 컬럼에 맞는 필드만 복사해야 함
      };
      
      const { data, error } = await contentService.create(newContentData);
      
      if (error) throw error;
      
      setContents(prev => [data, ...prev]);
      toast.success('복제 완료', `"${getTitle(content)}" 콘텐츠가 복제되었습니다.`);
    } catch (e) {
      toast.error('복제 실패', e.message);
    }
  }, [toast]);

  /* ── 카테고리 필터 옵션 ── */
  const categoryOptions = [
    { value: 'all', label: '모든 카테고리' },
    ...CATEGORIES.map(c => ({ value: c.value, label: c.label })),
  ];

  return (
    <div className={styles.library}>
      {/* ======== 헤더 ======== */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <FolderOpen size={24} />
            라이브러리
          </h2>
          <span className={styles.count}>{processedContents.length}개의 콘텐츠</span>
        </div>
        <div className={styles.headerRight}>
          <Button
            variant="primary"
            leftIcon={<Plus size={18} />}
            onClick={() => navigate('/create')}
          >
            새 콘텐츠
          </Button>
        </div>
      </div>

      {/* ======== 필터 바 ======== */}
      <div className={styles.filterBar}>
        {/* 검색 */}
        <div className={styles.searchWrapper}>
          <Input
            placeholder="제목 또는 주제로 검색..."
            leftIcon={<Search size={18} />}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); resetPage(); }}
          />
        </div>

        {/* 정렬 */}
        <div className={styles.sortWrapper}>
          <ArrowUpDown size={16} className={styles.sortIcon} />
          <Select
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); resetPage(); }}
            placeholder=""
          />
        </div>

        {/* 카테고리 필터 */}
        <div className={styles.categoryWrapper}>
          <Filter size={16} className={styles.filterIcon} />
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); resetPage(); }}
            placeholder=""
          />
        </div>

        {/* 뷰 전환 */}
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="그리드 뷰"
          >
            <Grid3X3 size={18} />
          </button>
          <button
            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="리스트 뷰"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* ======== 상태 필터 버튼 그룹 ======== */}
      <div className={styles.statusFilters}>
        {STATUS_FILTERS.map(sf => (
          <button
            key={sf.key}
            className={`${styles.statusBtn} ${statusFilter === sf.key ? styles.statusActive : ''}`}
            onClick={() => { setStatusFilter(sf.key); resetPage(); }}
          >
            {sf.label}
            {sf.key !== 'all' && (
              <span className={styles.statusCount}>
                {contents.filter(c => c.status === sf.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ======== 콘텐츠 목록 ======== */}
      {paginatedContents.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="콘텐츠가 없습니다"
          description={searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
            ? '검색 조건에 맞는 콘텐츠가 없습니다. 필터를 변경해보세요.'
            : '새로운 콘텐츠를 만들어보세요!'
          }
          action={
            <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => navigate('/create')}>
              콘텐츠 만들기
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        /* ── 그리드 뷰 ── */
        <div className={styles.grid}>
          {paginatedContents.map((content, index) => (
            <Card
              key={content.id}
              variant="interactive"
              className={`${styles.contentCard} animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
              onClick={() => setDetailModal(content)}
            >
              {/* 썸네일 */}
              <div className={styles.thumbnail}>
                <div className={styles.thumbnailPlaceholder}>
                  <span>{getCategoryEmoji(content.category)}</span>
                </div>
                <div className={styles.statusOverlay}>
                  <Badge variant={STATUS_CONFIG[content.status]?.variant}>
                    {STATUS_CONFIG[content.status]?.label}
                  </Badge>
                </div>
              </div>

              {/* 정보 */}
              <div className={styles.contentInfo}>
                <h3 className={styles.contentTitle}>{getTitle(content)}</h3>
                <div className={styles.contentMeta}>
                  <Badge variant="default" size="sm">{getCategoryLabel(content.category)}</Badge>
                  <span className={styles.contentDate}>{getRelativeTime(content.createdAt)}</span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className={styles.contentActions} onClick={(e) => e.stopPropagation()}>
                <button className={styles.actionBtn} onClick={() => handleEdit(content)} title="편집">
                  <Edit size={15} />
                </button>
                <button className={styles.actionBtn} onClick={() => handleDuplicate(content)} title="복제">
                  <Copy size={15} />
                </button>
                <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={() => handleDelete(content)} title="삭제">
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* ── 리스트 뷰 (테이블) ── */
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>제목</th>
                <th>카테고리</th>
                <th>상태</th>
                <th>생성일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {paginatedContents.map((content, index) => (
                <tr
                  key={content.id}
                  className={`${styles.tableRow} animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
                  onClick={() => setDetailModal(content)}
                >
                  <td className={styles.titleCell}>
                    <span className={styles.titleEmoji}>{getCategoryEmoji(content.category)}</span>
                    <span className={styles.titleText}>{getTitle(content)}</span>
                  </td>
                  <td>
                    <Badge variant="default" size="sm">{getCategoryLabel(content.category)}</Badge>
                  </td>
                  <td>
                    <Badge variant={STATUS_CONFIG[content.status]?.variant} size="sm">
                      {STATUS_CONFIG[content.status]?.label}
                    </Badge>
                  </td>
                  <td className={styles.dateCell}>{formatDate(content.createdAt, 'short')}</td>
                  <td className={styles.actionsCell} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.actionBtn} onClick={() => handleEdit(content)} title="편집">
                      <Edit size={15} />
                    </button>
                    <button className={styles.actionBtn} onClick={() => handleDuplicate(content)} title="복제">
                      <Copy size={15} />
                    </button>
                    <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={() => handleDelete(content)} title="삭제">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ======== 페이지네이션 ======== */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* ======== 상세 모달 ======== */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={detailModal ? getTitle(detailModal) : ''}
        size="md"
        footer={
          detailModal && (
            <div className={styles.modalFooter}>
              <Button variant="ghost" onClick={() => setDetailModal(null)}>닫기</Button>
              <div className={styles.modalFooterRight}>
                <Button
                  variant="secondary"
                  leftIcon={<Edit size={16} />}
                  onClick={() => { setDetailModal(null); handleEdit(detailModal); }}
                >
                  편집
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Copy size={16} />}
                  onClick={() => { handleDuplicate(detailModal); setDetailModal(null); }}
                >
                  복제
                </Button>
                <Button
                  variant="danger"
                  leftIcon={<Trash2 size={16} />}
                  onClick={() => handleDelete(detailModal)}
                >
                  삭제
                </Button>
              </div>
            </div>
          )
        }
      >
        {detailModal && (
          <div className={styles.detailContent}>
            {/* 상태 + 카테고리 + 톤 배지 */}
            <div className={styles.detailBadges}>
              <Badge variant={STATUS_CONFIG[detailModal.status]?.variant}>
                {STATUS_CONFIG[detailModal.status]?.label}
              </Badge>
              <Badge variant="default">{getCategoryLabel(detailModal.category)}</Badge>
              {detailModal.tone && (
                <Badge variant="accent">{detailModal.tone}</Badge>
              )}
            </div>

            {/* 스크립트 미리보기 */}
            {detailModal.scriptNarration && (
              <div className={styles.detailSection}>
                <h4 className={styles.detailLabel}>스크립트 미리보기</h4>
                <p className={styles.detailScript}>
                  {detailModal.scriptNarration.length > 100
                    ? detailModal.scriptNarration.slice(0, 100) + '...'
                    : detailModal.scriptNarration
                  }
                </p>
              </div>
            )}

            {/* 해시태그 */}
            {detailModal.hashtags?.length > 0 && (
              <div className={styles.detailSection}>
                <h4 className={styles.detailLabel}>해시태그</h4>
                <div className={styles.detailHashtags}>
                  {detailModal.hashtags.map((tag, i) => (
                    <span key={i} className={styles.hashtag}>#{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 생성일 */}
            <div className={styles.detailSection}>
              <h4 className={styles.detailLabel}>생성일</h4>
              <p className={styles.detailDate}>{formatDate(detailModal.createdAt, 'full')}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* ======== 삭제 확인 모달 ======== */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="콘텐츠 삭제"
        size="sm"
        footer={
          <div className={styles.deleteModalFooter}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>취소</Button>
            <Button variant="danger" leftIcon={<Trash2 size={16} />} onClick={confirmDelete}>
              삭제
            </Button>
          </div>
        }
      >
        <p className={styles.deleteMessage}>
          <strong>"{deleteTarget ? getTitle(deleteTarget) : ''}"</strong> 콘텐츠를 삭제하시겠습니까?
          <br />
          <span className={styles.deleteWarning}>이 작업은 되돌릴 수 없습니다.</span>
        </p>
      </Modal>
    </div>
  );
}
