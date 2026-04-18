-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  file_size_bytes BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- RLS Policy: Users can only view their own audit logs
CREATE POLICY "Users can view own logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own logs
CREATE POLICY "Users can insert own logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- Create encrypted-files storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('encrypted-files', 'encrypted-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can upload to their folder
CREATE POLICY "Users can upload encrypted files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'encrypted-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy: Users can download their files
CREATE POLICY "Users can download their files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'encrypted-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy: Users can delete their files
CREATE POLICY "Users can delete their files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'encrypted-files' AND auth.uid()::text = (storage.foldername(name))[1]);
