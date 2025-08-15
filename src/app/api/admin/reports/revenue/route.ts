import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const fromDate = searchParams.get('from');
      const toDate = searchParams.get('to');

      if (!fromDate || !toDate) {
        return NextResponse.json({
          error: 'From date and to date are required'
        }, { status: 400 });
      }

      const start = new Date(fromDate);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date

      // Calculate previous period for comparison
      const periodLength = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodLength);
      const previousEnd = new Date(start.getTime() - 1);

      // Current period bookings
      const currentBookings = await prisma.booking.findMany({
        where: {
          status: { in: ['CONFIRMED', 'PAID'] },
          createdAt: { gte: start, lte: end }
        },
        include: {
          user: true,
          departure: {
            include: {
              schedule: {
                include: { route: true }
              }
            }
          }
        }
      });

      // Previous period bookings for comparison
      const previousBookings = await prisma.booking.findMany({
        where: {
          status: { in: ['CONFIRMED', 'PAID'] },
          createdAt: { gte: previousStart, lte: previousEnd }
        }
      });

      // Calculate basic metrics
      const totalRevenue = currentBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      const totalBookings = currentBookings.length;
      const uniqueCustomers = new Set(currentBookings.map(b => b.userId)).size;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Previous period metrics for comparison
      const previousRevenue = previousBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      const previousBookingsCount = previousBookings.length;
      const previousCustomers = new Set(previousBookings.map(b => b.userId)).size;

      // Daily revenue breakdown
      const dailyRevenue: { [key: string]: { revenue: number; bookings: number } } = {};
      
      // Initialize all dates in range with 0
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dailyRevenue[dateKey] = { revenue: 0, bookings: 0 };
      }

      // Populate with actual data
      currentBookings.forEach(booking => {
        const dateKey = booking.createdAt.toISOString().split('T')[0];
        if (dailyRevenue[dateKey]) {
          dailyRevenue[dateKey].revenue += booking.totalAmount;
          dailyRevenue[dateKey].bookings += 1;
        }
      });

      // Route performance
      const routeStats: { [key: string]: any } = {};
      let totalCapacity = 0;
      let totalBookedSeats = 0;

      currentBookings.forEach(booking => {
        const route = booking.departure.schedule.route;
        const routeId = route.id;

        if (!routeStats[routeId]) {
          routeStats[routeId] = {
            routeId,
            routeName: route.name,
            revenue: 0,
            bookings: 0,
            totalCapacity: 0,
            bookedSeats: 0
          };
        }

        routeStats[routeId].revenue += booking.totalAmount;
        routeStats[routeId].bookings += 1;
        routeStats[routeId].bookedSeats += booking.passengerCount;
        routeStats[routeId].totalCapacity += booking.departure.capacity;

        totalCapacity += booking.departure.capacity;
        totalBookedSeats += booking.passengerCount;
      });

      // Calculate occupancy rates for routes
      const routePerformance = Object.values(routeStats).map((route: any) => ({
        ...route,
        occupancyRate: route.totalCapacity > 0 ? (route.bookedSeats / route.totalCapacity) * 100 : 0
      }));

      // Overall occupancy rate
      const occupancyRate = totalCapacity > 0 ? (totalBookedSeats / totalCapacity) * 100 : 0;

      // Customer segmentation
      const customerBookingCounts: { [key: string]: { bookings: number; revenue: number } } = {};
      
      currentBookings.forEach(booking => {
        const userId = booking.userId;
        if (!customerBookingCounts[userId]) {
          customerBookingCounts[userId] = { bookings: 0, revenue: 0 };
        }
        customerBookingCounts[userId].bookings += 1;
        customerBookingCounts[userId].revenue += booking.totalAmount;
      });

      const customerSegments = [
        { segment: 'New', count: 0, revenue: 0, percentage: 0 },
        { segment: 'Regular', count: 0, revenue: 0, percentage: 0 },
        { segment: 'Frequent', count: 0, revenue: 0, percentage: 0 },
        { segment: 'VIP', count: 0, revenue: 0, percentage: 0 }
      ];

      Object.values(customerBookingCounts).forEach((customer: any) => {
        let segment;
        if (customer.bookings >= 10) segment = 'VIP';
        else if (customer.bookings >= 5) segment = 'Frequent';
        else if (customer.bookings >= 2) segment = 'Regular';
        else segment = 'New';

        const segmentIndex = customerSegments.findIndex(s => s.segment === segment);
        customerSegments[segmentIndex].count += 1;
        customerSegments[segmentIndex].revenue += customer.revenue;
      });

      // Calculate percentages for customer segments
      customerSegments.forEach(segment => {
        segment.percentage = uniqueCustomers > 0 ? (segment.count / uniqueCustomers) * 100 : 0;
      });

      // Hourly distribution
      const hourlyDistribution: { [key: number]: { bookings: number; revenue: number } } = {};
      
      // Initialize all hours
      for (let hour = 0; hour < 24; hour++) {
        hourlyDistribution[hour] = { bookings: 0, revenue: 0 };
      }

      currentBookings.forEach(booking => {
        const time = booking.departure.schedule.time;
        const hour = parseInt(time.split(':')[0]);
        
        hourlyDistribution[hour].bookings += 1;
        hourlyDistribution[hour].revenue += booking.totalAmount;
      });

      return NextResponse.json({
        totalRevenue,
        totalBookings,
        averageBookingValue,
        uniqueCustomers,
        occupancyRate,
        periodComparison: {
          revenue: previousRevenue,
          bookings: previousBookingsCount,
          customers: previousCustomers
        },
        dailyRevenue: Object.entries(dailyRevenue).map(([date, data]) => ({
          date,
          revenue: data.revenue,
          bookings: data.bookings
        })),
        routePerformance,
        customerSegments,
        hourlyDistribution: Object.entries(hourlyDistribution).map(([hour, data]) => ({
          hour: parseInt(hour),
          bookings: data.bookings,
          revenue: data.revenue
        }))
      });

    } catch (error) {
      console.error('Revenue report error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}