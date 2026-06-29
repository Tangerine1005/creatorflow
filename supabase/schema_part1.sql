-- ============================================================
-- CreatorFlow — Supabase Schema (Part 1: 테이블 먼저 생성)
-- ============================================================
-- ⚠️ 이 파일을 먼저 실행한 후, Part 2를 실행하세요.
-- ============================================================

-- ── 1. teams ──
CREATE TABLE public.teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 2. team_members ──
CREATE TABLE public.team_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- ── 3. contents ──
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

-- ── 4. templates ──
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

-- ── 5. activity_logs ──
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

-- ── 6. api_usage ──
CREATE TABLE public.api_usage (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id),
  service    TEXT NOT NULL CHECK (service IN ('gemini', 'youtube', 'imagen')),
  units_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 7. 인덱스 ──
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
