import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, sessionOptions } from '@/lib/session'
import { prepareFilesForDownload, prepareSingleFile, sanitizeFilename } from '@/lib/downloads/prepare'
// import { saveUserCorrection } from '@/lib/ai/suggestions'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailUid, files } = body

    if (!emailUid || !files || files.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get session
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

    // Save extraction record if user is logged in
    if (session.userId) {
      try {
        // First, check if email account exists
        const { data: emailAccount } = await supabase
          .from('email_accounts')
          .select('id')
          .eq('user_id', session.userId)
          .eq('email', session.imapConfig?.email)
          .single()

        if (emailAccount) {
          // Create processed email record
          const { data: processedEmail } = await supabase
            .from('processed_emails')
            .insert({
              user_id: session.userId,
              email_account_id: emailAccount.id,
              email_uid: emailUid,
              subject: files[0]?.originalFilename || 'Unknown', // You might want to pass email subject
              from_address: session.imapConfig?.email
            })
            .select()
            .single()

          if (processedEmail) {
            // Save extracted files
            for (const file of files) {
              await supabase.from('extracted_files').insert({
                user_id: session.userId,
                processed_email_id: processedEmail.id,
                original_filename: file.originalFilename,
                suggested_filename: file.suggestedFilename,
                suggested_path: file.suggestedPath,
                file_size: Buffer.from(file.content, 'base64').length
              })
            }
          }
        }
      } catch (error) {
        console.error('Error saving extraction record:', error)
        // Continue with download even if saving fails
      }
    }

    let downloadBuffer: Buffer
    let filename: string
    let contentType: string

    if (files.length === 1) {
      // Single file download
      downloadBuffer = prepareSingleFile(files[0])
      filename = sanitizeFilename(files[0].suggestedFilename)
      contentType = 'application/octet-stream'
    } else {
      // Multiple files - create ZIP
      downloadBuffer = await prepareFilesForDownload(files)
      filename = `attachments_${new Date().toISOString().split('T')[0]}.zip`
      contentType = 'application/zip'
    }

    // Return the file as a response
    return new NextResponse(downloadBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': downloadBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error preparing download:', error)
    return NextResponse.json(
      { error: 'Failed to prepare download' },
      { status: 500 }
    )
  }
}