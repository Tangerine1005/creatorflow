// CreatorFlow — 콘텐츠 스토어 (CRUD + 자동 저장)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/helpers';
import { CONTENT_STATUS } from '../utils/constants';

const useContentStore = create(
  persist(
    (set, get) => ({
      contents: [],
      currentContent: null,
      isAutoSaving: false,
      lastSavedAt: null,

      // === CRUD ===

      // 새 콘텐츠 생성
      createContent: (data = {}) => {
        const newContent = {
          id: generateId(),
          status: CONTENT_STATUS.DRAFT,
          category: '',
          tone: '',
          language: 'ko',
          topic: '',
          referenceUrl: '',
          scriptNarration: '',
          scriptSubtitle: '',
          scriptDirection: '',
          titles: [],
          selectedTitleIndex: 0,
          description: '',
          hashtags: [],
          thumbnailUrls: [],
          selectedThumbnailIndex: 0,
          youtubeVideoId: null,
          youtubePrivacy: 'private',
          youtubeAiDisclosure: true,
          youtubeCategory: '',
          scheduledAt: null,
          publishedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: null,
          editingBy: null,
          ...data,
        };

        set((state) => ({
          contents: [newContent, ...state.contents],
          currentContent: newContent,
        }));

        return newContent;
      },

      // 콘텐츠 업데이트
      updateContent: (id, updates) => {
        const updatedData = {
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          contents: state.contents.map((c) =>
            c.id === id ? { ...c, ...updatedData } : c
          ),
          currentContent:
            state.currentContent?.id === id
              ? { ...state.currentContent, ...updatedData }
              : state.currentContent,
        }));
      },

      // 콘텐츠 삭제
      deleteContent: (id) => {
        set((state) => ({
          contents: state.contents.filter((c) => c.id !== id),
          currentContent:
            state.currentContent?.id === id ? null : state.currentContent,
        }));
      },

      // 콘텐츠 복제
      duplicateContent: (id) => {
        const original = get().contents.find((c) => c.id === id);
        if (!original) return null;

        const duplicate = {
          ...original,
          id: generateId(),
          status: CONTENT_STATUS.DRAFT,
          youtubeVideoId: null,
          publishedAt: null,
          scheduledAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          contents: [duplicate, ...state.contents],
        }));

        return duplicate;
      },

      // === 선택/현재 콘텐츠 ===

      setCurrentContent: (content) => set({ currentContent: content }),

      loadContent: (id) => {
        const content = get().contents.find((c) => c.id === id);
        if (content) {
          set({ currentContent: content });
        }
        return content;
      },

      clearCurrentContent: () => set({ currentContent: null }),

      // === 자동 저장 ===

      autoSave: () => {
        const { currentContent } = get();
        if (!currentContent) return;

        set({ isAutoSaving: true });

        // 현재 콘텐츠를 저장
        get().updateContent(currentContent.id, currentContent);

        set({
          isAutoSaving: false,
          lastSavedAt: new Date().toISOString(),
        });
      },

      // === 검색 & 필터 ===

      getContentsByStatus: (status) => {
        return get().contents.filter((c) => c.status === status);
      },

      getContentsByCategory: (category) => {
        return get().contents.filter((c) => c.category === category);
      },

      searchContents: (query) => {
        const q = query.toLowerCase();
        return get().contents.filter(
          (c) =>
            c.topic?.toLowerCase().includes(q) ||
            c.scriptNarration?.toLowerCase().includes(q) ||
            c.titles?.some((t) => t?.toLowerCase().includes(q)) ||
            c.description?.toLowerCase().includes(q)
        );
      },

      // === 통계 ===

      getContentStats: () => {
        const contents = get().contents;
        return {
          total: contents.length,
          draft: contents.filter((c) => c.status === CONTENT_STATUS.DRAFT).length,
          completed: contents.filter((c) => c.status === CONTENT_STATUS.COMPLETED).length,
          scheduled: contents.filter((c) => c.status === CONTENT_STATUS.SCHEDULED).length,
          published: contents.filter((c) => c.status === CONTENT_STATUS.PUBLISHED).length,
        };
      },

      // === 중복 체크 ===

      getExistingTopics: () => {
        return get().contents
          .map((c) => c.topic)
          .filter(Boolean);
      },

      // === 페이지네이션 ===

      getContentsPaginated: (page = 1, pageSize = 20, filters = {}) => {
        let items = [...get().contents];

        // 필터 적용
        if (filters.status) {
          items = items.filter((c) => c.status === filters.status);
        }
        if (filters.category) {
          items = items.filter((c) => c.category === filters.category);
        }
        if (filters.search) {
          const q = filters.search.toLowerCase();
          items = items.filter(
            (c) =>
              c.topic?.toLowerCase().includes(q) ||
              c.titles?.some((t) => t?.toLowerCase().includes(q))
          );
        }

        // 정렬 (최신순 기본)
        if (filters.sort === 'oldest') {
          items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else {
          items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        const totalItems = items.length;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (page - 1) * pageSize;
        const paginatedItems = items.slice(startIndex, startIndex + pageSize);

        return {
          items: paginatedItems,
          totalItems,
          totalPages,
          currentPage: page,
          pageSize,
        };
      },
    }),
    {
      name: 'creatorflow-contents',
    }
  )
);

export default useContentStore;
