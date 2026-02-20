
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create scheduled_files table
CREATE TABLE public.scheduled_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  access_token TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own files" ON public.scheduled_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own files" ON public.scheduled_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own files" ON public.scheduled_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own files" ON public.scheduled_files FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Access files by token" ON public.scheduled_files FOR SELECT USING (access_token IS NOT NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_files;

-- Create RPC: schedule_file
CREATE OR REPLACE FUNCTION public.schedule_file(
  p_user_id UUID,
  p_file_name TEXT,
  p_file_size BIGINT,
  p_file_type TEXT,
  p_storage_path TEXT,
  p_recipient_email TEXT,
  p_scheduled_date TEXT,
  p_access_token TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO public.scheduled_files (user_id, file_name, file_size, file_type, storage_path, recipient_email, scheduled_date, access_token)
  VALUES (p_user_id, p_file_name, p_file_size, p_file_type, p_storage_path, p_recipient_email, p_scheduled_date::timestamptz, p_access_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create RPC: update_scheduled_file
CREATE OR REPLACE FUNCTION public.update_scheduled_file(
  p_id UUID,
  p_recipient_email TEXT,
  p_scheduled_date TEXT
) RETURNS void AS $$
BEGIN
  UPDATE public.scheduled_files
  SET recipient_email = p_recipient_email,
      scheduled_date = p_scheduled_date::timestamptz,
      updated_at = now()
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scheduled_files_updated_at BEFORE UPDATE ON public.scheduled_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('timecapsule', 'timecapsule', false);

CREATE POLICY "Users can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'timecapsule' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their files" ON storage.objects FOR SELECT USING (bucket_id = 'timecapsule' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their files" ON storage.objects FOR DELETE USING (bucket_id = 'timecapsule' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for auto profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'user'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
