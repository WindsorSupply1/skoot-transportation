import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Public schedules endpoint for booking page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    
    // Use raw query to avoid schema issues
    let schedulesQuery = `
      SELECT 
        s.id,
        s."routeId",
        s."dayOfWeek",
        s.time,
        s."isActive",
        r.id as route_id,
        r.name as route_name,
        r.origin as route_origin,
        r.destination as route_destination,
        r.duration as route_duration
      FROM schedules s
      INNER JOIN routes r ON s."routeId" = r.id
      WHERE s."isActive" = true AND r."isActive" = true
    `;
    
    if (routeId) {
      schedulesQuery += ` AND s."routeId" = '${routeId}'`;
    }
    
    schedulesQuery += ` ORDER BY r.name, s.time`;
    
    const schedules = await prisma.$queryRawUnsafe(schedulesQuery) as any[];

    // Get departures for all schedules
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    const departures = await prisma.departure.findMany({
      where: {
        date: {
          gte: today,
          lte: futureDate
        },
        status: {
          in: ['SCHEDULED', 'BOARDING']
        }
      },
      select: {
        id: true,
        scheduleId: true,
        date: true,
        capacity: true,
        bookedSeats: true,
        status: true
      }
    });
    
    // Group departures by schedule
    const departuresBySchedule: { [key: string]: any[] } = {};
    departures.forEach(dep => {
      if (!departuresBySchedule[dep.scheduleId]) {
        departuresBySchedule[dep.scheduleId] = [];
      }
      departuresBySchedule[dep.scheduleId].push({
        id: dep.id,
        date: dep.date,
        capacity: dep.capacity,
        bookedSeats: dep.bookedSeats,
        availableSeats: dep.capacity - dep.bookedSeats,
        status: dep.status
      });
    });
    
    // Transform data to match expected format
    const schedulesWithStats = schedules.map((schedule: any) => ({
      id: schedule.id,
      time: schedule.time,
      dayOfWeek: schedule.dayOfWeek,
      capacity: 20, // Default capacity
      isActive: schedule.isActive,
      route: {
        id: schedule.route_id,
        name: schedule.route_name,
        origin: schedule.route_origin,
        destination: schedule.route_destination,
        duration: schedule.route_duration
      },
      upcomingDepartures: departuresBySchedule[schedule.id] || []
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