import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Debug endpoint to check database state
export async function GET(request: NextRequest) {
  try {
    // Get counts for all major tables
    const [
      routeCount,
      scheduleCount,
      departureCount,
      locationCount,
      pricingTierCount,
      bookingCount
    ] = await Promise.all([
      prisma.route.count(),
      prisma.schedule.count(),
      prisma.departure.count(),
      prisma.location.count(),
      prisma.pricingTier.count(),
      prisma.booking.count()
    ]);

    // Get sample data from each table (basic queries to avoid schema issues)
    const sampleRoutes = await prisma.route.findMany({ take: 3 });
    const sampleSchedules = await prisma.$queryRaw`SELECT id, "routeId", "dayOfWeek", time, "isActive" FROM schedules LIMIT 3`;
    const sampleDepartures = await prisma.departure.findMany({ 
      take: 3,
      select: {
        id: true,
        date: true,
        capacity: true,
        bookedSeats: true,
        status: true
      }
    });

    return NextResponse.json({
      success: true,
      counts: {
        routes: routeCount,
        schedules: scheduleCount,
        departures: departureCount,
        locations: locationCount,
        pricingTiers: pricingTierCount,
        bookings: bookingCount
      },
      samples: {
        routes: sampleRoutes,
        schedules: sampleSchedules,
        departures: sampleDepartures
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug failed',
      details: error instanceof Error ? error.stack : 'Unknown error'
    }, { status: 500 });
  }
}