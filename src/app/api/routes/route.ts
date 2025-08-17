import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Public routes endpoint for booking page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSchedules = searchParams.get('includeSchedules') === 'true';

    // Get active routes with optional schedule data
    const routes = await prisma.route.findMany({
      where: {
        isActive: true
      },
      include: includeSchedules ? {
        schedules: {
          where: {
            isActive: true
          },
          include: {
            departures: {
              where: {
                date: {
                  gte: new Date() // Only future departures
                },
                status: {
                  in: ['SCHEDULED', 'BOARDING']
                }
              },
              orderBy: {
                date: 'asc'
              },
              take: 30 // Limit to next 30 departures per schedule
            }
          },
          orderBy: { time: 'asc' }
        }
      } : undefined,
      orderBy: { name: 'asc' }
    });

    // Transform data to include computed fields
    const routesWithSchedules = routes.map(route => {
      const baseRoute = {
        id: route.id,
        name: route.name,
        origin: route.origin,
        destination: route.destination,
        duration: route.duration,
        isActive: route.isActive,
      };

      if (includeSchedules && 'schedules' in route && route.schedules) {
        return {
          ...baseRoute,
          schedules: route.schedules.map(schedule => ({
            id: schedule.id,
            time: schedule.time,
            dayOfWeek: schedule.dayOfWeek,
            capacity: schedule.capacity,
            isActive: schedule.isActive,
            route: {
              id: route.id,
              name: route.name,
              origin: route.origin,
              destination: route.destination,
              duration: route.duration
            },
            upcomingDepartures: schedule.departures.map(departure => ({
              id: departure.id,
              date: departure.date,
              capacity: departure.capacity,
              bookedSeats: departure.bookedSeats,
              availableSeats: departure.capacity - departure.bookedSeats,
              status: departure.status
            }))
          }))
        };
      }

      return baseRoute;
    });

    return NextResponse.json({ 
      routes: routesWithSchedules,
      count: routes.length 
    });

  } catch (error) {
    console.error('Routes fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch routes',
      routes: [] 
    }, { status: 500 });
  }
}