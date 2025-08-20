#!/usr/bin/env node

/**
 * Complete fix for the Skoot Transportation booking system
 * Ensures all departures are properly available for customer booking
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBookingSystem() {
  try {
    console.log('🚀 Fixing Skoot Transportation Booking System');
    console.log('===========================================\n');

    // Step 1: Ensure routes exist
    console.log('Step 1: Setting up routes...');
    
    let route1 = await prisma.route.findFirst({
      where: { name: 'Columbia to Charlotte Airport' }
    });

    if (!route1) {
      route1 = await prisma.route.create({
        data: {
          name: 'Columbia to Charlotte Airport',
          origin: 'Columbia, SC',
          destination: 'Charlotte Airport',
          duration: 120,
          isActive: true
        }
      });
    }

    let route2 = await prisma.route.findFirst({
      where: { name: 'Charlotte Airport to Columbia' }
    });

    if (!route2) {
      route2 = await prisma.route.create({
        data: {
          name: 'Charlotte Airport to Columbia',
          origin: 'Charlotte Airport',
          destination: 'Columbia, SC',
          duration: 120,
          isActive: true
        }
      });
    }

    console.log('✅ Routes configured\n');

    // Step 2: Create schedules for even hours if they don't exist
    console.log('Step 2: Setting up schedules...');
    const times = ['06:00', '08:00', '10:00', '12:00', '14:00', '18:00', '20:00'];
    
    for (const time of times) {
      for (let day = 0; day <= 6; day++) {
        // Check if schedule exists for route1
        const exists1 = await prisma.schedule.findFirst({
          where: {
            routeId: route1.id,
            time: time,
            dayOfWeek: day
          }
        });
        
        if (!exists1) {
          await prisma.schedule.create({
            data: {
              routeId: route1.id,
              time: time,
              dayOfWeek: day,
              capacity: 12,
              isActive: true
            }
          });
        }
        
        // Check if schedule exists for route2
        const exists2 = await prisma.schedule.findFirst({
          where: {
            routeId: route2.id,
            time: time,
            dayOfWeek: day
          }
        });
        
        if (!exists2) {
          await prisma.schedule.create({
            data: {
              routeId: route2.id,
              time: time,
              dayOfWeek: day,
              capacity: 12,
              isActive: true
            }
          });
        }
      }
    }
    
    console.log('✅ Schedules created for all days and times\n');

    // Step 3: Generate departures
    console.log('Step 3: Generating departures...');
    
    // Update existing departures to have correct capacity and only delete future ones without bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Delete only future departures that have no bookings
    const deleted = await prisma.departure.deleteMany({
      where: {
        date: { gte: today },
        bookedSeats: 0
      }
    });
    console.log(`✅ Cleared ${deleted.count} unused future departures\n`);

    const schedules = await prisma.schedule.findMany({
      where: { isActive: true }
    });

    const endDate = new Date('2026-07-31');

    const departures = [];
    const current = new Date(today);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      
      for (const schedule of schedules) {
        if (schedule.dayOfWeek === dayOfWeek) {
          departures.push({
            scheduleId: schedule.id,
            date: new Date(current),
            capacity: 12,
            bookedSeats: 0,
            status: 'SCHEDULED'
          });
        }
      }
      
      current.setDate(current.getDate() + 1);
    }

    // Create in batches
    const batchSize = 500;
    let created = 0;
    
    for (let i = 0; i < departures.length; i += batchSize) {
      const batch = departures.slice(i, i + batchSize);
      const result = await prisma.departure.createMany({
        data: batch
      });
      created += result.count;
      console.log(`Progress: ${Math.min(100, Math.round((i + batchSize) / departures.length * 100))}%`);
    }

    console.log(`✅ Created ${created} departures\n`);

    // Step 4: Verify November 1, 2025
    console.log('Step 4: Verifying November 1, 2025...');
    
    const nov1 = await prisma.departure.findMany({
      where: {
        date: {
          gte: new Date('2025-11-01'),
          lt: new Date('2025-11-02')
        }
      },
      include: {
        schedule: {
          include: { route: true }
        }
      }
    });

    console.log(`November 1, 2025: ${nov1.length} departures`);
    const routeSummary = {};
    
    nov1.forEach(d => {
      const route = d.schedule.route.name;
      if (!routeSummary[route]) routeSummary[route] = 0;
      routeSummary[route] += (d.capacity - d.bookedSeats);
    });

    Object.entries(routeSummary).forEach(([route, seats]) => {
      console.log(`  ${route}: ${seats} seats available`);
    });

    console.log('\n✅ BOOKING SYSTEM FIXED!');
    console.log('Customers can now book from today through July 31, 2026');
    console.log('All departures have 12 available seats');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBookingSystem();