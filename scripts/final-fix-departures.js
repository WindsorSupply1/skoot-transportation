#!/usr/bin/env node

/**
 * FINAL FIX: Reset all departures to be bookable with consistent 12-seat capacity
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalFixDepartures() {
  try {
    console.log('🚀 FINAL FIX: Making all departures bookable with 12 seats');
    console.log('=========================================================\n');

    // Update ALL departures to have 12 seats and 0 booked (fully available)
    const updateResult = await prisma.departure.updateMany({
      data: {
        capacity: 12,
        bookedSeats: 0  // All seats available
      }
    });

    console.log(`✅ Updated ${updateResult.count} departures`);
    console.log('   - Set capacity to 12 seats per van');
    console.log('   - Set bookedSeats to 0 (all available)');

    // Verify today's departures
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDepartures = await prisma.departure.findMany({
      where: {
        date: { gte: today, lt: tomorrow }
      },
      include: {
        schedule: {
          include: { route: true }
        }
      },
      orderBy: { schedule: { time: 'asc' } }
    });

    console.log(`\n📅 Today (${today.toDateString()}) - ${todayDepartures.length} departures:`);
    
    const summary = {};
    todayDepartures.forEach(dep => {
      const route = dep.schedule.route.name;
      const time = dep.schedule.time;
      const available = dep.capacity - dep.bookedSeats;
      
      if (!summary[route]) summary[route] = [];
      summary[route].push({ time, available, capacity: dep.capacity });
    });

    Object.keys(summary).forEach(route => {
      console.log(`\n  ${route}:`);
      summary[route].forEach(dep => {
        console.log(`    ${dep.time}: ${dep.available} of ${dep.capacity} seats available`);
      });
    });

    // Verify November 1, 2025
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
      },
      orderBy: { schedule: { time: 'asc' } }
    });

    console.log(`\n📅 November 1, 2025 - ${nov1.length} departures:`);
    
    const nov1Summary = {};
    nov1.forEach(dep => {
      const route = dep.schedule.route.name;
      const time = dep.schedule.time;
      const available = dep.capacity - dep.bookedSeats;
      
      if (!nov1Summary[route]) nov1Summary[route] = [];
      nov1Summary[route].push({ time, available, capacity: dep.capacity });
    });

    Object.keys(nov1Summary).forEach(route => {
      console.log(`\n  ${route}:`);
      nov1Summary[route].forEach(dep => {
        console.log(`    ${dep.time}: ${dep.available} of ${dep.capacity} seats available`);
      });
    });

    const totalAvailable = nov1.reduce((sum, dep) => sum + (dep.capacity - dep.bookedSeats), 0);
    console.log(`\n📊 Total seats available November 1st: ${totalAvailable}`);

    console.log('\n🎯 SUCCESS! All departures are now bookable:');
    console.log('✅ Every departure has 12 seats available');
    console.log('✅ No blocked dates - customers can book any day');
    console.log('✅ Consistent capacity across all vans');
    console.log('✅ Ready for customer bookings immediately');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalFixDepartures();