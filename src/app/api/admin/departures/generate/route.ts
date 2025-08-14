import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const {
        startDate,
        endDate,
        scheduleIds,
        capacity = 15
      } = await req.json();

      if (!startDate || !endDate) {
        return NextResponse.json({
          error: 'Start date and end date are required'
        }, { status: 400 });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return NextResponse.json({
          error: 'Start date must be before end date'
        }, { status: 400 });
      }

      // Get schedules to generate departures for
      const where: any = { isActive: true };
      if (scheduleIds && scheduleIds.length > 0) {
        where.id = { in: scheduleIds };
      }

      const schedules = await prisma.schedule.findMany({
        where,
        include: {
          route: {
            include: {
              origin: true,
              destination: true
            }
          }
        }
      });

      if (schedules.length === 0) {
        return NextResponse.json({
          error: 'No active schedules found'
        }, { status: 404 });
      }

      const departuresToCreate = [];
      const currentDate = new Date(start);

      // Generate departures for each day in the range
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        for (const schedule of schedules) {
          // Check if this schedule runs on this day of week
          if (schedule.daysOfWeek.includes(dayOfWeek)) {
            // Check if departure already exists for this date/schedule
            const existingDeparture = await prisma.departure.findFirst({
              where: {
                scheduleId: schedule.id,
                date: {
                  gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
                  lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
                }
              }
            });

            if (!existingDeparture) {
              // Calculate estimated arrival time
              const [hours, minutes] = schedule.departureTime.split(':').map(Number);
              const departureDateTime = new Date(currentDate);
              departureDateTime.setHours(hours, minutes, 0, 0);
              
              const estimatedArrival = new Date(departureDateTime);
              estimatedArrival.setMinutes(estimatedArrival.getMinutes() + schedule.route.estimatedDuration);

              const arrivalTimeString = estimatedArrival.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });

              departuresToCreate.push({
                scheduleId: schedule.id,
                date: new Date(currentDate),
                capacity,
                estimatedArrival: `${arrivalTimeString}`,
                isActive: true,
                notes: `Auto-generated departure for ${schedule.route.name}`
              });
            }
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Create departures in batches
      const createdDepartures = [];
      const batchSize = 50;

      for (let i = 0; i < departuresToCreate.length; i += batchSize) {
        const batch = departuresToCreate.slice(i, i + batchSize);
        const batchResult = await prisma.departure.createMany({
          data: batch,
          skipDuplicates: true
        });
        createdDepartures.push(...batch);
      }

      return NextResponse.json({
        message: `Successfully generated ${createdDepartures.length} departures`,
        departures: createdDepartures.length,
        dateRange: {
          start: startDate,
          end: endDate
        },
        schedulesProcessed: schedules.length
      });

    } catch (error) {
      console.error('Departure generation error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, 'ADMIN');
}