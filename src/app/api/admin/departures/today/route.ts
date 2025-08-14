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
          isActive: true
        },
        include: {
          schedule: {
            include: {
              route: {
                include: {
                  origin: true,
                  destination: true
                }
              }
            }
          },
          _count: {
            select: { passengers: true }
          }
        },
        orderBy: {
          schedule: { departureTime: 'asc' }
        }
      });

      const departuresWithAvailability = departures.map(departure => ({
        id: departure.id,
        date: departure.date,
        capacity: departure.capacity,
        bookedSeats: departure._count.passengers,
        availableSeats: departure.capacity - departure._count.passengers,
        estimatedArrival: departure.estimatedArrival,
        isActive: departure.isActive,
        notes: departure.notes,
        schedule: {
          id: departure.schedule.id,
          departureTime: departure.schedule.departureTime,
          route: {
            id: departure.schedule.route.id,
            name: departure.schedule.route.name,
            origin: {
              id: departure.schedule.route.origin.id,
              name: departure.schedule.route.origin.name
            },
            destination: {
              id: departure.schedule.route.destination.id,
              name: departure.schedule.route.destination.name
            },
            estimatedDuration: departure.schedule.route.estimatedDuration
          }
        }
      }));

      return NextResponse.json({ departures: departuresWithAvailability });

    } catch (error) {
      console.error('Today departures fetch error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, 'ADMIN');
}