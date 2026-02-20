
-- Fix timestamp comparison issues with explicit type handling

-- Drop and recreate schedule_file function with proper timestamp handling
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
    p_scheduled_date::timestamp with time zone,
    p_access_token,
    'pending'
  );
END;
$$;

-- Update the pending_scheduled_files view with explicit casting
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
  -- Cast both sides to timestamp to ensure proper comparison
  (scheduled_date::timestamp <= now()::timestamp) AS is_due,
  now()::timestamp AS current_time
FROM 
  public.scheduled_files
WHERE 
  status = 'pending' 
  AND (scheduled_date::timestamp <= now()::timestamp);

-- Ensure all existing scheduled_date values are properly cast to timestamp with time zone
UPDATE public.scheduled_files
SET scheduled_date = scheduled_date::timestamp with time zone
WHERE scheduled_date IS NOT NULL;
