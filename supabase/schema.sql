-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email accounts with IMAP settings
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL,
  imap_security TEXT CHECK (imap_security IN ('TLS', 'SSL')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Common IMAP settings for providers
CREATE TABLE imap_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  imap_host TEXT NOT NULL,
  imap_port INTEGER NOT NULL,
  imap_security TEXT NOT NULL
);

-- Insert common IMAP settings
INSERT INTO imap_settings (provider, imap_host, imap_port, imap_security) VALUES
  ('Gmail', 'imap.gmail.com', 993, 'SSL'),
  ('Outlook', 'outlook.office365.com', 993, 'SSL'),
  ('Yahoo', 'imap.mail.yahoo.com', 993, 'SSL'),
  ('iCloud', 'imap.mail.me.com', 993, 'SSL'),
  ('AOL', 'imap.aol.com', 993, 'SSL'),
  ('Zoho', 'imap.zoho.com', 993, 'SSL');

-- Track processed emails
CREATE TABLE processed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  email_uid TEXT NOT NULL,
  subject TEXT,
  from_address TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email_account_id, email_uid)
);

-- Extracted files metadata
CREATE TABLE extracted_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  processed_email_id UUID REFERENCES processed_emails(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  suggested_filename TEXT NOT NULL,
  suggested_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User corrections for AI learning
CREATE TABLE user_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  extracted_file_id UUID REFERENCES extracted_files(id) ON DELETE CASCADE,
  original_suggestion_filename TEXT NOT NULL,
  original_suggestion_path TEXT NOT NULL,
  corrected_filename TEXT NOT NULL,
  corrected_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Filing patterns for AI learning
CREATE TABLE filing_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_pattern TEXT,
  subject_pattern TEXT,
  folder_template TEXT NOT NULL,
  naming_template TEXT NOT NULL,
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_processed_emails_user_id ON processed_emails(user_id);
CREATE INDEX idx_processed_emails_email_account_id ON processed_emails(email_account_id);
CREATE INDEX idx_extracted_files_user_id ON extracted_files(user_id);
CREATE INDEX idx_extracted_files_processed_email_id ON extracted_files(processed_email_id);
CREATE INDEX idx_user_corrections_user_id ON user_corrections(user_id);
CREATE INDEX idx_filing_patterns_user_id ON filing_patterns(user_id);
CREATE INDEX idx_filing_patterns_sender ON filing_patterns(sender_pattern);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE filing_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own email accounts" ON email_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own processed emails" ON processed_emails
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own extracted files" ON extracted_files
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own corrections" ON user_corrections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own filing patterns" ON filing_patterns
  FOR ALL USING (auth.uid() = user_id);

-- Public read access for IMAP settings
CREATE POLICY "Anyone can read IMAP settings" ON imap_settings
  FOR SELECT USING (true);