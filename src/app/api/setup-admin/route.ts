import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Make the current user an admin
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { isAdmin: true }
    });

    return NextResponse.json({ 
      success: true, 
      message: `User ${session.user.email} is now an admin`,
      user: {
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin
      }
    });

  } catch (error) {
    console.error('Error setting up admin:', error);
    return NextResponse.json({ 
      error: 'Failed to set up admin account' 
    }, { status: 500 });
  }
}