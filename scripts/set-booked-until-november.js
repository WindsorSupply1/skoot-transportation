#!/usr/bin/env node

/**
 * Script to make all departures appear fully booked until November 1, 2025
 * This allows taking reservations today for November 1+ departures
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setBookedUntilNovember() {
  try {
    console.log('🚌 Setting all departures as fully booked until November 1, 2025...\n');

    // Define date range
    const startDate = new Date(); // Today
    const endDate = new Date('2025-11-01'); // November 1, 2025
    
    console.log(`Date range: ${startDate.toDateString()} to ${endDate.toDateString()}`);

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

    const departuresToCreate = [];
    const currentDate = new Date(startDate);

    // Generate departures for each day until November 1, 2025
    while (currentDate < endDate) {
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
            // Create fully booked departure
            departuresToCreate.push({
              scheduleId: schedule.id,
              date: new Date(currentDate),
              capacity: schedule.capacity || 15,
              bookedSeats: schedule.capacity || 15, // Set as fully booked
              status: 'SCHEDULED'
            });
          } else {
            // Update existing departure to be fully booked
            await prisma.departure.update({
              where: { id: existingDeparture.id },
              data: {
                bookedSeats: existingDeparture.capacity
              }
            });
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`\n📅 Creating ${departuresToCreate.length} fully booked departures...`);

    // Create departures in batches to avoid timeout
    const batchSize = 100;
    let totalCreated = 0;

    for (let i = 0; i < departuresToCreate.length; i += batchSize) {
      const batch = departuresToCreate.slice(i, i + batchSize);
      
      try {
        await prisma.departure.createMany({
          data: batch,
          skipDuplicates: true
        });
        totalCreated += batch.length;
        console.log(`✅ Created batch ${Math.floor(i / batchSize) + 1}: ${batch.length} departures`);
      } catch (error) {
        console.error(`❌ Error creating batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully processed departures!`);
    console.log(`📊 Total departures created: ${totalCreated}`);
    console.log(`📅 All departures until November 1, 2025 are now marked as FULLY BOOKED`);
    
    // Now generate available departures starting November 1, 2025
    console.log(`\n🆕 Generating available departures starting November 1, 2025...`);
    
    const availableStartDate = new Date('2025-11-01');
    const availableEndDate = new Date('2025-12-31'); // Generate through end of 2025
    
    const availableDepartures = [];
    const availableCurrentDate = new Date(availableStartDate);

    while (availableCurrentDate <= availableEndDate) {
      const dayOfWeek = availableCurrentDate.getDay();
      
      for (const schedule of schedules) {
        if (schedule.dayOfWeek === dayOfWeek) {
          const existingDeparture = await prisma.departure.findFirst({
            where: {
              scheduleId: schedule.id,
              date: {
                gte: new Date(availableCurrentDate.getFullYear(), availableCurrentDate.getMonth(), availableCurrentDate.getDate()),
                lt: new Date(availableCurrentDate.getFullYear(), availableCurrentDate.getMonth(), availableCurrentDate.getDate() + 1)
              }
            }
          });

          if (!existingDeparture) {
            availableDepartures.push({
              scheduleId: schedule.id,
              date: new Date(availableCurrentDate),
              capacity: schedule.capacity || 15,
              bookedSeats: 0, // Available for booking
              status: 'SCHEDULED'
            });
          }
        }
      }

      availableCurrentDate.setDate(availableCurrentDate.getDate() + 1);
    }

    // Create available departures
    let availableCreated = 0;
    for (let i = 0; i < availableDepartures.length; i += batchSize) {
      const batch = availableDepartures.slice(i, i + batchSize);
      
      try {
        await prisma.departure.createMany({
          data: batch,
          skipDuplicates: true
        });
        availableCreated += batch.length;
      } catch (error) {
        console.error(`❌ Error creating available departures:`, error.message);
      }
    }

    console.log(`✅ Created ${availableCreated} available departures starting November 1, 2025`);
    
    console.log(`\n🎯 SUMMARY:`);
    console.log(`• All departures until November 1, 2025: FULLY BOOKED (appears busy)`);
    console.log(`• Departures from November 1, 2025 onwards: AVAILABLE for reservations`);
    console.log(`• Customers can make reservations TODAY for November 1+ trips`);
    console.log(`• Service officially starts November 1, 2025`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
setBookedUntilNovember();