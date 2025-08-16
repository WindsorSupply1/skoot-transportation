#!/usr/bin/env node

/**
 * SKOOT Transportation Admin Setup
 * Creates first admin account and initial data
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log(`
👤 SKOOT Transportation Admin Setup
===================================

This will create your first admin account and set up initial data.
`);

  try {
    // Create admin user
    console.log('\n📝 Creating Admin Account:');
    const email = await ask('Admin email: ');
    const password = await ask('Admin password: ');
    const firstName = await ask('First name: ');
    const lastName = await ask('Last name: ');

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        firstName,
        lastName
      },
      create: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'ADMIN',
        customerType: 'REGULAR'
      }
    });

    console.log(`✅ Admin account created: ${admin.email}`);

    // Create initial pickup locations
    console.log('\n📍 Setting up pickup locations...');
    
    const locations = [
      {
        name: 'Hotel Trundle Downtown',
        address: '1224 Taylor St',
        city: 'Columbia',
        state: 'SC',
        zipCode: '29201',
        type: 'PICKUP',
        coordinates: '34.0007,-81.0348',
        instructions: 'Meet at main entrance. Look for SKOOT driver with passenger sign.',
        isActive: true,
        operatingHours: JSON.stringify({
          monday: { open: '05:00', close: '21:00' },
          tuesday: { open: '05:00', close: '21:00' },
          wednesday: { open: '05:00', close: '21:00' },
          thursday: { open: '05:00', close: '21:00' },
          friday: { open: '05:00', close: '21:00' },
          saturday: { open: '05:00', close: '21:00' },
          sunday: { open: '05:00', close: '21:00' }
        })
      },
      {
        name: 'McDonald\'s Parklane Road',
        address: '7520 Parklane Rd',
        city: 'Columbia',
        state: 'SC',
        zipCode: '29223',
        type: 'PICKUP',
        coordinates: '34.0421,-80.9729',
        instructions: 'Meet in parking lot near the main entrance. Driver will wait by vehicle.',
        isActive: true,
        operatingHours: JSON.stringify({
          monday: { open: '05:00', close: '21:00' },
          tuesday: { open: '05:00', close: '21:00' },
          wednesday: { open: '05:00', close: '21:00' },
          thursday: { open: '05:00', close: '21:00' },
          friday: { open: '05:00', close: '21:00' },
          saturday: { open: '05:00', close: '21:00' },
          sunday: { open: '05:00', close: '21:00' }
        })
      },
      {
        name: 'Charlotte Douglas International Airport',
        address: '5501 Josh Birmingham Pkwy',
        city: 'Charlotte',
        state: 'NC',
        zipCode: '28208',
        type: 'DROPOFF',
        coordinates: '35.2144,-80.9431',
        instructions: 'Drop-off at terminal curbside. Follow airport signs for departures.',
        isActive: true,
        operatingHours: JSON.stringify({
          monday: { open: '00:00', close: '23:59' },
          tuesday: { open: '00:00', close: '23:59' },
          wednesday: { open: '00:00', close: '23:59' },
          thursday: { open: '00:00', close: '23:59' },
          friday: { open: '00:00', close: '23:59' },
          saturday: { open: '00:00', close: '23:59' },
          sunday: { open: '00:00', close: '23:59' }
        })
      }
    ];

    for (const location of locations) {
      await prisma.location.upsert({
        where: { 
          name_city: {
            name: location.name,
            city: location.city
          }
        },
        update: location,
        create: location
      });
      console.log(`✅ Created location: ${location.name}`);
    }

    // Create initial route
    console.log('\n🛣️ Setting up route...');
    
    const route = await prisma.route.upsert({
      where: { 
        name: 'Columbia to Charlotte Airport'
      },
      update: {
        origin: 'Columbia, SC',
        destination: 'Charlotte Douglas International Airport',
        duration: 120,
        isActive: true
      },
      create: {
        name: 'Columbia to Charlotte Airport',
        origin: 'Columbia, SC', 
        destination: 'Charlotte Douglas International Airport',
        duration: 120,
        isActive: true
      }
    });

    console.log(`✅ Created route: ${route.name}`);

    // Create pricing tiers
    console.log('\n💰 Setting up pricing...');
    
    const pricingTiers = [
      {
        name: 'First 100 Special',
        customerType: 'FIRST_HUNDRED',
        basePrice: 31.00,
        description: 'Limited time offer for first 100 customers',
        isActive: true
      },
      {
        name: 'Regular Rate',
        customerType: 'REGULAR',
        basePrice: 35.00,
        description: 'Standard pricing for regular customers',
        isActive: true
      },
      {
        name: 'Student Rate',
        customerType: 'STUDENT',
        basePrice: 32.00,
        description: 'Discounted rate for students with valid ID',
        isActive: true
      },
      {
        name: 'Military Rate',
        customerType: 'MILITARY',
        basePrice: 32.00,
        description: 'Discounted rate for military personnel',
        isActive: true
      }
    ];

    for (const tier of pricingTiers) {
      await prisma.pricingTier.upsert({
        where: {
          routeId_customerType: {
            routeId: route.id,
            customerType: tier.customerType
          }
        },
        update: tier,
        create: {
          ...tier,
          routeId: route.id
        }
      });
      console.log(`✅ Created pricing tier: ${tier.name}`);
    }

    console.log(`
🎉 Setup Complete!

Admin Account: ${admin.email}
Login URL: https://your-domain.com/admin

Initial Data Created:
- 3 pickup/dropoff locations  
- 1 route (Columbia to Charlotte Airport)
- 4 pricing tiers

Next Steps:
1. Login to admin panel
2. Create schedules for your route
3. Generate departures for upcoming dates
4. Test the booking system
5. Start accepting customers!
`);

  } catch (error) {
    console.error('Setup failed:', error);
    
    if (error.code === 'P2002') {
      console.log('\n⚠️ Admin account already exists. Use the existing credentials.');
    } else {
      console.log('\n❌ Make sure your database is running and accessible.');
    }
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();