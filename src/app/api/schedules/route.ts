import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Public schedules endpoint for booking page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    
    const where: any = {
      isActive: true
    };
    
    if (routeId) {
      where.routeId = routeId;
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        ...where,
        route: {
          isActive: true
        }
      },
      include: {
        route: true,
        departures: {
          where: {
            date: {
              gte: new Date() // Only future departures
            },
            status: {
              in: ['SCHEDULED', 'BOARDING']
            }
          },
          orderBy: { date: 'asc' },
          take: 30 // Limit to next 30 departures per schedule
        }
      },
      orderBy: [
        { route: { name: 'asc' } },
        { time: 'asc' }
      ]
    });

    // Transform data to include computed fields
    const schedulesWithStats = schedules
      .filter(schedule => schedule.route) // Filter out schedules without routes
      .map((schedule: any) => ({
        id: schedule.id,
        time: schedule.time,
        dayOfWeek: schedule.dayOfWeek,
        capacity: 20, // Default capacity since column doesn't exist yet
        isActive: schedule.isActive,
        route: {
          id: schedule.route.id,
          name: schedule.route.name,
          origin: schedule.route.origin,
          destination: schedule.route.destination,
          duration: schedule.route.duration
        },
        upcomingDepartures: (schedule.departures || []).map((departure: any) => ({
          id: departure.id,
          date: departure.date,
          capacity: departure.capacity,
          bookedSeats: departure.bookedSeats || 0,
          availableSeats: departure.capacity - (departure.bookedSeats || 0),
          status: departure.status
        }))
      }));

    return NextResponse.json({ 
      schedules: schedulesWithStats,
      count: schedules.length 
    });

  } catch (error) {
    console.error('Schedules fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch schedules',
      schedules: [] 
    }, { status: 500 });
  }
}