import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Today's bookings
      const todayBookings = await prisma.booking.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday
          },
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      });

      // Today's revenue
      const todayRevenueResult = await prisma.booking.aggregate({
        where: {
          createdAt: {
            gte: startOfToday,
            lt: endOfToday
          },
          status: 'PAID'
        },
        _sum: {
          totalAmount: true
        }
      });

      const todayRevenue = todayRevenueResult._sum.totalAmount || 0;

      // Total customers
      const totalCustomers = await prisma.user.count({
        where: {
          role: 'CUSTOMER'
        }
      });

      // Upcoming departures (next 7 days)
      const upcomingDepartures = await prisma.departure.count({
        where: {
          date: {
            gte: today,
            lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          },
          isActive: true
        }
      });

      // Calculate occupancy rate for next 7 days
      const upcomingDeparturesWithBookings = await prisma.departure.findMany({
        where: {
          date: {
            gte: today,
            lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          },
          isActive: true
        },
        include: {
          _count: {
            select: { passengers: true }
          }
        }
      });

      const totalCapacity = upcomingDeparturesWithBookings.reduce((sum, dep) => sum + dep.capacity, 0);
      const totalBooked = upcomingDeparturesWithBookings.reduce((sum, dep) => sum + dep._count.passengers, 0);
      const occupancyRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

      // Pending payments
      const pendingPayments = await prisma.booking.count({
        where: {
          status: 'PENDING'
        }
      });

      const stats = {
        todayBookings,
        todayRevenue,
        totalCustomers,
        upcomingDepartures,
        occupancyRate,
        pendingPayments
      };

      return NextResponse.json({ stats });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, 'ADMIN');
}