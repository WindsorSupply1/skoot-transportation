import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProductionData() {
  try {
    console.log('🔧 Checking and fixing production data...');

    // Check if we have any routes
    let route = await prisma.route.findFirst();
    
    if (!route) {
      console.log('📍 Creating default route...');
      route = await prisma.route.create({
        data: {
          name: 'Columbia to Charlotte Airport',
          origin: 'Columbia, SC',
          destination: 'Charlotte Douglas International Airport',
          duration: 120,
          isActive: true,
        }
      });
    }

    // Check if we have locations
    const locationsCount = await prisma.location.count();
    
    if (locationsCount === 0) {
      console.log('📍 Creating locations...');
      
      await prisma.location.createMany({
        data: [
          {
            name: 'Downtown Columbia - Hotel Trundle',
            address: '1224 Main Street',
            city: 'Columbia',
            state: 'SC',
            zipCode: '29201',
            isPickup: true,
            isDropoff: false,
            sortOrder: 1,
          },
          {
            name: 'Columbia - Parklane Road',
            address: '7501 Parklane Rd',
            city: 'Columbia',
            state: 'SC',
            zipCode: '29223',
            isPickup: true,
            isDropoff: false,
            sortOrder: 2,
          },
          {
            name: 'Charlotte Douglas International Airport',
            address: '5501 Josh Birmingham Pkwy',
            city: 'Charlotte',
            state: 'NC',
            zipCode: '28208',
            isPickup: false,
            isDropoff: true,
            sortOrder: 3,
          }
        ]
      });
    }

    // Check if we have schedules
    const schedulesCount = await prisma.schedule.count();
    
    if (schedulesCount === 0) {
      console.log('📅 Creating schedules...');
      
      const times = ['06:00', '08:00', '10:00', '14:00', '16:00', '18:00', '20:00'];
      
      for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
        for (const time of times) {
          await prisma.schedule.create({
            data: {
              routeId: route.id,
              dayOfWeek,
              time,
              capacity: 15,
              isActive: true,
            }
          });
        }
      }
    }

    // Check if we have departures for the next 30 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const existingDepartures = await prisma.departure.count({
      where: {
        date: {
          gte: today,
          lte: thirtyDaysFromNow
        }
      }
    });

    if (existingDepartures === 0) {
      console.log('🚌 Creating departures for the next 30 days...');
      
      const schedules = await prisma.schedule.findMany({
        where: { isActive: true }
      });

      for (let d = 0; d < 30; d++) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + d);
        const dayOfWeek = currentDate.getDay();
        
        const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);
        
        for (const schedule of daySchedules) {
          const [hours, minutes] = schedule.time.split(':');
          const departureDate = new Date(currentDate);
          departureDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          // Only create future departures
          if (departureDate > new Date()) {
            await prisma.departure.create({
              data: {
                scheduleId: schedule.id,
                date: departureDate,
                capacity: schedule.capacity,
                bookedSeats: 0,
                status: 'SCHEDULED',
              }
            });
          }
        }
      }
    }

    // Check pricing tiers
    const pricingCount = await prisma.pricingTier.count();
    
    if (pricingCount === 0) {
      console.log('💰 Creating pricing tiers...');
      
      await prisma.pricingTier.createMany({
        data: [
          {
            name: 'First 100 Customer Rate',
            customerType: 'LEGACY',
            basePrice: 31.00,
            description: 'Special rate for our first 100 customers - locked in forever!',
            isActive: true,
          },
          {
            name: 'Regular',
            customerType: 'REGULAR',
            basePrice: 35.00,
            description: 'Standard one-way fare',
            isActive: true,
          },
          {
            name: 'Student',
            customerType: 'STUDENT',
            basePrice: 32.00,
            description: 'Discounted rate for students with valid ID',
            isActive: true,
          },
          {
            name: 'Military',
            customerType: 'MILITARY',
            basePrice: 32.00,
            description: 'Discounted rate for military personnel with valid ID',
            isActive: true,
          }
        ]
      });
    }

    const finalCounts = {
      routes: await prisma.route.count(),
      locations: await prisma.location.count(),
      schedules: await prisma.schedule.count(),
      departures: await prisma.departure.count(),
      pricingTiers: await prisma.pricingTier.count(),
    };

    console.log('✅ Production data check complete!');
    console.log('📊 Current counts:', finalCounts);

  } catch (error) {
    console.error('❌ Error fixing production data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixProductionData()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });