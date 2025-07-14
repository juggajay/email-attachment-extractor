'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface IMAPProvider {
  provider: string
  imap_host: string
  imap_port: number
  imap_security: string
}

const commonProviders: IMAPProvider[] = [
  { provider: 'Gmail', imap_host: 'imap.gmail.com', imap_port: 993, imap_security: 'SSL' },
  { provider: 'Outlook', imap_host: 'outlook.office365.com', imap_port: 993, imap_security: 'SSL' },
  { provider: 'Yahoo', imap_host: 'imap.mail.yahoo.com', imap_port: 993, imap_security: 'SSL' },
  { provider: 'iCloud', imap_host: 'imap.mail.me.com', imap_port: 993, imap_security: 'SSL' },
  { provider: 'Custom', imap_host: '', imap_port: 993, imap_security: 'SSL' }
]

export default function IMAPSetup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    provider: 'Gmail',
    host: 'imap.gmail.com',
    port: '993',
    security: 'SSL'
  })

  useEffect(() => {
    const provider = commonProviders.find(p => p.provider === formData.provider)
    if (provider && provider.provider !== 'Custom') {
      setFormData(prev => ({
        ...prev,
        host: provider.imap_host,
        port: provider.imap_port.toString(),
        security: provider.imap_security
      }))
    }
  }, [formData.provider])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/imap/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect')
      }

      // Redirect to email list
      router.push('/emails')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="w-full max-w-6xl mx-auto relative flex flex-col lg:flex-row gap-8 items-start justify-center">
        {/* How It Works Section - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block flex-1 lg:order-2 max-w-xl">
          <div className="bg-card/50 backdrop-blur border border-border rounded-2xl p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Connect Your Email</h3>
                  <p className="text-sm text-muted-foreground">
                    Securely connect using IMAP. Your password stays in your browser - never stored.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Find Attachments</h3>
                  <p className="text-sm text-muted-foreground">
                    Instantly see all emails with attachments. Green checks show processed emails.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI Organization</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Extract Files" and AI suggests smart names & folders based on email content.
                  </p>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-mono">invoice.pdf → Invoice_12345_ABCCorp_Jan2025.pdf</p>
                    <p className="text-xs font-mono mt-1">📁 /Vendors/ABC Corp/Invoices/2025/</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Review & Download</h3>
                  <p className="text-sm text-muted-foreground">
                    Edit suggestions if needed, then download. Multiple files save as organized ZIP.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">It Learns!</h3>
                  <p className="text-sm text-muted-foreground">
                    The AI remembers your edits and improves suggestions for similar future emails.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Privacy First
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• No email content stored</li>
                <li>• Password never saved to database</li>
                <li>• Direct connection to your email</li>
                <li>• Downloads happen in your browser</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md lg:w-[450px] lg:order-1">
          <div className="bg-card border border-border rounded-2xl p-8 card-shadow-lg transition-all-300 hover:card-shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Email Attachment Extractor
            </h1>
            <p className="text-muted-foreground">
              Connect your email to start organizing attachments with AI
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={cn(
                  "w-full px-4 py-3 border border-border rounded-lg",
                  "bg-input text-foreground transition-all-300",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "hover:border-primary/50"
                )}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={cn(
                  "w-full px-4 py-3 border border-border rounded-lg",
                  "bg-input text-foreground transition-all-300",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "hover:border-primary/50"
                )}
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                For Gmail, use an app-specific password
              </p>
            </div>

            <div>
              <label htmlFor="provider" className="block text-sm font-medium mb-2">
                Email Provider
              </label>
              <select
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className={cn(
                  "w-full px-4 py-3 border border-border rounded-lg",
                  "bg-card text-foreground transition-all-300", // Changed from bg-input to bg-card
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "hover:border-primary/50",
                  "cursor-pointer"
                )}
              >
                {commonProviders.map(provider => (
                  <option key={provider.provider} value={provider.provider} className="bg-card text-foreground">
                    {provider.provider}
                  </option>
                ))}
              </select>
            </div>

            {formData.provider === 'Custom' && (
              <>
                <div>
                  <label htmlFor="host" className="block text-sm font-medium mb-2">
                    IMAP Host
                  </label>
                  <input
                    id="host"
                    type="text"
                    required
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    className={cn(
                      "w-full px-3 py-2 border border-border rounded-md",
                      "bg-input text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    )}
                    placeholder="imap.example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="port" className="block text-sm font-medium mb-2">
                      Port
                    </label>
                    <input
                      id="port"
                      type="number"
                      required
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 border border-border rounded-lg",
                        "bg-input text-foreground transition-all-300",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                        "hover:border-primary/50"
                      )}
                      placeholder="993"
                    />
                  </div>

                  <div>
                    <label htmlFor="security" className="block text-sm font-medium mb-2">
                      Security
                    </label>
                    <select
                      id="security"
                      value={formData.security}
                      onChange={(e) => setFormData({ ...formData, security: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 border border-border rounded-lg",
                        "bg-card text-foreground transition-all-300", // Changed from bg-input to bg-card
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                        "hover:border-primary/50",
                        "cursor-pointer"
                      )}
                    >
                      <option value="SSL" className="bg-card text-foreground">SSL</option>
                      <option value="TLS" className="bg-card text-foreground">TLS</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-3 px-4 rounded-lg font-semibold transition-all-300",
                "gradient-bg text-white hover:opacity-90 transform hover:scale-[1.02]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "card-shadow-md hover:card-shadow-lg"
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting...
                </span>
              ) : 'Connect to Email'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-medium mb-2">Security Note</h3>
            <p className="text-xs text-muted-foreground">
              Your password is only stored in your current session and never saved to our database.
              For Gmail users, please use an app-specific password instead of your regular password.
            </p>
          </div>
          </div>
        </div>

        {/* Mobile How It Works - Shown only on mobile */}
        <div className="lg:hidden w-full max-w-md">
          <details className="group">
            <summary className="cursor-pointer p-4 bg-card/50 backdrop-blur rounded-lg border border-border flex items-center justify-between hover:bg-card transition-all-300">
              <span className="font-medium flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How it works
              </span>
              <svg className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-2 p-4 bg-card/50 backdrop-blur rounded-lg border border-border space-y-3">
              <div className="flex items-start gap-3">
                <span className="font-bold text-primary">1.</span>
                <p className="text-sm">Connect with IMAP (password never stored)</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-primary">2.</span>
                <p className="text-sm">See all emails with attachments</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-primary">3.</span>
                <p className="text-sm">AI suggests smart names & folders</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-primary">4.</span>
                <p className="text-sm">Review, edit & download organized files</p>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}