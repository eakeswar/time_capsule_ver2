-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create scheduled_files table
CREATE TABLE IF NOT EXISTS public.scheduled_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  access_token UUID NOT NULL UNIQUE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_files_user_id ON public.scheduled_files(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_files_status ON public.scheduled_files(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_files_scheduled_date ON public.scheduled_files(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_files_access_token ON public.scheduled_files(access_token);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_files ENABLE ROW LEVEL SECURITY;

-- RLS policies: profiles
DROP POLICY IF EXISTS "Profiles: users can view own" ON public.profiles;
CREATE POLICY "Profiles: users can view own"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: users can insert own" ON public.profiles;
CREATE POLICY "Profiles: users can insert own"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: users can update own" ON public.profiles;
CREATE POLICY "Profiles: users can update own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- RLS policies: scheduled_files
DROP POLICY IF EXISTS "Scheduled files: users can view own" ON public.scheduled_files;
CREATE POLICY "Scheduled files: users can view own"
ON public.scheduled_files
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Scheduled files: users can insert own" ON public.scheduled_files;
CREATE POLICY "Scheduled files: users can insert own"
ON public.scheduled_files
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Scheduled files: users can update own" ON public.scheduled_files;
CREATE POLICY "Scheduled files: users can update own"
ON public.scheduled_files
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Scheduled files: users can delete own" ON public.scheduled_files;
CREATE POLICY "Scheduled files: users can delete own"
ON public.scheduled_files
FOR DELETE
USING (auth.uid() = user_id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_files_updated_at ON public.scheduled_files;
CREATE TRIGGER update_scheduled_files_updated_at
BEFORE UPDATE ON public.scheduled_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: schedule_file
CREATE OR REPLACE FUNCTION public.schedule_file(
  p_user_id UUID,
  p_file_name TEXT,
  p_file_size BIGINT,
  p_file_type TEXT,
  p_storage_path TEXT,
  p_recipient_email TEXT,
  p_scheduled_date TIMESTAMPTZ,
  p_access_token UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.scheduled_files (
    user_id, file_name, file_size, file_type, storage_path,
    recipient_email, scheduled_date, access_token, status
  ) VALUES (
    p_user_id, p_file_name, p_file_size, p_file_type, p_storage_path,
    p_recipient_email, p_scheduled_date, p_access_token, 'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_file(UUID, TEXT, BIGINT, TEXT, TEXT, TEXT, TIMESTAMPTZ, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.schedule_file(UUID, TEXT, BIGINT, TEXT, TEXT, TEXT, TIMESTAMPTZ, UUID) TO anon, authenticated;

-- RPC: update_scheduled_file
CREATE OR REPLACE FUNCTION public.update_scheduled_file(
  p_id UUID,
  p_recipient_email TEXT,
  p_scheduled_date TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.scheduled_files
  SET recipient_email = p_recipient_email,
      scheduled_date = p_scheduled_date
  WHERE id = p_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_scheduled_file(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_scheduled_file(UUID, TEXT, TIMESTAMPTZ) TO anon, authenticated;