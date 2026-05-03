-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS on audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only view their own audit logs
DROP POLICY IF EXISTS audit_logs_user_policy ON audit_logs;
CREATE POLICY audit_logs_user_policy ON audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create RLS policy: service role can insert audit logs
DROP POLICY IF EXISTS audit_logs_insert_policy ON audit_logs;
CREATE POLICY audit_logs_insert_policy ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Create encrypted_bucket in Storage if not exists
-- Note: This requires running via the Supabase Dashboard or API
-- INSERT into storage.buckets (id, name, public) VALUES ('encrypted_bucket', 'encrypted_bucket', false);

-- Create RLS policy for Storage bucket (users can only access their files)
-- Note: Storage RLS policies need to be set up in the Supabase Dashboard

-- Create support_feedback table
CREATE TABLE IF NOT EXISTS support_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    email TEXT NOT NULL,
    subject VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for support feedback retrieval
CREATE INDEX IF NOT EXISTS idx_support_feedback_created_at ON support_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_feedback_user_id ON support_feedback(user_id);

-- Enable RLS on support_feedback
ALTER TABLE support_feedback ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users and guests to create feedback
DROP POLICY IF EXISTS support_feedback_insert_policy ON support_feedback;
CREATE POLICY support_feedback_insert_policy ON support_feedback
    FOR INSERT
    WITH CHECK (true);

-- Allow users to view only their own feedback records
DROP POLICY IF EXISTS support_feedback_user_select_policy ON support_feedback;
CREATE POLICY support_feedback_user_select_policy ON support_feedback
    FOR SELECT
    USING (auth.uid() = user_id);
