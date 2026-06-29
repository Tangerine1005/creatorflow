-- ============================================================
-- CreatorFlow — Supabase Schema (Part 2: 함수 + RLS + 트리거)
-- ============================================================
-- ⚠️ Part 1 실행 후에 이 파일을 실행하세요.
-- ============================================================

-- ── 헬퍼 함수들 ──

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

-- ── RLS 활성화 ──

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- ── teams 정책 ──

CREATE POLICY "teams_select" ON public.teams
  FOR SELECT USING (id IN (SELECT public.get_my_team_ids()));

CREATE POLICY "teams_insert" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "teams_update" ON public.teams
  FOR UPDATE USING (public.get_my_role(id) = 'admin');

CREATE POLICY "teams_delete" ON public.teams
  FOR DELETE USING (public.get_my_role(id) = 'admin');

-- ── team_members 정책 ──

CREATE POLICY "team_members_select" ON public.team_members
  FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));

CREATE POLICY "team_members_insert" ON public.team_members
  FOR INSERT WITH CHECK (
    public.get_my_role(team_id) = 'admin'
    OR auth.uid() IS NOT NULL
  );

CREATE POLICY "team_members_update" ON public.team_members
  FOR UPDATE USING (public.get_my_role(team_id) = 'admin');

CREATE POLICY "team_members_delete" ON public.team_members
  FOR DELETE USING (public.get_my_role(team_id) = 'admin');

-- ── contents 정책 ──

CREATE POLICY "contents_select" ON public.contents
  FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));

CREATE POLICY "contents_insert" ON public.contents
  FOR INSERT WITH CHECK (
    public.get_my_role(team_id) IN ('admin', 'editor')
  );

CREATE POLICY "contents_update" ON public.contents
  FOR UPDATE USING (
    public.get_my_role(team_id) IN ('admin', 'editor')
  );

CREATE POLICY "contents_delete" ON public.contents
  FOR DELETE USING (public.get_my_role(team_id) = 'admin');

-- ── templates 정책 ──

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

-- ── activity_logs 정책 ──

CREATE POLICY "activity_logs_select" ON public.activity_logs
  FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));

CREATE POLICY "activity_logs_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (
    public.get_my_role(team_id) IN ('admin', 'editor')
  );

-- ── api_usage 정책 ──

CREATE POLICY "api_usage_select" ON public.api_usage
  FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));

CREATE POLICY "api_usage_insert" ON public.api_usage
  FOR INSERT WITH CHECK (
    team_id IN (SELECT public.get_my_team_ids())
  );

-- ── 트리거 ──

CREATE TRIGGER contents_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 활동 로그 자동 기록 함수 ──

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

CREATE OR REPLACE FUNCTION public.auto_log_content_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity(
      NEW.team_id, 'content_created', 'content',
      format('콘텐츠 생성: %s', COALESCE(NEW.topic, '제목 없음'))
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.log_activity(
        NEW.team_id, 'status_changed', 'content',
        format('상태 변경: %s → %s (%s)', OLD.status, NEW.status, COALESCE(NEW.topic, '제목 없음'))
      );
    END IF;
    IF OLD.locked_by IS DISTINCT FROM NEW.locked_by THEN
      IF NEW.locked_by IS NOT NULL THEN
        PERFORM public.log_activity(
          NEW.team_id, 'content_locked', 'content',
          format('콘텐츠 잠금: %s', COALESCE(NEW.topic, '제목 없음'))
        );
      ELSE
        PERFORM public.log_activity(
          NEW.team_id, 'content_unlocked', 'content',
          format('콘텐츠 잠금 해제: %s', COALESCE(NEW.topic, '제목 없음'))
        );
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity(
      OLD.team_id, 'content_deleted', 'content',
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
