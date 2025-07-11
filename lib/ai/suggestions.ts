import OpenAI from 'openai'
import { supabase } from '@/lib/supabase/client'
import { FilingPattern } from '@/types/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

interface EmailContext {
  subject: string
  from: string
  body?: string
  date: string
}

interface AttachmentInfo {
  filename: string
  contentType: string
  size: number
}

interface FileSuggestion {
  originalFilename: string
  suggestedFilename: string
  suggestedPath: string
  confidence: number
}

export async function generateFileSuggestions(
  email: EmailContext,
  attachments: AttachmentInfo[],
  userId?: string
): Promise<FileSuggestion[]> {
  // First, try to find existing patterns from the user
  let existingPatterns: FilingPattern[] = []
  
  if (userId) {
    const { data: patterns } = await supabase
      .from('filing_patterns')
      .select('*')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false })
      .limit(10)

    existingPatterns = patterns || []
  }

  // Extract sender domain and company name
  const senderEmail = email.from.match(/<(.+?)>/)?.[1] || email.from
  const senderDomain = senderEmail.split('@')[1] || ''
  const senderName = email.from.split('<')[0].trim()

  // Create the prompt for OpenAI
  const systemPrompt = `You are an intelligent file organization assistant. Your task is to suggest organized file names and folder structures for email attachments.

Guidelines:
1. Analyze the email content and attachment names to understand the context
2. Suggest descriptive, searchable filenames that include relevant dates, companies, document types
3. Create a logical folder hierarchy (e.g., /Projects/ClientName/DocumentType/Year/)
4. Use consistent naming conventions: PascalCase for folders, snake_case or hyphenated for files
5. Include dates in ISO format (YYYY-MM-DD) when relevant
6. Remove special characters that might cause filesystem issues

${existingPatterns.length > 0 ? `
User's Previous Filing Patterns:
${existingPatterns.map(p => `- Files from ${p.sender_pattern || 'various'} with subject containing "${p.subject_pattern || 'any'}" go to ${p.folder_template} with naming ${p.naming_template}`).join('\n')}
` : ''}

Return a JSON array with suggestions for each attachment.`

  const userPrompt = `Email Details:
From: ${email.from}
Subject: ${email.subject}
Date: ${new Date(email.date).toISOString().split('T')[0]}
Body Preview: ${email.body?.substring(0, 500) || 'No body'}

Attachments:
${attachments.map((att, i) => `${i + 1}. ${att.filename} (${att.contentType})`).join('\n')}

For each attachment, suggest:
- suggestedFilename: A descriptive filename
- suggestedPath: The folder path where it should be saved
- confidence: A score from 0 to 1 indicating confidence in the suggestion`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const response = JSON.parse(completion.choices[0].message.content || '{}')
    const suggestions = response.suggestions || []

    // Map the suggestions to our format
    return attachments.map((att, index) => {
      const suggestion = suggestions[index] || {}
      
      return {
        originalFilename: att.filename,
        suggestedFilename: suggestion.suggestedFilename || att.filename,
        suggestedPath: suggestion.suggestedPath || `/Downloads/${new Date(email.date).getFullYear()}/`,
        confidence: suggestion.confidence || 0.5
      }
    })
  } catch (error) {
    console.error('Error generating AI suggestions:', error)
    
    // Fallback suggestions
    return attachments.map(att => ({
      originalFilename: att.filename,
      suggestedFilename: att.filename,
      suggestedPath: `/Downloads/${new Date(email.date).getFullYear()}/`,
      confidence: 0.3
    }))
  }
}

export async function saveUserCorrection(
  userId: string,
  originalSuggestion: FileSuggestion,
  correctedSuggestion: FileSuggestion,
  email: EmailContext
) {
  try {
    // Save the correction
    await supabase.from('user_corrections').insert({
      user_id: userId,
      original_suggestion_filename: originalSuggestion.suggestedFilename,
      original_suggestion_path: originalSuggestion.suggestedPath,
      corrected_filename: correctedSuggestion.suggestedFilename,
      corrected_path: correctedSuggestion.suggestedPath
    })

    // Extract patterns from the correction
    const senderDomain = email.from.match(/@([^>]+)/)?.[1] || ''
    const subjectKeywords = email.subject.toLowerCase().match(/invoice|receipt|contract|report|statement/)?.[0]

    // Check if we should create or update a filing pattern
    const { data: existingPattern } = await supabase
      .from('filing_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('sender_pattern', senderDomain)
      .eq('subject_pattern', subjectKeywords || '')
      .single()

    if (existingPattern) {
      // Update usage count
      await supabase
        .from('filing_patterns')
        .update({
          usage_count: existingPattern.usage_count + 1,
          last_used: new Date().toISOString()
        })
        .eq('id', existingPattern.id)
    } else if (senderDomain) {
      // Create new pattern
      await supabase.from('filing_patterns').insert({
        user_id: userId,
        sender_pattern: senderDomain,
        subject_pattern: subjectKeywords,
        folder_template: correctedSuggestion.suggestedPath,
        naming_template: extractNamingPattern(correctedSuggestion.suggestedFilename, originalSuggestion.originalFilename)
      })
    }
  } catch (error) {
    console.error('Error saving user correction:', error)
  }
}

function extractNamingPattern(suggestedName: string, originalName: string): string {
  // Simple pattern extraction - could be made more sophisticated
  if (suggestedName.includes(new Date().getFullYear().toString())) {
    return '{type}_{identifier}_{date}'
  }
  if (suggestedName !== originalName) {
    return '{type}_{identifier}'
  }
  return '{original}'
}