import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionManager } from '@/lib/session';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  dateOfBirth: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  customerType: z.enum(['REGULAR', 'STUDENT', 'MILITARY']),
  studentId: z.string().optional(),
  militaryId: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await SessionManager.requireUser();
    
    const body = await request.json();
    const data = updateProfileSchema.parse(body);

    // Prevent email changes (email is managed through OAuth/NextAuth)
    if (data.email !== currentUser.email) {
      return NextResponse.json(
        { error: 'Email address cannot be changed' },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        emergencyContact: data.emergencyContact || null,
        emergencyPhone: data.emergencyPhone || null,
        customerType: data.customerType,
        studentId: data.customerType === 'STUDENT' ? data.studentId || null : null,
        militaryId: data.customerType === 'MILITARY' ? data.militaryId || null : null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        emergencyContact: true,
        emergencyPhone: true,
        customerType: true,
        studentId: true,
        militaryId: true,
        isAdmin: true,
      }
    });

    // Update session to reflect changes
    await SessionManager.updateUserSession(currentUser.id);

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const currentUser = await SessionManager.requireUser();
    
    // Get full user profile
    const userProfile = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        image: true,
        dateOfBirth: true,
        emergencyContact: true,
        emergencyPhone: true,
        customerType: true,
        studentId: true,
        militaryId: true,
        isAdmin: true,
        isLegacyCustomer: true,
        legacyPrice: true,
        createdAt: true,
        emailVerified: true,
      }
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: userProfile
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}