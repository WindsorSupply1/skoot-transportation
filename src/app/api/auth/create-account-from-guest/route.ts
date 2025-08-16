import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const createAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  bookingId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, bookingId } = createAccountSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Get the guest booking to extract user information
    const guestBooking = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        isGuestBooking: true,
        guestEmail: email.toLowerCase()
      }
    });

    if (!guestBooking) {
      return NextResponse.json(
        { error: 'Guest booking not found' },
        { status: 404 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user account
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName: guestBooking.guestFirstName || 'Guest',
        lastName: guestBooking.guestLastName || 'User',
        phone: guestBooking.guestPhone || null,
        customerType: 'REGULAR',
        emailVerified: new Date(),
      }
    });

    // Create credentials for the user
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: user.id,
      }
    });

    // Link the guest booking to the user account
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        userId: user.id,
        isGuestBooking: false,
        // Keep guest information for reference but mark as no longer guest booking
      }
    });

    // Link any other guest bookings with the same email
    await prisma.booking.updateMany({
      where: {
        guestEmail: email.toLowerCase(),
        isGuestBooking: true,
        userId: null,
      },
      data: {
        userId: user.id,
        isGuestBooking: false,
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      }
    });

  } catch (error) {
    console.error('Create account from guest error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}