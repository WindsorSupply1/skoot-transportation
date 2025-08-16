import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMITS = {
  auth: { requests: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 minutes for auth
  api: { requests: 100, window: 60 * 1000 }, // 100 requests per minute for API
  booking: { requests: 10, window: 60 * 1000 }, // 10 bookings per minute
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

// Rate limiting function
export function rateLimit(identifier: string, type: keyof typeof RATE_LIMITS): RateLimitResult {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    const newData = {
      count: 1,
      resetTime: now + config.window,
    };
    rateLimitStore.set(key, newData);
    
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - 1,
      resetTime: newData.resetTime,
    };
  }
  
  if (current.count >= config.requests) {
    return {
      success: false,
      limit: config.requests,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }
  
  current.count++;
  rateLimitStore.set(key, current);
  
  return {
    success: true,
    limit: config.requests,
    remaining: config.requests - current.count,
    resetTime: current.resetTime,
  };
}

// Get client IP address
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const cfConnecting = request.headers.get('cf-connecting-ip');
  
  if (cfConnecting) return cfConnecting;
  if (real) return real;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return '127.0.0.1';
}

// Validate request origin
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  if (!origin) {
    // Same-origin requests might not have origin header
    return true;
  }
  
  const allowedOrigins = [
    `http://${host}`,
    `https://${host}`,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean);
  
  return allowedOrigins.some(allowed => origin.startsWith(allowed!));
}

// Security headers
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // HTTPS enforcement (in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.stripe.com https://accounts.google.com https://api.amazon.com; " +
    "frame-src https://js.stripe.com https://accounts.google.com;"
  );
  
  return response;
}

// API route security wrapper
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    rateLimit?: keyof typeof RATE_LIMITS;
    validateOrigin?: boolean;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Validate origin for state-changing requests
      if (options.validateOrigin && request.method !== 'GET' && !validateOrigin(request)) {
        return new NextResponse(JSON.stringify({ error: 'Invalid origin' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Rate limiting
      if (options.rateLimit) {
        const clientIP = getClientIP(request);
        const rateLimitResult = rateLimit(clientIP, options.rateLimit);
        
        if (!rateLimitResult.success) {
          const response = new NextResponse(
            JSON.stringify({ 
              error: 'Rate limit exceeded',
              retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
                'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
              },
            }
          );
          return addSecurityHeaders(response);
        }
      }
      
      // Authentication check
      if (options.requireAuth || options.requireAdmin) {
        const token = await getToken({ 
          req: request,
          secret: process.env.NEXTAUTH_SECRET 
        });
        
        if (!token) {
          const response = new NextResponse(
            JSON.stringify({ error: 'Authentication required' }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            }
          );
          return addSecurityHeaders(response);
        }
        
        if (options.requireAdmin && !token.isAdmin) {
          const response = new NextResponse(
            JSON.stringify({ error: 'Admin access required' }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
          return addSecurityHeaders(response);
        }
      }
      
      // Execute the handler
      const response = await handler(request);
      
      // Add security headers to response
      return addSecurityHeaders(response);
      
    } catch (error) {
      console.error('Security middleware error:', error);
      
      const response = new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      return addSecurityHeaders(response);
    }
  };
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Validate phone format
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Password strength validation
export function isStrongPassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Clean expired rate limit entries (run periodically)
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  rateLimitStore.forEach((data, key) => {
    if (now > data.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => {
    rateLimitStore.delete(key);
  });
}

// Initialize cleanup interval
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 60 * 1000); // Cleanup every minute
}