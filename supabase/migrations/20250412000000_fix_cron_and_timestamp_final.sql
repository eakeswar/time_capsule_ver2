
-- Final fix for timestamp handling in scheduled_files table and views

-- Ensure the scheduled_date column is properly typed
ALTER TABLE public.scheduled_files 
ALTER COLUMN scheduled_date TYPE timestamp with time zone USING scheduled_date::timestamp with time zone;

-- Update the view to use explicit type casting
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
  -- Use explicit casting and OPERATOR syntax for timestamp comparison
  (scheduled_date::timestamp with time zone <= now()::timestamp with time zone) AS is_due,
  now()::timestamp with time zone AS current_time
FROM 
  public.scheduled_files
WHERE 
  status = 'pending' 
  AND (scheduled_date::timestamp with time zone <= now()::timestamp with time zone);
