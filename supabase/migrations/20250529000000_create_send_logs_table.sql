
-- Create send_logs table to track email sending attempts
CREATE TABLE IF NOT EXISTS public.send_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.scheduled_files(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('attempt', 'success', 'error')),
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_send_logs_file_id ON public.send_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_send_logs_timestamp ON public.send_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_send_logs_status ON public.send_logs(status);

-- Enable RLS
ALTER TABLE public.send_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view logs for their own files" 
  ON public.send_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_files 
      WHERE id = send_logs.file_id 
      AND user_id = auth.uid()
    )
  );

-- Service role can manage all logs
CREATE POLICY "Service role can manage all logs" 
  ON public.send_logs 
  FOR ALL 
  USING (auth.role() = 'service_role');
