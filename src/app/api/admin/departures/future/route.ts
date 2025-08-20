import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch future departures for vehicle assignment with date range support
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate') || '2025-11-01';
      const endDate = searchParams.get('endDate') || '2026-03-31';
      
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      const departures = await prisma.departure.findMany({
        where: {
          date: {
            gte: startDateTime,
            lt: endDateTime
          }
        },
        include: {
          schedule: {
            include: {
              route: true
            }
          },
          vehicle: true,
          _count: {
            select: { bookings: true }
          }
        },
        orderBy: [
          { date: 'asc' },
          { schedule: { time: 'asc' } }
        ]
      });

      const departuresWithStats = departures.map(departure => ({
        id: departure.id,
        date: departure.date,
        capacity: departure.capacity,
        bookedSeats: departure._count.bookings,
        availableSeats: departure.capacity - departure._count.bookings,
        status: departure.status,
        vehicle: departure.vehicle ? {
          id: departure.vehicle.id,
          name: departure.vehicle.name,
          capacity: departure.vehicle.capacity,
          priceMultiplier: departure.vehicle.priceMultiplier
        } : null,
        schedule: {
          id: departure.schedule.id,
          time: departure.schedule.time,
          route: {
            id: departure.schedule.route.id,
            name: departure.schedule.route.name,
            origin: departure.schedule.route.origin,
            destination: departure.schedule.route.destination
          }
        }
      }));

      // Group by date for calendar view
      const groupedByDate = departuresWithStats.reduce((acc, departure) => {
        const dateKey = departure.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(departure);
        return acc;
      }, {} as Record<string, typeof departuresWithStats>);

      // Statistics
      const totalDepartures = departures.length;
      const departuresWithVehicles = departures.filter(d => d.vehicle).length;
      const departuresWithoutVehicles = totalDepartures - departuresWithVehicles;
      const totalAvailableSeats = departuresWithStats.reduce((sum, d) => sum + d.availableSeats, 0);

      return NextResponse.json({
        departures: departuresWithStats,
        groupedByDate,
        stats: {
          totalDepartures,
          departuresWithVehicles,
          departuresWithoutVehicles,
          totalAvailableSeats,
          assignmentComplete: (departuresWithVehicles / totalDepartures) * 100
        }
      });

    } catch (error) {
      console.error('November departures fetch error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}