
-- Fix timestamp comparison issues with explicit casting

-- Recreate schedule_file function with proper timestamp formatting
CREATE OR REPLACE FUNCTION public.schedule_file(
  p_user_id UUID,
  p_file_name TEXT,
  p_file_size INTEGER,
  p_file_type TEXT,
  p_storage_path TEXT,
  p_recipient_email TEXT,
  p_scheduled_date TEXT,
  p_access_token UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.scheduled_files (
    user_id,
    file_name,
    file_size,
    file_type,
    storage_path,
    recipient_email,
    scheduled_date,
    access_token,
    status
  )
  VALUES (
    p_user_id,
    p_file_name,
    p_file_size,
    p_file_type,
    p_storage_path,
    p_recipient_email,
    -- Cast as timestamp without time zone first
    p_scheduled_date::timestamp,
    p_access_token,
    'pending'
  );
END;
$$;

-- Recreate update_scheduled_file function with proper timestamp formatting
CREATE OR REPLACE FUNCTION public.update_scheduled_file(
  p_id UUID,
  p_recipient_email TEXT,
  p_scheduled_date TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.scheduled_files
  SET 
    recipient_email = p_recipient_email,
    -- Cast as timestamp without time zone first
    scheduled_date = p_scheduled_date::timestamp,
    updated_at = NOW()
  WHERE id = p_id;
END;
$$;

-- Update the view with consistent timestamp formatting
DROP VIEW IF EXISTS public.pending_scheduled_files;

CREATE VIEW public.pending_scheduled_files AS
SELECT 
  id,
  user_id,
  file_name,
  file_size,
  file_type,
  storage_path,
  recipient_email,
  scheduled_date,
  access_token,
  status,
  created_at,
  updated_at,
  sent_at,
  error_message,
  email_id,
  -- Use simplified timestamp comparison without time zone
  (scheduled_date::timestamp <= now()::timestamp) AS is_due,
  now()::timestamp AS current_time
FROM 
  public.scheduled_files
WHERE 
  status = 'pending' 
  AND (scheduled_date::timestamp <= now()::timestamp);
