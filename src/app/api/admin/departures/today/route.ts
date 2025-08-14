import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const departures = await prisma.departure.findMany({
        where: {
          date: {
            gte: startOfToday,
            lt: endOfToday
          },
          status: {
            in: ['SCHEDULED', 'BOARDING']
          }
        },
        include: {
          schedule: {
            include: {
              route: true
            }
          },
          _count: {
            select: { bookings: true }
          }
        },
        orderBy: {
          schedule: { time: 'asc' }
        }
      });

      const departuresWithAvailability = departures.map(departure => ({
        id: departure.id,
        date: departure.date,
        capacity: departure.capacity,
        bookedSeats: departure._count.bookings,
        availableSeats: departure.capacity - departure._count.bookings,
        status: departure.status,
        driverNotes: departure.driverNotes,
        schedule: {
          id: departure.schedule.id,
          time: departure.schedule.time,
          route: {
            id: departure.schedule.route.id,
            name: departure.schedule.route.name,
            origin: departure.schedule.route.origin,
            destination: departure.schedule.route.destination,
            duration: departure.schedule.route.duration
          }
        }
      }));

      return NextResponse.json({ departures: departuresWithAvailability });

    } catch (error) {
      console.error('Today departures fetch error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}