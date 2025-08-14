import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: any = { isActive: true };
    
    if (type === 'pickup') {
      where.locationType = 'PICKUP';
    } else if (type === 'destination') {
      where.locationType = 'DESTINATION';
    }

    const locations = await prisma.location.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        isPickup: true,
        isDropoff: true,
        isActive: true,
        sortOrder: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ locations });

  } catch (error) {
    console.error('Locations fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}