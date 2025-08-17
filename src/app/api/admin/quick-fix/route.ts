import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      console.log('Starting quick fix departure generation...');

      // Get all schedules using raw query to avoid schema issues
      const schedules = await prisma.$queryRaw`
        SELECT id, "routeId", "dayOfWeek", time 
        FROM schedules 
        WHERE "isActive" = true
      ` as any[];

      if (!schedules || schedules.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No schedules found'
        });
      }

      // Create departures for the next 14 days
      const departures = [];
      const today = new Date();
      
      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);
        date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
        
        const dayOfWeek = date.getDay();
        const dbDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
        
        // Find matching schedules for this day
        const matchingSchedules = schedules.filter(s => 
          s.dayOfWeek === dbDayOfWeek || s.dayOfWeek === 0
        );
        
        for (const schedule of matchingSchedules) {
          try {
            // Check if departure already exists
            const existing = await prisma.departure.findFirst({
              where: {
                scheduleId: schedule.id,
                date: {
                  gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                  lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                }
              }
            });
            
            if (!existing) {
              const departure = await prisma.departure.create({
                data: {
                  scheduleId: schedule.id,
                  date: date,
                  capacity: 20,
                  bookedSeats: 0,
                  status: 'SCHEDULED'
                }
              });
              departures.push(departure);
            }
          } catch (err) {
            console.error('Error creating departure:', err);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Created ${departures.length} departures successfully!`,
        data: {
          schedulesProcessed: schedules.length,
          departuresCreated: departures.length,
          daysGenerated: 14
        }
      });

    } catch (error) {
      console.error('Quick fix error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate departures'
      }, { status: 500 });
    }
  }, true);
}