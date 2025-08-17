import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const testDate = new Date(dateStr);
    const dayOfWeek = testDate.getDay();
    
    // Get all schedules
    const allSchedules = await prisma.$queryRaw`
      SELECT id, "routeId", "dayOfWeek", time, "isActive" 
      FROM schedules 
      WHERE "isActive" = true
      ORDER BY "dayOfWeek", time
    ` as any[];
    
    // Get schedules for this day
    const matchingSchedules = allSchedules.filter(s => s.dayOfWeek === dayOfWeek);
    
    // Get departures for this date
    const startDate = new Date(testDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(testDate);
    endDate.setHours(23, 59, 59, 999);
    
    const departures = await prisma.departure.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        schedule: true
      }
    });
    
    // Get route info
    const routes = await prisma.route.findMany();
    
    return NextResponse.json({
      diagnosis: {
        testDate: dateStr,
        dayOfWeek: dayOfWeek,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        totalSchedules: allSchedules.length,
        schedulesForThisDay: matchingSchedules.length,
        departuresForThisDate: departures.length,
        routes: routes.length
      },
      details: {
        allSchedulesDayOfWeek: allSchedules.map(s => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          time: s.time
        })),
        matchingSchedules: matchingSchedules,
        departures: departures.map(d => ({
          id: d.id,
          scheduleId: d.scheduleId,
          date: d.date,
          capacity: d.capacity,
          bookedSeats: d.bookedSeats
        }))
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Diagnosis failed',
      details: error instanceof Error ? error.stack : 'Unknown error'
    }, { status: 500 });
  }
}