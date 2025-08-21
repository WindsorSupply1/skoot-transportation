const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDepartures() {
  try {
    console.log('🔧 Fixing departure structure...');

    // Get all schedules
    const schedules = await prisma.schedule.findMany({
      include: {
        route: true
      }
    });

    console.log(`Found ${schedules.length} schedules`);

    // Get all vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true, name: { startsWith: 'VAN-C' } }, // Only standard vans
      orderBy: { name: 'asc' }
    });

    console.log(`Found ${vehicles.length} standard vehicles`);

    // For the next 30 days, ensure each schedule has exactly one departure per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + dayOffset);
      
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      console.log(`\n📅 Processing ${currentDate.toDateString()} (day ${dayOfWeek})`);

      // Get schedules for this day of week
      const daySchedules = schedules.filter(schedule => schedule.dayOfWeek === dayOfWeek);
      
      for (let i = 0; i < daySchedules.length; i++) {
        const schedule = daySchedules[i];
        
        // Check if departure already exists for this schedule and date
        const existingDepartures = await prisma.departure.findMany({
          where: {
            scheduleId: schedule.id,
            date: {
              gte: currentDate,
              lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000) // Same day
            }
          },
          include: {
            bookings: true
          }
        });

        if (existingDepartures.length === 0) {
          // Create new departure with assigned vehicle
          const assignedVehicle = vehicles[i % vehicles.length]; // Rotate through vehicles
          
          const newDeparture = await prisma.departure.create({
            data: {
              scheduleId: schedule.id,
              vehicleId: assignedVehicle.id,
              date: currentDate,
              capacity: 12,
              bookedSeats: 0,
              status: 'SCHEDULED'
            }
          });

          console.log(`  ✅ Created departure: ${schedule.route.origin} → ${schedule.route.destination} at ${schedule.time} (${assignedVehicle.name})`);
          
        } else if (existingDepartures.length === 1) {
          // Update existing departure to ensure it has a vehicle
          const departure = existingDepartures[0];
          
          if (!departure.vehicleId) {
            const assignedVehicle = vehicles[i % vehicles.length];
            
            await prisma.departure.update({
              where: { id: departure.id },
              data: {
                vehicleId: assignedVehicle.id,
                capacity: 12
              }
            });

            console.log(`  🔄 Assigned vehicle ${assignedVehicle.name} to existing departure`);
          } else {
            console.log(`  ✓ Departure already has vehicle assigned`);
          }
          
        } else {
          // Multiple departures exist - consolidate them
          console.log(`  ⚠️  Found ${existingDepartures.length} departures for same schedule/date - consolidating...`);
          
          // Keep the first departure, move all bookings to it, delete others
          const primaryDeparture = existingDepartures[0];
          const duplicateDepartures = existingDepartures.slice(1);
          
          // Move all bookings to primary departure
          let totalBookedSeats = 0;
          for (const duplicate of duplicateDepartures) {
            await prisma.booking.updateMany({
              where: { departureId: duplicate.id },
              data: { departureId: primaryDeparture.id }
            });
            
            totalBookedSeats += duplicate.bookedSeats;
          }
          
          // Update primary departure
          const assignedVehicle = vehicles[i % vehicles.length];
          await prisma.departure.update({
            where: { id: primaryDeparture.id },
            data: {
              vehicleId: assignedVehicle.id,
              capacity: 12,
              bookedSeats: primaryDeparture.bookedSeats + totalBookedSeats
            }
          });
          
          // Delete duplicate departures
          for (const duplicate of duplicateDepartures) {
            await prisma.departure.delete({
              where: { id: duplicate.id }
            });
          }
          
          console.log(`  ✅ Consolidated into single departure with ${assignedVehicle.name}`);
        }
      }
    }

    console.log('\n🎉 Departure structure fixed successfully!');
    
    // Summary
    const totalDepartures = await prisma.departure.count();
    const departuresWithVehicles = await prisma.departure.count({
      where: { vehicleId: { not: null } }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total departures: ${totalDepartures}`);
    console.log(`  Departures with vehicles: ${departuresWithVehicles}`);
    console.log(`  Unassigned departures: ${totalDepartures - departuresWithVehicles}`);

  } catch (error) {
    console.error('❌ Error fixing departures:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDepartures();