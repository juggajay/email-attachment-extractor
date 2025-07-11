import { NextRequest, NextResponse } from 'next/server'
import { IMAPClient } from '@/lib/imap/client'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, sessionOptions } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, host, port, security } = body

    if (!email || !password || !host || !port || !security) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const imapConfig = {
      email,
      password,
      host,
      port: parseInt(port),
      tls: security === 'SSL' || security === 'TLS'
    }

    // Test the connection
    const client = new IMAPClient(imapConfig)
    const isConnected = await client.testConnection()

    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to IMAP server. Please check your credentials and settings.' },
        { status: 400 }
      )
    }

    // Store config in session
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

    session.imapConfig = imapConfig
    await session.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('IMAP connection error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to email server' },
      { status: 500 }
    )
  }
}