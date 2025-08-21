import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const dateParam = searchParams.get('date');
      const viewMode = searchParams.get('view') || 'day';
      
      if (!dateParam) {
        return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
      }

      const selectedDate = new Date(dateParam);
      let startDate: Date, endDate: Date;

      if (viewMode === 'week') {
        // Get start of week (Sunday)
        startDate = new Date(selectedDate);
        startDate.setDate(selectedDate.getDate() - selectedDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        
        // Get end of week (Saturday)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Day view
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
      }

      // Fetch departures with their bookings and vehicle assignments
      const departures = await prisma.departure.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          schedule: {
            include: {
              route: true
            }
          },
          vehicle: true,
          bookings: {
            where: {
              status: {
                in: ['CONFIRMED', 'PAID']
              }
            },
            select: {
              passengerCount: true
            }
          }
        },
        orderBy: [
          { date: 'asc' },
          { schedule: { time: 'asc' } }
        ]
      });

      // Group departures by time slots and routes
      const timeSlots = new Map<string, any>();

      departures.forEach(departure => {
        const timeKey = departure.schedule.time;
        const routeKey = `${departure.schedule.route.origin} → ${departure.schedule.route.destination}`;
        
        if (!timeSlots.has(timeKey)) {
          timeSlots.set(timeKey, {
            time: timeKey,
            routes: new Map()
          });
        }

        const timeSlot = timeSlots.get(timeKey);
        
        if (!timeSlot.routes.has(routeKey)) {
          timeSlot.routes.set(routeKey, {
            route: routeKey,
            origin: departure.schedule.route.origin,
            destination: departure.schedule.route.destination,
            departures: []
          });
        }

        // Calculate booked seats
        const bookedSeats = departure.bookings.reduce(
          (total, booking) => total + booking.passengerCount, 
          0
        );

        timeSlot.routes.get(routeKey).departures.push({
          id: departure.id,
          date: departure.date,
          capacity: departure.capacity,
          bookedSeats,
          availableSeats: departure.capacity - bookedSeats,
          vehicle: departure.vehicle ? {
            id: departure.vehicle.id,
            name: departure.vehicle.name,
            capacity: departure.vehicle.capacity
          } : null
        });
      });

      // Convert maps to arrays for JSON response
      const result = Array.from(timeSlots.values()).map(timeSlot => ({
        ...timeSlot,
        routes: Array.from(timeSlot.routes.values())
      }));

      return NextResponse.json({ 
        departures: result,
        dateRange: {
          start: startDate,
          end: endDate,
          viewMode
        }
      });

    } catch (error) {
      console.error('Schedule capacity error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}