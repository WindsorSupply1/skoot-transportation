import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const routeId = searchParams.get('routeId');
      
      const where: any = {};
      if (routeId) {
        where.routeId = routeId;
      }

      const schedules = await prisma.schedule.findMany({
        where,
        include: {
          route: {
            include: {
              origin: true,
              destination: true
            }
          },
          departures: {
            include: {
              _count: {
                select: { passengers: true }
              }
            },
            where: {
              date: {
                gte: new Date()
              }
            },
            orderBy: { date: 'asc' },
            take: 5
          }
        },
        orderBy: [
          { route: { name: 'asc' } },
          { departureTime: 'asc' }
        ]
      });

      const schedulesWithStats = schedules.map(schedule => ({
        id: schedule.id,
        departureTime: schedule.departureTime,
        isActive: schedule.isActive,
        route: {
          id: schedule.route.id,
          name: schedule.route.name,
          origin: schedule.route.origin.name,
          destination: schedule.route.destination.name,
          duration: schedule.route.estimatedDuration
        },
        upcomingDepartures: schedule.departures.map(departure => ({
          id: departure.id,
          date: departure.date,
          capacity: departure.capacity,
          bookedSeats: departure._count.passengers,
          availableSeats: departure.capacity - departure._count.passengers
        })),
        totalUpcomingCapacity: schedule.departures.reduce((sum, dep) => sum + dep.capacity, 0),
        totalBookedSeats: schedule.departures.reduce((sum, dep) => sum + dep._count.passengers, 0)
      }));

      return NextResponse.json({ schedules: schedulesWithStats });
    } catch (error) {
      console.error('Schedules fetch error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, 'ADMIN');
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const {
        routeId,
        departureTime,
        daysOfWeek,
        isActive = true
      } = await req.json();

      if (!routeId || !departureTime || !daysOfWeek || !Array.isArray(daysOfWeek)) {
        return NextResponse.json({
          error: 'Missing required fields: routeId, departureTime, daysOfWeek'
        }, { status: 400 });
      }

      // Verify route exists
      const route = await prisma.route.findUnique({
        where: { id: routeId }
      });

      if (!route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }

      // Create schedule
      const schedule = await prisma.schedule.create({
        data: {
          routeId,
          departureTime,
          daysOfWeek,
          isActive
        },
        include: {
          route: {
            include: {
              origin: true,
              destination: true
            }
          }
        }
      });

      return NextResponse.json({
        message: 'Schedule created successfully',
        schedule
      });
    } catch (error) {
      console.error('Schedule creation error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, 'ADMIN');
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const {
        id,
        departureTime,
        daysOfWeek,
        isActive
      } = await req.json();

      if (!id) {
        return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 });
      }

      const updateData: any = {};
      if (departureTime !== undefined) updateData.departureTime = departureTime;
      if (daysOfWeek !== undefined) updateData.daysOfWeek = daysOfWeek;
      if (isActive !== undefined) updateData.isActive = isActive;

      const schedule = await prisma.schedule.update({
        where: { id },
        data: updateData,
        include: {
          route: {
            include: {
              origin: true,
              destination: true
            }
          }
        }
      });

      return NextResponse.json({
        message: 'Schedule updated successfully',
        schedule
      });
    } catch (error) {
      console.error('Schedule update error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, 'ADMIN');
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) {
        return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 });
      }

      // Check if schedule has future departures with bookings
      const futureBookingsCount = await prisma.booking.count({
        where: {
          departure: {
            scheduleId: id,
            date: {
              gte: new Date()
            }
          },
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      });

      if (futureBookingsCount > 0) {
        return NextResponse.json({
          error: `Cannot delete schedule with ${futureBookingsCount} active future bookings`
        }, { status: 400 });
      }

      await prisma.schedule.delete({
        where: { id }
      });

      return NextResponse.json({
        message: 'Schedule deleted successfully'
      });
    } catch (error) {
      console.error('Schedule deletion error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, 'ADMIN');
}