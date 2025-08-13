import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!startDate || !endDate) {
        return NextResponse.json({
          error: 'Start date and end date are required'
        }, { status: 400 });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get all departures in date range with booking counts
      const departures = await prisma.departure.findMany({
        where: {
          date: {
            gte: start,
            lte: end
          }
        },
        include: {
          schedule: {
            include: {
              route: true
            }
          },
          _count: {
            select: { passengers: true }
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      // Calculate occupancy statistics
      const occupancyData = departures.map(departure => {
        const occupancyRate = (departure._count.passengers / departure.capacity) * 100;
        
        return {
          id: departure.id,
          date: departure.date,
          departureTime: departure.schedule.departureTime,
          routeName: departure.schedule.route.name,
          capacity: departure.capacity,
          bookedSeats: departure._count.passengers,
          availableSeats: departure.capacity - departure._count.passengers,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          status: occupancyRate >= 100 ? 'FULL' :
                 occupancyRate >= 80 ? 'HIGH' :
                 occupancyRate >= 50 ? 'MEDIUM' : 'LOW'
        };
      });

      // Calculate summary statistics
      const totalCapacity = departures.reduce((sum, dep) => sum + dep.capacity, 0);
      const totalBooked = departures.reduce((sum, dep) => sum + dep._count.passengers, 0);
      const overallOccupancyRate = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;

      // Group by route
      const routeOccupancy = departures.reduce((acc: any, departure) => {
        const routeId = departure.schedule.route.id;
        const routeName = departure.schedule.route.name;
        
        if (!acc[routeId]) {
          acc[routeId] = {
            routeId,
            routeName,
            totalCapacity: 0,
            totalBooked: 0,
            departures: 0,
            occupancyRate: 0
          };
        }
        
        acc[routeId].totalCapacity += departure.capacity;
        acc[routeId].totalBooked += departure._count.passengers;
        acc[routeId].departures += 1;
        
        return acc;
      }, {});

      // Calculate occupancy rates for each route
      Object.values(routeOccupancy).forEach((route: any) => {
        route.occupancyRate = route.totalCapacity > 0 ? 
          Math.round((route.totalBooked / route.totalCapacity) * 10000) / 100 : 0;
      });

      // Group by time slot
      const timeSlotOccupancy = departures.reduce((acc: any, departure) => {
        const time = departure.schedule.departureTime;
        
        if (!acc[time]) {
          acc[time] = {
            time,
            totalCapacity: 0,
            totalBooked: 0,
            departures: 0,
            occupancyRate: 0
          };
        }
        
        acc[time].totalCapacity += departure.capacity;
        acc[time].totalBooked += departure._count.passengers;
        acc[time].departures += 1;
        
        return acc;
      }, {});

      // Calculate occupancy rates for each time slot
      Object.values(timeSlotOccupancy).forEach((slot: any) => {
        slot.occupancyRate = slot.totalCapacity > 0 ? 
          Math.round((slot.totalBooked / slot.totalCapacity) * 10000) / 100 : 0;
      });

      // Daily occupancy trends
      const dailyOccupancy = departures.reduce((acc: any, departure) => {
        const date = departure.date.toISOString().split('T')[0];
        
        if (!acc[date]) {
          acc[date] = {
            date,
            totalCapacity: 0,
            totalBooked: 0,
            departures: 0,
            occupancyRate: 0
          };
        }
        
        acc[date].totalCapacity += departure.capacity;
        acc[date].totalBooked += departure._count.passengers;
        acc[date].departures += 1;
        
        return acc;
      }, {});

      // Calculate daily occupancy rates
      Object.values(dailyOccupancy).forEach((day: any) => {
        day.occupancyRate = day.totalCapacity > 0 ? 
          Math.round((day.totalBooked / day.totalCapacity) * 10000) / 100 : 0;
      });

      // Occupancy distribution
      const occupancyDistribution = {
        full: occupancyData.filter(d => d.occupancyRate >= 100).length,
        high: occupancyData.filter(d => d.occupancyRate >= 80 && d.occupancyRate < 100).length,
        medium: occupancyData.filter(d => d.occupancyRate >= 50 && d.occupancyRate < 80).length,
        low: occupancyData.filter(d => d.occupancyRate < 50).length
      };

      return NextResponse.json({
        summary: {
          totalDepartures: departures.length,
          totalCapacity,
          totalBooked,
          overallOccupancyRate: Math.round(overallOccupancyRate * 100) / 100,
          period: `${startDate} to ${endDate}`
        },
        occupancyData,
        routeOccupancy: Object.values(routeOccupancy)
          .sort((a: any, b: any) => b.occupancyRate - a.occupancyRate),
        timeSlotOccupancy: Object.values(timeSlotOccupancy)
          .sort((a: any, b: any) => b.occupancyRate - a.occupancyRate),
        dailyOccupancy: Object.values(dailyOccupancy)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        occupancyDistribution
      });

    } catch (error) {
      console.error('Occupancy report error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, 'ADMIN');
}