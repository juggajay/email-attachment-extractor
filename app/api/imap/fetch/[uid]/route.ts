import { NextRequest, NextResponse } from 'next/server'
import { IMAPClient } from '@/lib/imap/client'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, sessionOptions } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params
    
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

    if (!session.imapConfig) {
      return NextResponse.json(
        { error: 'No IMAP configuration found. Please connect first.' },
        { status: 401 }
      )
    }

    const client = new IMAPClient(session.imapConfig)
    await client.connect()

    const emailDetails = await client.getEmailDetails(uid)
    
    if (!emailDetails) {
      await client.disconnect()
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      )
    }

    // Download attachments
    const attachments = await client.downloadAttachments(uid)
    await client.disconnect()

    return NextResponse.json({
      email: emailDetails,
      attachments: attachments.map(att => ({
        filename: att.filename,
        contentType: att.contentType,
        size: att.content.length,
        content: att.content.toString('base64')
      }))
    })
  } catch (error) {
    console.error('Error fetching email:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email details' },
      { status: 500 }
    )
  }
}