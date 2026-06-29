-- ============================================================
-- CreatorFlow — Supabase Database Schema
-- ============================================================
-- 실행 순서: 이 파일을 Supabase SQL Editor에 그대로 붙여넣으세요.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. 헬퍼: updated_at 자동 업데이트 트리거 함수
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 0-b. 헬퍼: 현재 사용자의 팀 멤버십 확인 함수
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_team_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT team_id FROM public.team_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_role(p_team_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.team_members
  WHERE team_id = p_team_id AND user_id = auth.uid()
  LIMIT 1;
$$;

-- ────────────────────────────────────────────────────────────
-- 1. teams
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 팀 멤버만 자기 팀 조회
CREATE POLICY "teams_select" ON public.teams
  FOR SELECT USING (id IN (SELECT public.get_my_team_ids()));

-- 인증된 사용자 누구나 팀 생성 가능
CREATE POLICY "teams_insert" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- admin만 팀 수정
CREATE POLICY "teams_update" ON public.teams
  FOR UPDATE USING (public.get_my_role(id) = 'admin');

-- admin만 팀 삭제
CREATE POLICY "teams_delete" ON public.teams
  FOR DELETE USING (public.get_my_role(id) = 'admin');

-- ────────────────────────────────────────────────────────────
-- 2. team_members
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.team_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 같은 팀 멤버만 조회
CREATE POLICY "team_members_select" ON public.team_members
  FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));

-- admin만 멤버 추가
CREATE POLICY "team_members_insert" ON public.team_members
  FOR INSERT WITH CHECK (
    public.get_my_role(team_id) = 'admin'
    OR auth.uid() IS NOT NULL  -- 팀 생성 시 자기 자신 추가 허용
  );

-- admin만 멤버 수정 (역할 변경 등)
CREATE POLICY "team_members_update" ON public.team_members
  FOR UPDATE USING (public.get_my_role(team_id) = 'admin');

-- admin만 멤버 제거
CREATE POLICY "team_members_delete" ON public.team_members
  FOR DELETE USING (public.get_my_role(team_id) = 'admin');

-- ────────────────────────────────────────────────────────────
-- 3. contents
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.contents (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id                  UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  status                   TEXT CHECK (status IN ('draft', 'completed', 'scheduled', 'published')) DEFAULT 'draft',
  category                 TEXT,
  tone                     TEXT,
  language                 TEXT DEFAULT 'ko',
  topic                    TEXT,
  reference_url            TEXT,
  script_narration         TEXT,
  script_subtitle          TEXT,
  script_direction         TEXT,
  titles                   JSONB DEFAULT '[]'::jsonb,
  selected_title_index     INTEGER DEFAULT 0,
  description              TEXT,
  hashtags                 JSONB DEFAULT '[]'::jsonb,
  thumbnail_urls           JSONB DEFAULT '[]'::jsonb,
  selected_thumbnail_index INTEGER DEFAULT 0,
  youtube_video_id         TEXT,
  youtube_privacy          TEXT DEFAULT 'private',
  youtube_ai_disclosure    BOOLEAN DEFAULT true,
  youtube_category         TEXT,
  scheduled_at             TIMESTAMPTZ,
  published_at             TIMESTAMPTZ,
  created_by               UUID REFERENCES auth.users(id),
  locked_by                UUID REFERENCES auth.users(id),
  locked_at                TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- 같은 팀 멤버면 조회 (viewer 이상)
CREATE POLICY "contents_select" ON public.contents
  FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));

-- admin, editor만 생성
CREATE POLICY "contents_insert" ON public.contents
  FOR INSERT WITH CHECK (
    public.get_my_role(team_id) IN ('admin', 'editor')
  );

-- admin, editor만 수정
CREATE POLICY "contents_update" ON public.contents
  FOR UPDATE USING (
    public.get_my_role(team_id) IN ('admin', 'editor')
  );

-- admin만 삭제
CREATE POLICY "contents_delete" ON public.contents
  FOR DELETE USING (public.get_my_role(team_id) = 'admin');

-- updated_at 트리거
CREATE TRIGGER contents_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ────────────────────────────────────────────────────────────
-- 4. templates
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT,
  tone            TEXT,
  language        TEXT DEFAULT 'ko',
  prompt_template TEXT,
  use_count       INTEGER DEFAULT 0,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select" ON public.templates
  FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));

CREATE POLICY "templates_insert" ON public.templates
  FOR INSERT WITH CHECK (
    public.get_my_role(team_id) IN ('admin', 'editor')
  );

CREATE POLICY "templates_update" ON public.templates
  FOR UPDATE USING (
    public.get_my_role(team_id) IN ('admin', 'editor')
  );

CREATE POLICY "templates_delete" ON public.templates
  FOR DELETE USING (public.get_my_role(team_id) = 'admin');

-- ────────────────────────────────────────────────────────────
-- 5. activity_logs
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id),
  user_name   TEXT,
  action      TEXT NOT NULL,
  target_type TEXT,
  details     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select" ON public.activity_logs
  FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));

-- admin, editor가 로그 기록 (시스템 자동 + 수동)
CREATE POLICY "activity_logs_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (
    public.get_my_role(team_id) IN ('admin', 'editor')
  );

-- 로그는 수정/삭제 불가 (불변 기록)
-- (UPDATE, DELETE 정책 없음 → 기본 거부)

-- ────────────────────────────────────────────────────────────
-- 6. api_usage
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.api_usage (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id),
  service    TEXT NOT NULL CHECK (service IN ('gemini', 'youtube', 'imagen')),
  units_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_usage_select" ON public.api_usage
  FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));

-- 인증된 사용자가 사용량 기록
CREATE POLICY "api_usage_insert" ON public.api_usage
  FOR INSERT WITH CHECK (
    team_id IN (SELECT public.get_my_team_ids())
  );

-- ────────────────────────────────────────────────────────────
-- 7. 활동 로그 자동 기록 함수
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_activity(
  p_team_id    UUID,
  p_action     TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_details    TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_name TEXT;
  v_log_id    UUID;
BEGIN
  -- 현재 사용자의 display_name 가져오기
  SELECT display_name INTO v_user_name
  FROM public.team_members
  WHERE team_id = p_team_id AND user_id = auth.uid()
  LIMIT 1;

  INSERT INTO public.activity_logs (team_id, user_id, user_name, action, target_type, details)
  VALUES (p_team_id, auth.uid(), COALESCE(v_user_name, 'Unknown'), p_action, p_target_type, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 8. contents 변경 시 자동 활동 로그 트리거
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.auto_log_content_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity(
      NEW.team_id,
      'content_created',
      'content',
      format('콘텐츠 생성: %s', COALESCE(NEW.topic, '제목 없음'))
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- 상태 변경 감지
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.log_activity(
        NEW.team_id,
        'status_changed',
        'content',
        format('상태 변경: %s → %s (%s)', OLD.status, NEW.status, COALESCE(NEW.topic, '제목 없음'))
      );
    END IF;
    -- 잠금 변경 감지
    IF OLD.locked_by IS DISTINCT FROM NEW.locked_by THEN
      IF NEW.locked_by IS NOT NULL THEN
        PERFORM public.log_activity(
          NEW.team_id,
          'content_locked',
          'content',
          format('콘텐츠 잠금: %s', COALESCE(NEW.topic, '제목 없음'))
        );
      ELSE
        PERFORM public.log_activity(
          NEW.team_id,
          'content_unlocked',
          'content',
          format('콘텐츠 잠금 해제: %s', COALESCE(NEW.topic, '제목 없음'))
        );
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity(
      OLD.team_id,
      'content_deleted',
      'content',
      format('콘텐츠 삭제: %s', COALESCE(OLD.topic, '제목 없음'))
    );
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER contents_auto_log
  AFTER INSERT OR UPDATE OR DELETE ON public.contents
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_content_changes();

-- ────────────────────────────────────────────────────────────
-- 9. 인덱스 (성능 최적화)
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_contents_team_id ON public.contents(team_id);
CREATE INDEX idx_contents_status ON public.contents(status);
CREATE INDEX idx_contents_created_at ON public.contents(created_at DESC);
CREATE INDEX idx_templates_team_id ON public.templates(team_id);
CREATE INDEX idx_activity_logs_team_id ON public.activity_logs(team_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_api_usage_team_id ON public.api_usage(team_id);
CREATE INDEX idx_api_usage_service ON public.api_usage(service);
CREATE INDEX idx_api_usage_created_at ON public.api_usage(created_at DESC);
