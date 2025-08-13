import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

// Auth configuration type
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
}

// Get current session for server-side use
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role as 'ADMIN' | 'CUSTOMER'
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Check if user is admin
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  
  return user;
}

// Middleware helper for API routes
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>,
  requireRole?: 'ADMIN' | 'CUSTOMER'
): Promise<Response> {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (requireRole && user.role !== requireRole) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return await handler(request, user);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Hash password utility
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate secure random password
export function generateSecurePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

// Session utilities for client-side
export const SESSION_CONFIG = {
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    authorized: ({ token, req }: { token: any; req: any }) => {
      // Protect admin routes
      if (req.nextUrl?.pathname?.startsWith('/admin')) {
        return token?.role === 'ADMIN';
      }
      
      // Protect customer dashboard routes
      if (req.nextUrl?.pathname?.startsWith('/dashboard')) {
        return !!token;
      }
      
      return true;
    },
  },
};