// CreatorFlow — 크레딧 스토어 (이미지 한도 + YouTube 할당량)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CREDITS, YOUTUBE } from '../utils/constants';

const useCreditStore = create(
  persist(
    (set, get) => ({
      // === AI 이미지 크레딧 ===
      imageCredits: {
        used: 0,
        limit: CREDITS.DEFAULT_DAILY_IMAGE_LIMIT,
        lastReset: new Date().toDateString(),
      },

      // 이미지 크레딧 사용
      useImageCredits: (count = 1) => {
        const state = get();
        const credits = { ...state.imageCredits };

        // 날짜가 바뀌었으면 리셋
        const today = new Date().toDateString();
        if (credits.lastReset !== today) {
          credits.used = 0;
          credits.lastReset = today;
        }

        credits.used += count;
        set({ imageCredits: credits });

        return {
          used: credits.used,
          remaining: Math.max(0, credits.limit - credits.used),
          limit: credits.limit,
          isOverLimit: credits.used >= credits.limit,
        };
      },

      // 이미지 크레딧 상태 조회
      getImageCreditStatus: () => {
        const credits = { ...get().imageCredits };

        // 날짜가 바뀌었으면 리셋
        const today = new Date().toDateString();
        if (credits.lastReset !== today) {
          credits.used = 0;
          credits.lastReset = today;
          set({ imageCredits: credits });
        }

        const remaining = Math.max(0, credits.limit - credits.used);
        let level = 'normal'; // normal, warning, danger, exhausted
        if (remaining <= 0) level = 'exhausted';
        else if (remaining <= CREDITS.DANGER_THRESHOLD) level = 'danger';
        else if (remaining <= CREDITS.WARNING_THRESHOLD) level = 'warning';

        return {
          used: credits.used,
          remaining,
          limit: credits.limit,
          level,
          percentage: Math.round((credits.used / credits.limit) * 100),
        };
      },

      // 이미지 한도 변경
      setImageLimit: (limit) => {
        set({
          imageCredits: { ...get().imageCredits, limit },
        });
      },

      // === YouTube API 할당량 ===
      youtubeQuota: {
        used: 0,
        limit: YOUTUBE.DAILY_QUOTA_UNITS,
        lastReset: new Date().toDateString(),
        lastSyncAt: null,
      },

      // YouTube 할당량 사용
      useYoutubeQuota: (units) => {
        const state = get();
        const quota = { ...state.youtubeQuota };

        const today = new Date().toDateString();
        if (quota.lastReset !== today) {
          quota.used = 0;
          quota.lastReset = today;
        }

        quota.used += units;
        set({ youtubeQuota: quota });

        return {
          used: quota.used,
          remaining: Math.max(0, quota.limit - quota.used),
          limit: quota.limit,
        };
      },

      // YouTube 할당량 상태 조회
      getYoutubeQuotaStatus: () => {
        const quota = { ...get().youtubeQuota };

        const today = new Date().toDateString();
        if (quota.lastReset !== today) {
          quota.used = 0;
          quota.lastReset = today;
          set({ youtubeQuota: quota });
        }

        const remaining = Math.max(0, quota.limit - quota.used);
        const percentage = Math.round((quota.used / quota.limit) * 100);
        let level = 'normal';
        if (percentage >= 100) level = 'exhausted';
        else if (percentage >= 80) level = 'danger';
        else if (percentage >= 50) level = 'warning';

        return {
          used: quota.used,
          remaining,
          limit: quota.limit,
          level,
          percentage,
          lastSyncAt: quota.lastSyncAt,
        };
      },

      // YouTube 동기화 시간 업데이트
      setLastSyncAt: (time) => {
        set({
          youtubeQuota: { ...get().youtubeQuota, lastSyncAt: time },
        });
      },

      // 리셋 시간까지 남은 시간 (밀리초)
      getTimeUntilReset: () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow - now;
      },
    }),
    {
      name: 'creatorflow-credits',
    }
  )
);

export default useCreditStore;
