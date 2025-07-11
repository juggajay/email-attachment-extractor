import { NextRequest, NextResponse } from 'next/server'
import { generateFileSuggestions } from '@/lib/ai/suggestions'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, sessionOptions } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit(60 * 1000, 20) // 20 requests per minute

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const allowed = await limiter(request)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
    const body = await request.json()
    const { email, attachments } = body

    if (!email || !attachments) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get session to check for user ID
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

    // Generate AI suggestions
    const suggestions = await generateFileSuggestions(
      email,
      attachments,
      session.userId
    )

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}