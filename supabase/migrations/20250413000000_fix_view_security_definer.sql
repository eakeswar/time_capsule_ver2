
-- Consolidated fix for timestamp handling without SECURITY DEFINER on views

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.pending_scheduled_files;

-- Create view without SECURITY DEFINER attribute and with explicit time zone handling
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
  -- Cast both sides to the same type for comparison
  (scheduled_date::timestamp with time zone <= now()::timestamp with time zone) AS is_due,
  now()::timestamp with time zone AS current_time
FROM 
  public.scheduled_files
WHERE 
  status = 'pending' 
  AND (scheduled_date::timestamp with time zone <= now()::timestamp with time zone);
