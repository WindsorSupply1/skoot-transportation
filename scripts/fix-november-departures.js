#!/usr/bin/env node

/**
 * Fix November departures - generate available departures for November 2025
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNovemberDepartures() {
  try {
    console.log('🔧 Fixing November 2025 departures...\n');

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

    // Generate departures for November 2025
    const startDate = new Date('2025-11-01'); // November 1, 2025
    const endDate = new Date('2025-11-30');   // November 30, 2025
    
    console.log(`Generating departures from ${startDate.toDateString()} to ${endDate.toDateString()}`);
    
    const departuresToCreate = [];
    const currentDate = new Date(startDate);

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
            
            console.log(`  📅 Will create: ${schedule.route.name} on ${currentDate.toDateString()} at ${schedule.time}`);
          } else {
            console.log(`  ✅ Already exists: ${schedule.route.name} on ${currentDate.toDateString()} at ${schedule.time}`);
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`\n📅 Creating ${departuresToCreate.length} available departures for November...`);

    if (departuresToCreate.length === 0) {
      console.log('✅ All November departures already exist!');
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

    console.log(`\n🎉 Successfully created ${totalCreated} departures for November 2025!`);
    console.log(`🎯 November departures are now AVAILABLE for booking`);
    
    // Verify a specific date
    const nov6Departures = await prisma.departure.findMany({
      where: {
        date: {
          gte: new Date('2025-11-06'),
          lt: new Date('2025-11-07')
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
    
    console.log(`\n✅ Verification: Found ${nov6Departures.length} departures for November 6, 2025:`);
    nov6Departures.forEach(dep => {
      console.log(`  - ${dep.schedule.route.name} at ${dep.schedule.time}: ${dep.capacity - dep.bookedSeats} seats available`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixNovemberDepartures();