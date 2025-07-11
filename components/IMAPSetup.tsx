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
      <div className="w-full max-w-md">
        <div className="bg-background border border-border rounded-lg p-8 shadow-sm">
          <h1 className="text-2xl font-semibold mb-2">Connect Your Email</h1>
          <p className="text-muted-foreground mb-6">
            Enter your email credentials to start extracting attachments
          </p>

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
                  "w-full px-3 py-2 border border-border rounded-md",
                  "bg-input text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
                  "w-full px-3 py-2 border border-border rounded-md",
                  "bg-input text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
                  "w-full px-3 py-2 border border-border rounded-md",
                  "bg-input text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                )}
              >
                {commonProviders.map(provider => (
                  <option key={provider.provider} value={provider.provider}>
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
                        "w-full px-3 py-2 border border-border rounded-md",
                        "bg-input text-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
                        "w-full px-3 py-2 border border-border rounded-md",
                        "bg-input text-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      )}
                    >
                      <option value="SSL">SSL</option>
                      <option value="TLS">TLS</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-2 px-4 rounded-md font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              )}
            >
              {loading ? 'Connecting...' : 'Connect'}
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
    </div>
  )
}