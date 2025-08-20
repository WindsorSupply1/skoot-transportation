#!/usr/bin/env node

/**
 * Initialize default vehicles for the fleet
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeVehicles() {
  try {
    console.log('🚐 Initializing default vehicles...\n');

    // Default vehicles with different pricing tiers
    const defaultVehicles = [
      {
        name: 'Van A',
        capacity: 15,
        priceMultiplier: 1.0, // Standard pricing
        isActive: true
      },
      {
        name: 'Van B', 
        capacity: 15,
        priceMultiplier: 1.0, // Standard pricing
        isActive: true
      },
      {
        name: 'Premium Coach',
        capacity: 12,
        priceMultiplier: 1.2, // +20% premium
        isActive: true
      },
      {
        name: 'Luxury Van',
        capacity: 8,
        priceMultiplier: 1.3, // +30% ultra premium
        isActive: true
      },
      {
        name: 'Economy Shuttle',
        capacity: 20,
        priceMultiplier: 0.9, // -10% discount
        isActive: true
      }
    ];

    // Check if vehicles already exist
    const existingVehicles = await prisma.vehicle.findMany();
    
    if (existingVehicles.length > 0) {
      console.log(`Found ${existingVehicles.length} existing vehicles:`);
      existingVehicles.forEach(vehicle => {
        const priceDisplay = vehicle.priceMultiplier === 1.0 ? 'Standard' : 
                           vehicle.priceMultiplier > 1.0 ? `+${Math.round((vehicle.priceMultiplier - 1) * 100)}% Premium` :
                           `${Math.round((vehicle.priceMultiplier - 1) * 100)}% Discount`;
        console.log(`  - ${vehicle.name}: ${vehicle.capacity} seats, ${priceDisplay} (${vehicle.isActive ? 'Active' : 'Inactive'})`);
      });
      console.log('\n✅ Vehicles already exist. Skipping initialization.');
      return;
    }

    // Create default vehicles
    console.log('Creating default vehicles...');
    
    for (const vehicleData of defaultVehicles) {
      const vehicle = await prisma.vehicle.create({
        data: vehicleData
      });
      
      const priceDisplay = vehicle.priceMultiplier === 1.0 ? 'Standard' : 
                         vehicle.priceMultiplier > 1.0 ? `+${Math.round((vehicle.priceMultiplier - 1) * 100)}% Premium` :
                         `${Math.round((vehicle.priceMultiplier - 1) * 100)}% Discount`;
      
      console.log(`  ✅ Created: ${vehicle.name} - ${vehicle.capacity} seats, ${priceDisplay}`);
    }

    console.log('\n🎉 Vehicle initialization complete!');
    console.log('\n📋 Next Steps:');
    console.log('• Visit https://skoot.bike/admin/vehicles to manage your fleet');
    console.log('• Assign vehicles to specific departures for custom pricing');
    console.log('• Edit vehicle price multipliers anytime');
    console.log('\n💡 How Vehicle Pricing Works:');
    console.log('• Standard (1.0): Base price × 1.0 = $35');
    console.log('• Premium (+20%): Base price × 1.2 = $42');
    console.log('• Ultra Premium (+30%): Base price × 1.3 = $45.50');
    console.log('• Economy (-10%): Base price × 0.9 = $31.50');

  } catch (error) {
    console.error('❌ Error initializing vehicles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
initializeVehicles();