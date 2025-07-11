import { NextRequest } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export function rateLimit(
  windowMs: number = 60 * 1000, // 1 minute
  max: number = 10
) {
  return async (request: NextRequest): Promise<boolean> => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'anonymous'
    
    const now = Date.now()
    const resetTime = now + windowMs

    if (!store[ip] || store[ip].resetTime < now) {
      store[ip] = { count: 1, resetTime }
      return true
    }

    if (store[ip].count >= max) {
      return false
    }

    store[ip].count++
    return true
  }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 60 * 1000) // Clean up every minute