#!/usr/bin/env node

/**
 * Make November departures available for booking by setting bookedSeats = 0
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeNovemberAvailable() {
  try {
    console.log('🔧 Making November 2025 departures available for booking...\n');

    // Update all November 2025 departures to be available
    const startDate = new Date('2025-11-01'); // November 1, 2025
    const endDate = new Date('2025-11-30');   // November 30, 2025
    
    console.log(`Updating departures from ${startDate.toDateString()} to ${endDate.toDateString()}`);
    
    // Find all departures in November 2025
    const novemberDepartures = await prisma.departure.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
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

    console.log(`Found ${novemberDepartures.length} departures in November 2025`);

    // Update them to be available (bookedSeats = 0)
    const updateResult = await prisma.departure.updateMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      data: {
        bookedSeats: 0 // Make available for booking
      }
    });

    console.log(`✅ Updated ${updateResult.count} departures to be available for booking`);
    
    // Verify November 6 specifically
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
    
    console.log(`\n✅ Verification for November 6, 2025 (${nov6Departures.length} departures):`);
    nov6Departures.forEach(dep => {
      const available = dep.capacity - dep.bookedSeats;
      console.log(`  - ${dep.schedule.route.name} at ${dep.schedule.time}: ${available} of ${dep.capacity} seats available`);
    });

    console.log(`\n🎯 SUCCESS! November departures are now available for reservations`);
    console.log(`📅 Customers can now book trips starting November 1, 2025`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
makeNovemberAvailable();