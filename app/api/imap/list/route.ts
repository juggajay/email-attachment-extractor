import { NextResponse } from 'next/server'
import { IMAPClient } from '@/lib/imap/client'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase/client'
import { SessionData, sessionOptions } from '@/lib/session'

export async function GET() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

    if (!session.imapConfig) {
      return NextResponse.json(
        { error: 'No IMAP configuration found. Please connect first.' },
        { status: 401 }
      )
    }

    const client = new IMAPClient(session.imapConfig)
    await client.connect()

    // Get emails with attachments
    const emails = await client.getEmailsWithAttachments(50)

    // If we have a user ID, check which emails are already processed
    if (session.userId) {
      const { data: processedEmails } = await supabase
        .from('processed_emails')
        .select('email_uid')
        .eq('user_id', session.userId)

      const processedUids = new Set(processedEmails?.map(e => e.email_uid) || [])
      
      // Mark processed emails
      emails.forEach(email => {
        email.isProcessed = processedUids.has(email.uid)
      })
    }

    await client.disconnect()

    return NextResponse.json({ emails })
  } catch (error) {
    console.error('Error fetching emails:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    )
  }
}