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
      const routeId = params.id;

      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: {
          schedules: {
            orderBy: { time: 'asc' },
            include: {
              departures: {
                include: {
                  _count: {
                    select: { bookings: true }
                  }
                },
                where: {
                  date: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                  }
                },
                orderBy: { date: 'desc' }
              }
            }
          }
        }
      });

      if (!route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }

      return NextResponse.json({ route });

    } catch (error) {
      console.error('Route fetch error:', error);
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
      const routeId = params.id;
      const body = await req.json();
      const { name, origin, destination, duration, isActive } = body;

      // Check if route exists
      const existingRoute = await prisma.route.findUnique({
        where: { id: routeId }
      });

      if (!existingRoute) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }

      // If name is being changed, check for conflicts
      if (name && name !== existingRoute.name) {
        const conflictingRoute = await prisma.route.findFirst({
          where: {
            name: {
              equals: name,
              mode: 'insensitive'
            },
            id: { not: routeId }
          }
        });

        if (conflictingRoute) {
          return NextResponse.json({ 
            error: 'A route with this name already exists' 
          }, { status: 400 });
        }
      }

      // Build update data
      const updateData: any = { updatedAt: new Date() };
      if (name !== undefined) updateData.name = name;
      if (origin !== undefined) updateData.origin = origin;
      if (destination !== undefined) updateData.destination = destination;
      // Note: price is handled through PricingTier system, not stored on Route
      if (duration !== undefined) updateData.duration = parseInt(duration);
      if (isActive !== undefined) updateData.isActive = isActive;

      // Update route
      const updatedRoute = await prisma.route.update({
        where: { id: routeId },
        data: updateData,
        include: {
          schedules: {
            orderBy: { time: 'asc' }
          }
        }
      });

      return NextResponse.json({
        message: 'Route updated successfully',
        route: updatedRoute
      });

    } catch (error) {
      console.error('Route update error:', error);
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
      const routeId = params.id;

      // Check if route exists
      const existingRoute = await prisma.route.findUnique({
        where: { id: routeId },
        include: {
          schedules: {
            include: {
              departures: {
                include: {
                  bookings: true
                }
              }
            }
          }
        }
      });

      if (!existingRoute) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }

      // Check if route has active bookings
      let activeBookingsCount = 0;
      for (const schedule of existingRoute.schedules) {
        for (const departure of schedule.departures) {
          if (new Date(departure.date) >= new Date()) {
            const activeBookings = departure.bookings.filter(booking => 
              ['PENDING', 'CONFIRMED', 'PAID'].includes(booking.status)
            );
            activeBookingsCount += activeBookings.length;
          }
        }
      }

      if (activeBookingsCount > 0) {
        return NextResponse.json({
          error: `Cannot delete route with ${activeBookingsCount} active future bookings. Please cancel or complete these bookings first.`
        }, { status: 400 });
      }

      // Delete in correct order due to foreign key constraints
      
      // Delete all future departures with no active bookings
      for (const schedule of existingRoute.schedules) {
        await prisma.departure.deleteMany({
          where: {
            scheduleId: schedule.id,
            date: {
              gte: new Date()
            }
          }
        });
      }

      // Delete all schedules
      await prisma.schedule.deleteMany({
        where: { routeId: routeId }
      });

      // Finally delete the route
      await prisma.route.delete({
        where: { id: routeId }
      });

      return NextResponse.json({
        message: 'Route and all associated schedules deleted successfully'
      });

    } catch (error) {
      console.error('Route deletion error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}