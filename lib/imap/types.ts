export interface IMAPConfig {
  email: string
  password: string
  host: string
  port: number
  tls: boolean
}

export interface EmailAttachment {
  filename: string
  size: number
  contentType: string
  contentId?: string
}

export interface EmailMessage {
  uid: string
  messageId: string
  subject: string
  from: string
  date: Date
  hasAttachments: boolean
  attachments: EmailAttachment[]
  body?: string
  isProcessed?: boolean
}