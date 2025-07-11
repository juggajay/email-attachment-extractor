import { SessionOptions } from 'iron-session'

export interface SessionData {
  userId?: string
  imapConfig?: {
    email: string
    password: string
    host: string
    port: number
    tls: boolean
  }
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: 'email-extractor-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
}