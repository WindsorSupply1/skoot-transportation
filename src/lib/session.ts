import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import type { Session } from 'next-auth';
import { prisma } from './prisma';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  isAdmin: boolean;
  firstName: string;
  lastName: string;
  phone?: string;
  customerType: string;
}

export interface ExtendedSession extends Session {
  user: SessionUser;
}

// Get current session with extended user data
export async function getSession(): Promise<ExtendedSession | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    // Fetch extended user data from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        image: true,
        isAdmin: true,
        customerType: true,
      }
    });

    if (!user) {
      return null;
    }

    return {
      ...session,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        image: user.image || undefined,
        isAdmin: user.isAdmin,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || undefined,
        customerType: user.customerType,
      }
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Check if user is authenticated
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  
  return session.user;
}

// Check if user is admin
export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  
  if (!session.user.isAdmin) {
    throw new Error('Admin access required');
  }
  
  return session.user;
}

// Session utilities for different user types
export const SessionUtils = {
  // Check if user can manage bookings
  canManageBookings: (user: SessionUser): boolean => {
    return user.isAdmin;
  },

  // Check if user can access admin features
  canAccessAdmin: (user: SessionUser): boolean => {
    return user.isAdmin;
  },

  // Check if user can modify their own profile
  canModifyProfile: (user: SessionUser, targetUserId: string): boolean => {
    return user.id === targetUserId || user.isAdmin;
  },

  // Check if user can view booking
  canViewBooking: (user: SessionUser, bookingUserId: string): boolean => {
    return user.id === bookingUserId || user.isAdmin;
  },

  // Get user display name
  getDisplayName: (user: SessionUser): string => {
    return user.name || `${user.firstName} ${user.lastName}`;
  },

  // Get user initials for avatar
  getInitials: (user: SessionUser): string => {
    const firstName = user.firstName || user.name?.split(' ')[0] || '';
    const lastName = user.lastName || user.name?.split(' ')[1] || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  },

  // Check if user has complete profile
  hasCompleteProfile: (user: SessionUser): boolean => {
    return !!(user.firstName && user.lastName && user.email && user.phone);
  },

  // Get user role display name
  getRoleDisplayName: (user: SessionUser): string => {
    return user.isAdmin ? 'Administrator' : 'Customer';
  },
};

// Server-side session management for API routes
export class SessionManager {
  static async getCurrentUser(): Promise<SessionUser | null> {
    try {
      const session = await getSession();
      return session?.user || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async requireUser(): Promise<SessionUser> {
    const user = await this.getCurrentUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }
    
    return user;
  }

  static async requireAdmin(): Promise<SessionUser> {
    const user = await this.requireUser();
    
    if (!user.isAdmin) {
      throw new Error('Admin access required');
    }
    
    return user;
  }

  static async updateUserSession(userId: string): Promise<void> {
    try {
      // Force session refresh by updating user's updatedAt timestamp
      await prisma.user.update({
        where: { id: userId },
        data: { updatedAt: new Date() }
      });
    } catch (error) {
      console.error('Error updating user session:', error);
    }
  }
}

// Client-side session hooks (for use with useSession)
export const clientSessionUtils = {
  isAuthenticated: (session: Session | null): boolean => {
    return !!session?.user;
  },

  isAdmin: (session: Session | null): boolean => {
    return !!(session?.user as any)?.isAdmin;
  },

  getUserId: (session: Session | null): string | null => {
    return (session?.user as any)?.id || null;
  },

  getDisplayName: (session: Session | null): string => {
    return session?.user?.name || 'User';
  },

  getEmail: (session: Session | null): string | null => {
    return session?.user?.email || null;
  },
};