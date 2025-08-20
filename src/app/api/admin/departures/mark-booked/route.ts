import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { endDate, scheduleIds } = await req.json();

      if (!endDate) {
        return NextResponse.json({
          error: 'End date is required'
        }, { status: 400 });
      }

      const endDateTime = new Date(endDate);
      
      // Build where clause for departures to update
      const where: any = {
        date: {
          lt: endDateTime
        }
      };

      if (scheduleIds && scheduleIds.length > 0) {
        where.scheduleId = { in: scheduleIds };
      }

      // Get all departures that need to be updated
      const affectedDepartures = await prisma.departure.findMany({
        where,
        include: {
          schedule: {
            include: {
              route: true
            }
          }
        }
      });

      // Update each departure individually to set bookedSeats = capacity
      for (const departure of affectedDepartures) {
        await prisma.departure.update({
          where: { id: departure.id },
          data: {
            bookedSeats: departure.capacity
          }
        });
      }

      return NextResponse.json({
        message: `Successfully marked ${affectedDepartures.length} departures as fully booked`,
        updatedDepartures: affectedDepartures.length,
        endDate: endDate,
        departures: affectedDepartures.map(d => ({
          id: d.id,
          date: d.date,
          route: d.schedule.route.name,
          capacity: d.capacity,
          bookedSeats: d.capacity
        }))
      });

    } catch (error) {
      console.error('Mark departures as booked error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}