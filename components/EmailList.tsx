'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { EmailMessage } from '@/lib/imap/types'

export default function EmailList() {
  const router = useRouter()
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    try {
      const response = await fetch('/api/imap/list')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch emails')
      }

      setEmails(data.emails)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emails')
      if (err instanceof Error && err.message.includes('No IMAP configuration')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const handleEmailClick = (uid: string) => {
    router.push(`/extract/${uid}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading emails...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reconnect Email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Emails with Attachments</h1>
            <button
              onClick={fetchEmails}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="divide-y divide-border">
          {emails.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              No emails with attachments found
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.uid}
                onClick={() => handleEmailClick(email.uid)}
                className={cn(
                  "px-6 py-4 hover:bg-muted/50 cursor-pointer transition-colors",
                  "flex items-start gap-4"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {email.isProcessed && (
                        <span className="text-green-600 text-lg" title="Processed">✓</span>
                      )}
                      <h3 className="font-medium truncate">{email.subject}</h3>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(email.date)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{email.from}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      📎 {email.attachments.length} attachment{email.attachments.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {email.attachments.map(att => att.filename).join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}