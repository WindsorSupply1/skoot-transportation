import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const routeId = searchParams.get('routeId');

    const where: any = {};
    
    if (date) {
      const selectedDate = new Date(date);
      where.date = {
        gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        lt: new Date(selectedDate.setHours(23, 59, 59, 999))
      };
    } else {
      // Default to today and future dates
      where.date = {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      };
    }

    if (routeId) {
      where.schedule = { routeId };
    }

    const departures = await prisma.departure.findMany({
      where,
      include: {
        schedule: {
          include: {
            route: {
              include: {
                startLocation: true,
                endLocation: true
              }
            }
          }
        },
        _count: {
          select: { passengers: true }
        }
      },
      orderBy: [
        { date: 'asc' },
        { schedule: { departureTime: 'asc' } }
      ]
    });

    const departuresWithAvailability = departures.map(departure => {
      const bookedSeats = departure._count.passengers;
      const availableSeats = departure.capacity - bookedSeats;
      const occupancyRate = (bookedSeats / departure.capacity) * 100;

      let availabilityStatus: string;
      if (availableSeats === 0) availabilityStatus = 'FULL';
      else if (occupancyRate >= 80) availabilityStatus = 'LOW';
      else if (occupancyRate >= 50) availabilityStatus = 'MEDIUM';
      else availabilityStatus = 'HIGH';

      return {
        id: departure.id,
        date: departure.date,
        departureTime: departure.schedule.departureTime,
        estimatedArrival: departure.estimatedArrival,
        capacity: departure.capacity,
        bookedSeats,
        availableSeats,
        availabilityStatus,
        route: {
          id: departure.schedule.route.id,
          name: departure.schedule.route.name,
          startLocation: departure.schedule.route.startLocation.name,
          endLocation: departure.schedule.route.endLocation.name,
          duration: departure.schedule.route.estimatedDuration
        },
        isActive: departure.isActive,
        notes: departure.notes
      };
    });

    return NextResponse.json({ departures: departuresWithAvailability });

  } catch (error) {
    console.error('Departures fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}