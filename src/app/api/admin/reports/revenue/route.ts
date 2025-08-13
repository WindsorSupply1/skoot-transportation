import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly

      if (!startDate || !endDate) {
        return NextResponse.json({
          error: 'Start date and end date are required'
        }, { status: 400 });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Revenue by date range
      const revenueData = await prisma.booking.groupBy({
        by: ['createdAt'],
        where: {
          paymentStatus: 'PAID',
          createdAt: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        }
      });

      // Customer type breakdown
      const customerTypeBreakdown = await prisma.booking.groupBy({
        by: ['customerType'],
        where: {
          paymentStatus: 'PAID',
          createdAt: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        }
      });

      // Route performance
      const routePerformance = await prisma.booking.findMany({
        where: {
          paymentStatus: 'PAID',
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          departure: {
            include: {
              schedule: {
                include: {
                  route: true
                }
              }
            }
          }
        }
      });

      const routeStats = routePerformance.reduce((acc: any, booking) => {
        const routeId = booking.departure.schedule.route.id;
        const routeName = booking.departure.schedule.route.name;
        
        if (!acc[routeId]) {
          acc[routeId] = {
            routeId,
            routeName,
            totalRevenue: 0,
            totalBookings: 0,
            totalPassengers: 0
          };
        }
        
        acc[routeId].totalRevenue += booking.totalAmount;
        acc[routeId].totalBookings += 1;
        acc[routeId].totalPassengers += booking.passengerCount;
        
        return acc;
      }, {});

      // Peak times analysis
      const peakTimesData = await prisma.booking.findMany({
        where: {
          paymentStatus: 'PAID',
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          departure: {
            include: {
              schedule: true
            }
          }
        }
      });

      const timeSlotStats = peakTimesData.reduce((acc: any, booking) => {
        const time = booking.departure.schedule.departureTime;
        
        if (!acc[time]) {
          acc[time] = {
            time,
            bookings: 0,
            passengers: 0,
            revenue: 0
          };
        }
        
        acc[time].bookings += 1;
        acc[time].passengers += booking.passengerCount;
        acc[time].revenue += booking.totalAmount;
        
        return acc;
      }, {});

      // Summary statistics
      const totalRevenue = revenueData.reduce((sum, item) => sum + (item._sum.totalAmount || 0), 0);
      const totalBookings = revenueData.reduce((sum, item) => sum + item._count.id, 0);
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      return NextResponse.json({
        summary: {
          totalRevenue,
          totalBookings,
          averageBookingValue,
          period: `${startDate} to ${endDate}`
        },
        revenueByDate: revenueData,
        customerTypeBreakdown: customerTypeBreakdown.map(item => ({
          customerType: item.customerType,
          revenue: item._sum.totalAmount || 0,
          bookings: item._count.id,
          percentage: totalRevenue > 0 ? ((item._sum.totalAmount || 0) / totalRevenue * 100).toFixed(1) : 0
        })),
        routePerformance: Object.values(routeStats),
        peakTimes: Object.values(timeSlotStats).sort((a: any, b: any) => b.revenue - a.revenue)
      });

    } catch (error) {
      console.error('Revenue report error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, 'ADMIN');
}