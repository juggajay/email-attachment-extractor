'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { EmailMessage } from '@/lib/imap/types'
import ExtractionDialog from './ExtractionDialog'

interface EmailDetailProps {
  uid: string
}

interface AttachmentData {
  filename: string
  contentType: string
  size: number
  content: string
}

export default function EmailDetail({ uid }: EmailDetailProps) {
  const router = useRouter()
  const [email, setEmail] = useState<EmailMessage | null>(null)
  const [attachments, setAttachments] = useState<AttachmentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showExtraction, setShowExtraction] = useState(false)

  useEffect(() => {
    fetchEmailDetails()
  }, [uid])

  const fetchEmailDetails = async () => {
    try {
      const response = await fetch(`/api/imap/fetch/${uid}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch email')
      }

      setEmail(data.email)
      setAttachments(data.attachments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email')
      if (err instanceof Error && err.message.includes('No IMAP configuration')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading email...</div>
      </div>
    )
  }

  if (error || !email) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Email not found'}</p>
          <button
            onClick={() => router.push('/emails')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Emails
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="border-b border-border px-6 py-4">
            <button
              onClick={() => router.push('/emails')}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
            >
              ← Back to emails
            </button>
            <h1 className="text-xl font-semibold">{email.subject}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>From: {email.from}</span>
              <span>•</span>
              <span>{new Date(email.date).toLocaleString()}</span>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-border">
            {email.body && (
              <div className="prose prose-sm max-w-none text-foreground">
                <pre className="whitespace-pre-wrap font-sans">{email.body}</pre>
              </div>
            )}
          </div>

          <div className="px-6 py-4">
            <h2 className="text-lg font-medium mb-4">
              Attachments ({attachments.length})
            </h2>
            
            <div className="space-y-2 mb-6">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📎</span>
                    <div>
                      <p className="font-medium">{attachment.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {attachment.contentType} • {formatFileSize(attachment.size)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowExtraction(true)}
              className={cn(
                "w-full py-3 px-4 rounded-md font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              )}
            >
              Extract Files
            </button>
          </div>
        </div>
      </div>

      {showExtraction && (
        <ExtractionDialog
          email={email}
          attachments={attachments}
          onClose={() => setShowExtraction(false)}
        />
      )}
    </>
  )
}