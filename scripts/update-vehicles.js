const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateVehicles() {
  try {
    console.log('🚐 Updating vehicle system...');

    // Get all existing vehicles
    const existingVehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${existingVehicles.length} existing vehicles`);

    // Update existing vehicles to new naming convention and 12 seats
    for (let i = 0; i < existingVehicles.length; i++) {
      const vehicle = existingVehicles[i];
      const newName = `VAN-C${i + 1}`;
      
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          name: newName,
          capacity: 12,
          priceMultiplier: 1.0, // Standard pricing
          isActive: true
        }
      });
      
      console.log(`✅ Updated ${vehicle.name} → ${newName} (12 seats)`);
    }

    // Create additional vehicles if needed (ensure we have at least 6 vans)
    const targetVehicleCount = 6;
    const currentCount = existingVehicles.length;
    
    if (currentCount < targetVehicleCount) {
      for (let i = currentCount; i < targetVehicleCount; i++) {
        const newVehicle = await prisma.vehicle.create({
          data: {
            name: `VAN-C${i + 1}`,
            capacity: 12,
            priceMultiplier: 1.0,
            isActive: true
          }
        });
        
        console.log(`✅ Created ${newVehicle.name} (12 seats)`);
      }
    }

    // Create premium and economy options
    const specialVehicles = [
      {
        name: 'VAN-P1',
        capacity: 12,
        priceMultiplier: 1.3, // +30% Premium
        isActive: true
      },
      {
        name: 'VAN-E1', 
        capacity: 12,
        priceMultiplier: 0.9, // -10% Economy
        isActive: true
      }
    ];

    for (const vehicleData of specialVehicles) {
      // Check if this vehicle already exists
      const existing = await prisma.vehicle.findFirst({
        where: { name: vehicleData.name }
      });

      if (!existing) {
        const newVehicle = await prisma.vehicle.create({
          data: vehicleData
        });
        console.log(`✅ Created ${newVehicle.name} (${vehicleData.priceMultiplier === 1.3 ? 'Premium' : 'Economy'})`);
      } else {
        await prisma.vehicle.update({
          where: { id: existing.id },
          data: {
            capacity: 12,
            priceMultiplier: vehicleData.priceMultiplier
          }
        });
        console.log(`✅ Updated ${existing.name} (${vehicleData.priceMultiplier === 1.3 ? 'Premium' : 'Economy'})`);
      }
    }

    // Update all departures to have 12 seat capacity
    const updatedDepartures = await prisma.departure.updateMany({
      data: {
        capacity: 12
      }
    });

    console.log(`✅ Updated ${updatedDepartures.count} departures to 12 seat capacity`);

    // Get final vehicle list
    const finalVehicles = await prisma.vehicle.findMany({
      orderBy: { name: 'asc' }
    });

    console.log('\n🎉 Vehicle system updated successfully!');
    console.log('\nFinal vehicle list:');
    finalVehicles.forEach(vehicle => {
      const priceType = vehicle.priceMultiplier === 1.0 ? 'Standard' : 
                       vehicle.priceMultiplier > 1.0 ? `+${Math.round((vehicle.priceMultiplier - 1) * 100)}% Premium` :
                       `-${Math.round((1 - vehicle.priceMultiplier) * 100)}% Discount`;
      console.log(`  ${vehicle.name}: ${vehicle.capacity} seats, ${priceType}`);
    });

  } catch (error) {
    console.error('❌ Error updating vehicles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVehicles();