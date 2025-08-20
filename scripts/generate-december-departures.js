#!/usr/bin/env node

/**
 * Generate available departures for December 2025 and beyond
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateDecemberDepartures() {
  try {
    console.log('🚌 Generating available departures for December 2025...\n');

    // Get all active schedules
    const schedules = await prisma.schedule.findMany({
      where: { isActive: true },
      include: {
        route: true
      }
    });

    console.log(`Found ${schedules.length} active schedules`);

    if (schedules.length === 0) {
      console.log('❌ No active schedules found. Please create schedules first.');
      return;
    }

    // Generate departures for December 2025 through March 2026
    const startDate = new Date('2025-12-01'); // December 1, 2025
    const endDate = new Date('2026-03-31');   // March 31, 2026
    
    console.log(`Generating departures from ${startDate.toDateString()} to ${endDate.toDateString()}`);
    
    const departuresToCreate = [];
    const currentDate = new Date(startDate);
    let dateCount = 0;

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      for (const schedule of schedules) {
        // Check if this schedule runs on this day of week
        if (schedule.dayOfWeek === dayOfWeek) {
          
          // Check if departure already exists
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
            departuresToCreate.push({
              scheduleId: schedule.id,
              date: new Date(currentDate),
              capacity: schedule.capacity || 15,
              bookedSeats: 0, // Available for booking
              status: 'SCHEDULED'
            });
            dateCount++;
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`\n📅 Creating ${departuresToCreate.length} available departures...`);

    if (departuresToCreate.length === 0) {
      console.log('✅ All departures already exist!');
      return;
    }

    // Create departures in batches
    const batchSize = 50;
    let totalCreated = 0;

    for (let i = 0; i < departuresToCreate.length; i += batchSize) {
      const batch = departuresToCreate.slice(i, i + batchSize);
      
      try {
        const result = await prisma.departure.createMany({
          data: batch,
          skipDuplicates: true
        });
        totalCreated += result.count;
        console.log(`✅ Created batch ${Math.floor(i / batchSize) + 1}: ${result.count} departures`);
      } catch (error) {
        console.error(`❌ Error creating batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${totalCreated} departures!`);
    
    // Verify December 12, 2025 specifically
    const dec12Departures = await prisma.departure.findMany({
      where: {
        date: {
          gte: new Date('2025-12-12'),
          lt: new Date('2025-12-13')
        }
      },
      include: {
        schedule: {
          include: {
            route: true
          }
        }
      }
    });
    
    console.log(`\n✅ Verification for December 12, 2025 (${dec12Departures.length} departures):`);
    dec12Departures.forEach(dep => {
      const available = dep.capacity - dep.bookedSeats;
      console.log(`  - ${dep.schedule.route.name} at ${dep.schedule.time}: ${available} of ${dep.capacity} seats available`);
    });

    console.log(`\n🎯 SUCCESS!`);
    console.log(`• December 2025 - March 2026 departures are AVAILABLE for booking`);
    console.log(`• Customers can make reservations for these dates`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateDecemberDepartures();