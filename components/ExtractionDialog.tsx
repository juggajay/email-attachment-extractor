'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { EmailMessage } from '@/lib/imap/types'

interface AttachmentData {
  filename: string
  contentType: string
  size: number
  content: string
}

interface FileSuggestion {
  originalFilename: string
  suggestedFilename: string
  suggestedPath: string
  confidence: number
}

interface ExtractionDialogProps {
  email: EmailMessage
  attachments: AttachmentData[]
  onClose: () => void
}

export default function ExtractionDialog({ email, attachments, onClose }: ExtractionDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<FileSuggestion[]>([])
  const [editedSuggestions, setEditedSuggestions] = useState<FileSuggestion[]>([])
  const [error, setError] = useState('')

  useState(() => {
    fetchSuggestions()
  })

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/extract/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: {
            subject: email.subject,
            from: email.from,
            body: email.body,
            date: email.date
          },
          attachments: attachments.map(att => ({
            filename: att.filename,
            contentType: att.contentType,
            size: att.size
          }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions')
      }

      setSuggestions(data.suggestions)
      setEditedSuggestions(data.suggestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions')
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionEdit = (index: number, field: 'suggestedFilename' | 'suggestedPath', value: string) => {
    const updated = [...editedSuggestions]
    updated[index] = { ...updated[index], [field]: value }
    setEditedSuggestions(updated)
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/extract/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailUid: email.uid,
          files: editedSuggestions.map((suggestion, index) => ({
            originalFilename: suggestion.originalFilename,
            suggestedFilename: suggestion.suggestedFilename,
            suggestedPath: suggestion.suggestedPath,
            content: attachments[index].content
          }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to prepare download')
      }

      // The response is the file itself, create a blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = editedSuggestions.length === 1 
        ? editedSuggestions[0].suggestedFilename 
        : `attachments_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Mark email as processed
      router.push('/emails')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download files')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">AI File Organization Suggestions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and edit the suggested names and locations for your files
          </p>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {loading && !suggestions.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Analyzing email and generating suggestions...
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={fetchSuggestions}
                className="text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {editedSuggestions.map((suggestion, index) => (
                <div key={index} className="border border-border rounded-md p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Original:</p>
                      <p className="font-medium">{suggestion.originalFilename}</p>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      suggestion.confidence > 0.8 ? "bg-green-100 text-green-700" :
                      suggestion.confidence > 0.6 ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      {Math.round(suggestion.confidence * 100)}% confident
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Save as:</label>
                      <input
                        type="text"
                        value={suggestion.suggestedFilename}
                        onChange={(e) => handleSuggestionEdit(index, 'suggestedFilename', e.target.value)}
                        className={cn(
                          "w-full px-3 py-2 border border-border rounded-md",
                          "bg-input text-foreground",
                          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Location:</label>
                      <input
                        type="text"
                        value={suggestion.suggestedPath}
                        onChange={(e) => handleSuggestionEdit(index, 'suggestedPath', e.target.value)}
                        className={cn(
                          "w-full px-3 py-2 border border-border rounded-md",
                          "bg-input text-foreground",
                          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md",
              "border border-border hover:bg-muted/50",
              "transition-colors"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !suggestions.length}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            {loading ? 'Processing...' : 'Confirm & Download'}
          </button>
        </div>
      </div>
    </div>
  )
}