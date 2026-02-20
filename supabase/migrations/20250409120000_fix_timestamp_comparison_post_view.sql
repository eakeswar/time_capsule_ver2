
-- Create a better view for pending scheduled files with debug information
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
  (scheduled_date <= (now() AT TIME ZONE 'UTC')) AS is_due,
  (now() AT TIME ZONE 'UTC') AS current_time
FROM 
  public.scheduled_files
WHERE 
  status = 'pending' 
  AND scheduled_date <= (now() AT TIME ZONE 'UTC');
