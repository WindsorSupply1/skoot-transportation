const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCharlestonSchedule() {
  try {
    console.log('🕐 Fixing Charleston departure schedule...');

    // Get all routes and schedules
    const routes = await prisma.route.findMany();
    const schedules = await prisma.schedule.findMany({
      include: {
        route: true
      }
    });

    console.log(`Found ${routes.length} routes and ${schedules.length} schedules`);

    // Find Charleston → Columbia routes (these should not start at 6:00 AM)
    const charlestonRoutes = routes.filter(route => 
      route.origin.toLowerCase().includes('charleston') || 
      route.origin.toLowerCase().includes('airport')
    );

    console.log('\nCharleston origin routes:');
    charlestonRoutes.forEach(route => {
      console.log(`  ${route.name}: ${route.origin} → ${route.destination}`);
    });

    // Find and remove/update early Charleston departures (before 8:00 AM)
    for (const route of charlestonRoutes) {
      const routeSchedules = schedules.filter(s => s.routeId === route.id);
      
      console.log(`\nChecking schedules for ${route.name}:`);
      
      for (const schedule of routeSchedules) {
        const [hours, minutes] = schedule.time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        const eightAM = 8 * 60; // 8:00 AM in minutes
        
        if (timeInMinutes < eightAM) {
          console.log(`  ❌ Removing ${schedule.time} departure (too early for Charleston)`);
          
          // Delete associated departures first
          const deletedDepartures = await prisma.departure.deleteMany({
            where: { scheduleId: schedule.id }
          });
          
          console.log(`    Deleted ${deletedDepartures.count} departures`);
          
          // Delete the schedule
          await prisma.schedule.delete({
            where: { id: schedule.id }
          });
          
          console.log(`    Deleted schedule`);
          
        } else {
          console.log(`  ✅ Keeping ${schedule.time} departure (8:00 AM or later)`);
        }
      }
    }

    // Ensure we have good Charleston departure times starting at 8:00 AM
    const goodCharlestonTimes = [
      '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'
    ];

    for (const route of charlestonRoutes) {
      console.log(`\nEnsuring good departure times for ${route.name}:`);
      
      for (const time of goodCharlestonTimes) {
        // Check each day of the week (1-7, Monday to Sunday)
        for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
          const existingSchedule = await prisma.schedule.findFirst({
            where: {
              routeId: route.id,
              time: time,
              dayOfWeek: dayOfWeek
            }
          });

          if (!existingSchedule) {
            const newSchedule = await prisma.schedule.create({
              data: {
                routeId: route.id,
                time: time,
                dayOfWeek: dayOfWeek,
                capacity: 12,
                isActive: true
              }
            });
            
            console.log(`    ✅ Created ${time} departure for day ${dayOfWeek}`);
          }
        }
      }
    }

    // Also ensure Columbia has early departures (6:00 AM onwards)
    const columbiaRoutes = routes.filter(route => 
      route.origin.toLowerCase().includes('columbia')
    );

    console.log('\nColumbia origin routes:');
    columbiaRoutes.forEach(route => {
      console.log(`  ${route.name}: ${route.origin} → ${route.destination}`);
    });

    const goodColumbiaTimes = [
      '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'
    ];

    for (const route of columbiaRoutes) {
      console.log(`\nEnsuring good departure times for ${route.name}:`);
      
      for (const time of goodColumbiaTimes) {
        // Check each day of the week (1-7, Monday to Sunday)
        for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
          const existingSchedule = await prisma.schedule.findFirst({
            where: {
              routeId: route.id,
              time: time,
              dayOfWeek: dayOfWeek
            }
          });

          if (!existingSchedule) {
            const newSchedule = await prisma.schedule.create({
              data: {
                routeId: route.id,
                time: time,
                dayOfWeek: dayOfWeek,
                capacity: 12,
                isActive: true
              }
            });
            
            console.log(`    ✅ Created ${time} departure for day ${dayOfWeek}`);
          }
        }
      }
    }

    console.log('\n🎉 Charleston schedule fixed successfully!');
    
    // Summary
    const finalSchedules = await prisma.schedule.findMany({
      include: { route: true },
      orderBy: [
        { route: { origin: 'asc' } },
        { time: 'asc' }
      ]
    });

    console.log('\n📊 Final schedule summary:');
    const schedulesByRoute = {};
    
    finalSchedules.forEach(schedule => {
      const routeKey = `${schedule.route.origin} → ${schedule.route.destination}`;
      if (!schedulesByRoute[routeKey]) {
        schedulesByRoute[routeKey] = [];
      }
      schedulesByRoute[routeKey].push(schedule.time);
    });

    Object.entries(schedulesByRoute).forEach(([route, times]) => {
      const uniqueTimes = [...new Set(times)].sort();
      console.log(`  ${route}: ${uniqueTimes.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error fixing Charleston schedule:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCharlestonSchedule();