/* ============================================
   DB 서비스
   Supabase DB CRUD (contents, templates, teams, activity_logs)
   개발 모드에서는 Mock 데이터 반환
   ============================================ */

import { supabase } from './supabase';
import { mockContents, mockTemplates, mockTeamMembers, mockActivityLogs } from '../mocks/mockData';

function isConnected() {
  return supabase !== null;
}

/* ── Contents CRUD ── */

export const contentService = {
  async list(teamId, { status, category, sort, search, page = 1, limit = 10 } = {}) {
    if (!isConnected()) {
      let data = [...mockContents];
      if (status) data = data.filter(c => c.status === status);
      if (category) data = data.filter(c => c.category === category);
      if (search) data = data.filter(c => c.topic?.toLowerCase().includes(search.toLowerCase()));
      return { data, count: data.length, error: null };
    }

    let query = supabase.from('contents').select('*', { count: 'exact' }).eq('team_id', teamId);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('topic', `%${search}%`);

    // 정렬
    if (sort === 'name') query = query.order('topic', { ascending: true });
    else if (sort === 'status') query = query.order('status', { ascending: true });
    else query = query.order('created_at', { ascending: false });

    // 페이지네이션
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, count, error } = await query;
    return { data, count, error };
  },

  async getById(id) {
    if (!isConnected()) {
      return { data: mockContents.find(c => c.id === id) || null, error: null };
    }

    const { data, error } = await supabase.from('contents').select('*').eq('id', id).single();
    return { data, error };
  },

  async create(content) {
    if (!isConnected()) {
      return { data: { id: `mock-${Date.now()}`, ...content }, error: null };
    }

    const { data, error } = await supabase.from('contents').insert(content).select().single();
    return { data, error };
  },

  async update(id, updates) {
    if (!isConnected()) {
      return { data: { id, ...updates }, error: null };
    }

    const { data, error } = await supabase.from('contents').update(updates).eq('id', id).select().single();
    return { data, error };
  },

  async delete(id) {
    if (!isConnected()) {
      return { error: null };
    }

    const { error } = await supabase.from('contents').delete().eq('id', id);
    return { error };
  },
};

/* ── Templates CRUD ── */

export const templateService = {
  async list(teamId) {
    if (!isConnected()) {
      return { data: [...mockTemplates], error: null };
    }

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async create(template) {
    if (!isConnected()) {
      return { data: { id: `mock-${Date.now()}`, ...template }, error: null };
    }

    const { data, error } = await supabase.from('templates').insert(template).select().single();
    return { data, error };
  },

  async update(id, updates) {
    if (!isConnected()) {
      return { data: { id, ...updates }, error: null };
    }

    const { data, error } = await supabase.from('templates').update(updates).eq('id', id).select().single();
    return { data, error };
  },

  async delete(id) {
    if (!isConnected()) return { error: null };

    const { error } = await supabase.from('templates').delete().eq('id', id);
    return { error };
  },

  async incrementUseCount(id) {
    if (!isConnected()) return { error: null };

    const { error } = await supabase.rpc('increment_template_use_count', { template_id: id });
    return { error };
  },
};

/* ── Team 서비스 ── */

export const teamService = {
  async getMembers(teamId) {
    if (!isConnected()) {
      return { data: [...mockTeamMembers], error: null };
    }

    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    return { data, error };
  },

  async updateMemberRole(memberId, role) {
    if (!isConnected()) return { error: null };

    const { error } = await supabase.from('team_members').update({ role }).eq('id', memberId);
    return { error };
  },

  async removeMember(memberId) {
    if (!isConnected()) return { error: null };

    const { error } = await supabase.from('team_members').delete().eq('id', memberId);
    return { error };
  },

  async getActivityLogs(teamId, limit = 20) {
    if (!isConnected()) {
      return { data: [...mockActivityLogs].slice(0, limit), error: null };
    }

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },
};

export default { content: contentService, template: templateService, team: teamService };
