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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-primary mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-muted-foreground font-medium">Loading emails...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center bg-card p-8 rounded-2xl card-shadow-md max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-destructive font-medium mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 gradient-bg text-white rounded-lg hover:opacity-90 transition-all-300 font-medium"
          >
            Reconnect Email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-card rounded-2xl card-shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Emails with Attachments</h1>
                <p className="text-white/80 text-sm mt-1">
                  {emails.length} email{emails.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <button
                onClick={fetchEmails}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-all-300 backdrop-blur"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-2">
            {emails.length === 0 ? (
              <div className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-muted-foreground font-medium">No emails with attachments found</p>
                <p className="text-sm text-muted-foreground mt-1">Refresh to check for new emails</p>
              </div>
            ) : (
            emails.map((email) => (
              <div
                key={email.uid}
                onClick={() => handleEmailClick(email.uid)}
                className={cn(
                  "mx-2 my-2 p-4 rounded-lg cursor-pointer transition-all-300",
                  "bg-card border border-border hover:border-primary/50",
                  "hover:card-shadow-md hover:scale-[1.01] transform",
                  "flex items-start gap-4"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {email.isProcessed && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/20 text-success" title="Processed">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      <h3 className="font-medium truncate">{email.subject}</h3>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(email.date)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{email.from}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {email.attachments.length} file{email.attachments.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
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
    </div>
  )
}