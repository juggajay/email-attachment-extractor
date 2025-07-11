export interface User {
  id: string
  email: string
  created_at: string
}

export interface EmailAccount {
  id: string
  user_id: string
  email: string
  imap_host: string
  imap_port: number
  imap_security: 'TLS' | 'SSL'
  created_at: string
}

export interface IMAPSettings {
  id: string
  provider: string
  imap_host: string
  imap_port: number
  imap_security: string
}

export interface ProcessedEmail {
  id: string
  user_id: string
  email_account_id: string
  email_uid: string
  subject: string | null
  from_address: string | null
  processed_at: string
}

export interface ExtractedFile {
  id: string
  user_id: string
  processed_email_id: string
  original_filename: string
  suggested_filename: string
  suggested_path: string
  file_size: number | null
  mime_type: string | null
  extracted_at: string
}

export interface UserCorrection {
  id: string
  user_id: string
  extracted_file_id: string
  original_suggestion_filename: string
  original_suggestion_path: string
  corrected_filename: string
  corrected_path: string
  created_at: string
}

export interface FilingPattern {
  id: string
  user_id: string
  sender_pattern: string | null
  subject_pattern: string | null
  folder_template: string
  naming_template: string
  usage_count: number
  last_used: string
  created_at: string
}