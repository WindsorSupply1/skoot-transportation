import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const scheduleId = params.id;

      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          route: true,
          departures: {
            include: {
              _count: {
                select: { bookings: true }
              }
            },
            orderBy: { date: 'desc' },
            take: 10
          }
        }
      });

      if (!schedule) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
      }

      const scheduleWithStats = {
        id: schedule.id,
        time: schedule.time,
        // Note: capacity is stored per departure, not per schedule
        isActive: schedule.isActive,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        route: schedule.route,
        departures: schedule.departures.map(departure => ({
          id: departure.id,
          date: departure.date,
          capacity: departure.capacity,
          bookedSeats: departure._count.bookings,
          availableSeats: departure.capacity - departure._count.bookings
        }))
      };

      return NextResponse.json({ schedule: scheduleWithStats });

    } catch (error) {
      console.error('Schedule fetch error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const scheduleId = params.id;
      const body = await req.json();
      const { time, isActive } = body;

      // Check if schedule exists
      const existingSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: { route: true }
      });

      if (!existingSchedule) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
      }

      // If time is being changed, check for conflicts
      if (time && time !== existingSchedule.time) {
        const conflictingSchedule = await prisma.schedule.findFirst({
          where: {
            routeId: existingSchedule.routeId,
            time: time,
            id: { not: scheduleId }
          }
        });

        if (conflictingSchedule) {
          return NextResponse.json({ 
            error: 'A schedule with this time already exists for this route' 
          }, { status: 400 });
        }
      }

      // Build update data
      const updateData: any = { updatedAt: new Date() };
      if (time !== undefined) updateData.time = time;
      // Note: capacity is stored per departure, not per schedule
      if (isActive !== undefined) updateData.isActive = isActive;

      // Update schedule
      const updatedSchedule = await prisma.schedule.update({
        where: { id: scheduleId },
        data: updateData,
        include: {
          route: true,
          departures: {
            include: {
              _count: {
                select: { bookings: true }
              }
            },
            orderBy: { date: 'desc' },
            take: 10
          }
        }
      });

      const scheduleWithStats = {
        id: updatedSchedule.id,
        time: updatedSchedule.time,
        // Note: capacity is stored per departure, not per schedule
        isActive: updatedSchedule.isActive,
        createdAt: updatedSchedule.createdAt,
        updatedAt: updatedSchedule.updatedAt,
        route: updatedSchedule.route,
        departures: updatedSchedule.departures.map(departure => ({
          id: departure.id,
          date: departure.date,
          capacity: departure.capacity,
          bookedSeats: departure._count.bookings,
          availableSeats: departure.capacity - departure._count.bookings
        }))
      };

      return NextResponse.json({
        message: 'Schedule updated successfully',
        schedule: scheduleWithStats
      });

    } catch (error) {
      console.error('Schedule update error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const scheduleId = params.id;

      // Check if schedule exists
      const existingSchedule = await prisma.schedule.findUnique({
        where: { id: scheduleId }
      });

      if (!existingSchedule) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
      }

      // Check if schedule has future departures with bookings
      const futureBookingsCount = await prisma.booking.count({
        where: {
          departure: {
            scheduleId: scheduleId,
            date: {
              gte: new Date()
            }
          },
          status: {
            in: ['PENDING', 'CONFIRMED', 'PAID']
          }
        }
      });

      if (futureBookingsCount > 0) {
        return NextResponse.json({
          error: `Cannot delete schedule with ${futureBookingsCount} active future bookings. Please cancel or complete these bookings first.`
        }, { status: 400 });
      }

      // Delete future departures with no bookings
      await prisma.departure.deleteMany({
        where: {
          scheduleId: scheduleId,
          date: {
            gte: new Date()
          }
        }
      });

      // Delete the schedule
      await prisma.schedule.delete({
        where: { id: scheduleId }
      });

      return NextResponse.json({
        message: 'Schedule deleted successfully'
      });

    } catch (error) {
      console.error('Schedule deletion error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}