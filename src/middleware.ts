import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

const ADMIN_ROUTES = ['/dashboard/procedures', '/dashboard/settings']

/**
 * Extract client IP from multiple headers with fallback.
 * Prefers x-real-ip (Vercel/Cloudflare) over x-forwarded-for to avoid spoofing.
 */
function getClientIP(request: NextRequest): string {
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Use the last IP in the chain (closest to the server) to prevent spoofing
    const ips = forwarded.split(',').map((s) => s.trim()).filter(Boolean)
    return ips[ips.length - 1] ?? 'unknown'
  }
  return 'unknown'
}

/**
 * In-memory rate limiter. Works for single-instance deployments.
 * For serverless/edge, replace with Redis or Upstash in production.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, limit = 30, windowMs = 10000): boolean {
  const now = Date.now()
  // Clean up expired entries probabilistically
  if (Math.random() < 0.01) {
    for (const [k, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(k)
    }
  }
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limiting para rutas API (por IP y por sesión si está disponible)
  if (pathname.startsWith('/api/')) {
    const ip = getClientIP(request)
    // Stricter limit for unauthenticated requests; session-based relaxed limit added in route handlers
    if (!checkRateLimit(ip, 30, 10000)) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    }
  }

  const response = await updateSession(request)

  // Protección de rutas admin-only — reuse the session from updateSession when possible
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))

  if (isAdminRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const url = new URL('/login', request.url)
      return NextResponse.redirect(url, { headers: response.headers })
    }

    if (user.app_metadata?.role !== 'admin') {
      const url = new URL('/dashboard', request.url)
      return NextResponse.redirect(url, { headers: response.headers })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\.ico|favicon\.png|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

