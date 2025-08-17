import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      console.log('Starting departure generation...');

      // Get all active schedules
      const schedules = await prisma.schedule.findMany({
        where: {
          isActive: true
        },
        include: {
          route: true
        }
      });

      if (schedules.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No active schedules found. Please create schedules first.'
        }, { status: 400 });
      }

      // Generate departures for the next 30 days
      const departures = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);
        
        // Get day of week (0=Sunday, 1=Monday, etc)
        const dayOfWeek = date.getDay();
        // Convert to database format (1=Monday, 7=Sunday)
        const dbDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

        // Find schedules for this day of week
        const daySchedules = schedules.filter(s => {
          // If schedule doesn't have dayOfWeek, assume it runs every day
          return !s.dayOfWeek || s.dayOfWeek === dbDayOfWeek;
        });

        for (const schedule of daySchedules) {
          // Check if departure already exists
          const existingDeparture = await prisma.departure.findFirst({
            where: {
              scheduleId: schedule.id,
              date: {
                gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
              }
            }
          });

          if (!existingDeparture) {
            const departure = await prisma.departure.create({
              data: {
                scheduleId: schedule.id,
                date: date,
                capacity: 20, // Default capacity since column doesn't exist yet
                bookedSeats: 0,
                status: 'SCHEDULED',
              }
            });
            departures.push(departure);
          }
        }
      }

      console.log(`Created ${departures.length} departures`);

      return NextResponse.json({
        success: true,
        message: `Generated ${departures.length} departures for the next 30 days`,
        data: {
          schedulesProcessed: schedules.length,
          departuresCreated: departures.length,
          dateRange: {
            from: today.toISOString(),
            to: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Departure generation error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate departures',
        details: error instanceof Error ? error.stack : 'Unknown error'
      }, { status: 500 });
    }
  }, true);
}