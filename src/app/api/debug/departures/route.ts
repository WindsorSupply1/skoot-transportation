import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the next 10 available departures
    const now = new Date();
    
    const departures = await prisma.departure.findMany({
      where: {
        date: {
          gte: now
        },
        status: 'SCHEDULED'
      },
      include: {
        schedule: {
          include: {
            route: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: 10
    });

    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      availableDepartures: departures.map(d => ({
        id: d.id,
        date: d.date,
        time: d.schedule.time,
        route: d.schedule.route.name,
        capacity: d.capacity,
        bookedSeats: d.bookedSeats,
        availableSeats: d.capacity - d.bookedSeats
      }))
    });

  } catch (error) {
    console.error('Debug departures error:', error);
    return NextResponse.json({ 
      error: 'Failed to get departures',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}