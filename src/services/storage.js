/* ============================================
   Storage 서비스
   Supabase Storage (썸네일 업로드/다운로드)
   개발 모드에서는 Data URL 반환
   ============================================ */

import { supabase } from './supabase';

const BUCKET_NAME = 'thumbnails';

function isConnected() {
  return supabase !== null;
}

const storageService = {
  /**
   * 썸네일 업로드
   * @param {File} file - 이미지 파일
   * @param {string} contentId - 콘텐츠 ID
   * @returns {{ url: string, error: Error|null }}
   */
  async uploadThumbnail(file, contentId) {
    if (!isConnected()) {
      // Mock: Data URL 반환
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ url: e.target.result, path: `mock/${file.name}`, error: null });
        reader.readAsDataURL(file);
      });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${contentId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) return { url: null, path: null, error: uploadError };

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    return { url: data.publicUrl, path: fileName, error: null };
  },

  /**
   * 썸네일 삭제
   */
  async deleteThumbnail(path) {
    if (!isConnected()) return { error: null };

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    return { error };
  },

  /**
   * 썸네일 공개 URL 가져오기
   */
  getPublicUrl(path) {
    if (!isConnected()) return path;

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  },
};

export default storageService;
