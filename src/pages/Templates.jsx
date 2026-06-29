/* ============================================
   Templates Page — 템플릿 관리
   생성/편집/삭제/사용하기, 카테고리 필터, 검색
   ============================================ */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Edit, Trash2, Play, Search, Filter, Star
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { mockTemplates } from '../mocks/mockData';
import { useToast } from '../components/ui/Toast';
import { generateId, formatDate } from '../utils/helpers';
import { CATEGORIES, TONES } from '../utils/constants';
import styles from './Templates.module.css';

/* ── 카테고리 필터 버튼 ── */
const CATEGORY_FILTERS = [
  { key: 'all', label: '전체' },
  ...CATEGORIES.map(c => ({ key: c.value, label: c.label })),
];

/* ── 빈 폼 초기값 ── */
const EMPTY_FORM = {
  name: '',
  category: '',
  tone: '',
  promptTemplate: '',
};

export default function Templates() {
  const navigate = useNavigate();
  const toast = useToast();

  /* ── 로컬 템플릿 상태 ── */
  const [templates, setTemplates] = useState(mockTemplates);

  /* ── 필터/검색 ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  /* ── 모달 상태 ── */
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);       // 편집 대상 템플릿
  const [deleteTarget, setDeleteTarget] = useState(null);    // 삭제 대상 템플릿

  /* ── 폼 데이터 ── */
  const [form, setForm] = useState(EMPTY_FORM);

  /* ── 헬퍼 ── */
  const getCategoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat;
  const getToneLabel = (tone) => TONES.find(t => t.value === tone)?.label || tone;

  const categoryOptions = CATEGORIES.map(c => ({ value: c.value, label: c.label }));
  const toneOptions = TONES.map(t => ({ value: t.value, label: `${t.emoji} ${t.label}` }));

  /* ── 필터 + 검색 적용 ── */
  const filteredTemplates = useMemo(() => {
    let items = [...templates];

    if (categoryFilter !== 'all') {
      items = items.filter(t => t.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(t => t.name.toLowerCase().includes(q));
    }

    return items;
  }, [templates, categoryFilter, searchQuery]);

  /* ── 폼 핸들러 ── */
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => setForm(EMPTY_FORM);

  const isFormValid = form.name.trim() && form.category && form.tone && form.promptTemplate.trim();

  /* ── 생성 ── */
  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const handleCreate = useCallback(() => {
    if (!isFormValid) return;
    const newTemplate = {
      id: generateId(),
      name: form.name.trim(),
      category: form.category,
      tone: form.tone,
      language: 'ko',
      promptTemplate: form.promptTemplate.trim(),
      useCount: 0,
      createdAt: new Date().toISOString(),
    };
    setTemplates(prev => [newTemplate, ...prev]);
    setCreateModalOpen(false);
    resetForm();
    toast.success('생성 완료', `"${newTemplate.name}" 템플릿이 생성되었습니다.`);
  }, [form, isFormValid, toast]);

  /* ── 편집 ── */
  const openEditModal = (template) => {
    setForm({
      name: template.name,
      category: template.category,
      tone: template.tone,
      promptTemplate: template.promptTemplate,
    });
    setEditTarget(template);
  };

  const handleEdit = useCallback(() => {
    if (!editTarget || !isFormValid) return;
    setTemplates(prev => prev.map(t =>
      t.id === editTarget.id
        ? { ...t, name: form.name.trim(), category: form.category, tone: form.tone, promptTemplate: form.promptTemplate.trim() }
        : t
    ));
    toast.success('수정 완료', `"${form.name.trim()}" 템플릿이 수정되었습니다.`);
    setEditTarget(null);
    resetForm();
  }, [editTarget, form, isFormValid, toast]);

  /* ── 삭제 ── */
  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
    toast.success('삭제 완료', `"${deleteTarget.name}" 템플릿이 삭제되었습니다.`);
    setDeleteTarget(null);
  }, [deleteTarget, toast]);

  /* ── 사용하기 ── */
  const handleUse = useCallback((template) => {
    setTemplates(prev => prev.map(t =>
      t.id === template.id ? { ...t, useCount: (t.useCount || 0) + 1 } : t
    ));
    toast.success('템플릿이 적용되었습니다', `"${template.name}" 설정으로 콘텐츠를 생성합니다.`);
    navigate('/create');
  }, [navigate, toast]);

  /* ── 폼 모달 렌더 (생성/편집 공용) ── */
  const renderFormModal = (isOpen, onClose, onSubmit, modalTitle, submitLabel) => (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); resetForm(); }}
      title={modalTitle}
      size="md"
      footer={
        <div className={styles.formModalFooter}>
          <Button variant="ghost" onClick={() => { onClose(); resetForm(); }}>취소</Button>
          <Button variant="primary" onClick={onSubmit} disabled={!isFormValid}>
            {submitLabel}
          </Button>
        </div>
      }
    >
      <div className={styles.formContent}>
        <Input
          label="템플릿 이름"
          placeholder="예: 직장인 공감 유머"
          value={form.name}
          onChange={(e) => updateForm('name', e.target.value)}
          maxLength={50}
        />
        <Select
          label="카테고리"
          options={categoryOptions}
          value={form.category}
          onChange={(e) => updateForm('category', e.target.value)}
          placeholder="카테고리 선택"
        />
        <Select
          label="톤"
          options={toneOptions}
          value={form.tone}
          onChange={(e) => updateForm('tone', e.target.value)}
          placeholder="톤 선택"
        />
        <div className={styles.textareaWrapper}>
          <label className={styles.textareaLabel}>프롬프트 템플릿</label>
          <textarea
            className={styles.textarea}
            placeholder="스크립트 생성 시 사용할 프롬프트를 입력하세요. {topic}을 사용하면 주제가 자동으로 대입됩니다."
            value={form.promptTemplate}
            onChange={(e) => updateForm('promptTemplate', e.target.value)}
            rows={5}
          />
        </div>
      </div>
    </Modal>
  );

  return (
    <div className={styles.templates}>
      {/* ======== 헤더 ======== */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <FileText size={24} />
            템플릿
          </h2>
          <span className={styles.count}>{filteredTemplates.length}개</span>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={openCreateModal}>
          새 템플릿
        </Button>
      </div>

      {/* ======== 검색 + 카테고리 필터 ======== */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Input
            placeholder="템플릿 이름 검색..."
            leftIcon={<Search size={18} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.categoryFilters}>
        {CATEGORY_FILTERS.map(cf => (
          <button
            key={cf.key}
            className={`${styles.catBtn} ${categoryFilter === cf.key ? styles.catActive : ''}`}
            onClick={() => setCategoryFilter(cf.key)}
          >
            {cf.label}
          </button>
        ))}
      </div>

      {/* ======== 템플릿 카드 그리드 ======== */}
      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="템플릿이 없습니다"
          description={searchQuery || categoryFilter !== 'all'
            ? '검색 조건에 맞는 템플릿이 없습니다.'
            : '자주 사용하는 스크립트 설정을 템플릿으로 저장하세요.'
          }
          action={
            <Button variant="primary" leftIcon={<Plus size={18} />} onClick={openCreateModal}>
              템플릿 만들기
            </Button>
          }
        />
      ) : (
        <div className={styles.grid}>
          {filteredTemplates.map((template, index) => (
            <Card
              key={template.id}
              variant="interactive"
              className={`${styles.templateCard} animate-fade-in-up stagger-${Math.min(index + 1, 5)}`}
            >
              {/* 아이콘 + 액션 헤더 */}
              <div className={styles.templateHeader}>
                <div className={styles.templateIcon}>
                  <FileText size={20} />
                </div>
                <div className={styles.templateActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => openEditModal(template)}
                    title="편집"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.dangerBtn}`}
                    onClick={() => setDeleteTarget(template)}
                    title="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* 이름 */}
              <h3 className={styles.templateName}>{template.name}</h3>

              {/* 배지 */}
              <div className={styles.templateTags}>
                <Badge variant="default" size="sm">{getCategoryLabel(template.category)}</Badge>
                <Badge variant="accent" size="sm">{getToneLabel(template.tone)}</Badge>
              </div>

              {/* 프롬프트 미리보기 */}
              <p className={styles.templatePrompt}>{template.promptTemplate}</p>

              {/* 하단: 사용 횟수 + 생성일 + 사용하기 버튼 */}
              <div className={styles.templateFooter}>
                <div className={styles.templateMeta}>
                  <span className={styles.useCount}>
                    <Star size={14} /> {template.useCount}회 사용
                  </span>
                  <span className={styles.createdDate}>
                    {formatDate(template.createdAt, 'short')}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Play size={14} />}
                  onClick={() => handleUse(template)}
                >
                  사용하기
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ======== 생성 모달 ======== */}
      {renderFormModal(
        createModalOpen,
        () => setCreateModalOpen(false),
        handleCreate,
        '새 템플릿 만들기',
        '생성'
      )}

      {/* ======== 편집 모달 ======== */}
      {renderFormModal(
        !!editTarget,
        () => setEditTarget(null),
        handleEdit,
        '템플릿 편집',
        '저장'
      )}

      {/* ======== 삭제 확인 모달 ======== */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="템플릿 삭제"
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
          <strong>"{deleteTarget?.name}"</strong> 템플릿을 삭제하시겠습니까?
          <br />
          <span className={styles.deleteWarning}>이 작업은 되돌릴 수 없습니다.</span>
        </p>
      </Modal>
    </div>
  );
}
