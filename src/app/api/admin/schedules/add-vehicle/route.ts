import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await request.json();
      const { scheduleId, routeId, date, vanId } = body;

      if (!scheduleId && (!routeId || !date)) {
        return NextResponse.json({ 
          error: 'Either scheduleId or (routeId and date) required' 
        }, { status: 400 });
      }

      // Get the vehicle details
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vanId }
      });

      if (!vehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }

      let targetSchedule;
      let targetDate;

      if (scheduleId) {
        // Find existing departure for this schedule
        const schedule = await prisma.schedule.findUnique({
          where: { id: scheduleId }
        });
        
        if (!schedule) {
          return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }
        
        targetSchedule = schedule;
        targetDate = new Date(); // Use today or get from request
      } else {
        // Find schedule by route and create departure for specific date
        targetDate = new Date(date);
      }

      // Create a new departure with the selected vehicle
      const newDeparture = await prisma.departure.create({
        data: {
          scheduleId: targetSchedule?.id || scheduleId,
          vehicleId: vanId,
          date: targetDate,
          capacity: vehicle.capacity,
          bookedSeats: 0,
          status: 'SCHEDULED'
        },
        include: {
          vehicle: true,
          schedule: {
            include: {
              route: true
            }
          }
        }
      });

      return NextResponse.json({ 
        success: true,
        departure: {
          id: newDeparture.id,
          vehicle: {
            id: newDeparture.vehicle!.id,
            name: newDeparture.vehicle!.name,
            capacity: newDeparture.vehicle!.capacity
          },
          capacity: newDeparture.capacity,
          bookedSeats: newDeparture.bookedSeats,
          route: `${newDeparture.schedule.route.origin} → ${newDeparture.schedule.route.destination}`,
          time: newDeparture.schedule.time,
          date: newDeparture.date
        }
      });

    } catch (error) {
      console.error('Add vehicle error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}