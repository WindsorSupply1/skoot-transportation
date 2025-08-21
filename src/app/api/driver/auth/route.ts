import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Driver authentication with PIN
export async function POST(request: NextRequest) {
  try {
    const { pinCode } = await request.json();

    if (!pinCode || pinCode.length !== 4) {
      return NextResponse.json(
        { error: 'Valid 4-digit PIN required' },
        { status: 400 }
      );
    }

    // Find driver by PIN code
    const driver = await prisma.driver.findFirst({
      where: {
        pinCode: pinCode,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        rating: true,
        totalTrips: true
      }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Invalid PIN or driver not found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      driver: driver
    });

  } catch (error) {
    console.error('Driver authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}