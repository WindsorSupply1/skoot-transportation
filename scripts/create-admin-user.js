#!/usr/bin/env node

/**
 * Script to create admin user: jevon@skoot.bike
 * This system uses OAuth (Google/Amazon) for authentication
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user: jevon@skoot.bike...\n');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'jevon@skoot.bike' }
    });

    if (existingUser) {
      console.log('👤 User already exists, updating to admin...');
      
      // Update existing user to be admin
      const updatedUser = await prisma.user.update({
        where: { email: 'jevon@skoot.bike' },
        data: {
          isAdmin: true,
          firstName: 'Jevon',
          lastName: 'Admin',
          emailVerified: new Date()
        }
      });

      console.log('✅ Updated existing user as admin');
      console.log(`📧 Email: ${updatedUser.email}`);
      console.log(`👑 Admin: ${updatedUser.isAdmin}`);
      
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new admin user
      const newUser = await prisma.user.create({
        data: {
          email: 'jevon@skoot.bike',
          firstName: 'Jevon',
          lastName: 'Admin',
          isAdmin: true,
          customerType: 'REGULAR',
          emailVerified: new Date()
        }
      });

      console.log('✅ Created new admin user');
      console.log(`📧 Email: ${newUser.email}`);
      console.log(`👑 Admin: ${newUser.isAdmin}`);
    }

    console.log('\n🎉 Admin setup complete!');
    console.log('\n📋 Login Instructions:');
    console.log('1. Go to: https://skoot.bike/auth/signin');
    console.log('2. Sign in with Google using: jevon@skoot.bike');
    console.log('   OR sign in with Amazon using: jevon@skoot.bike');
    console.log('3. You will automatically have admin access');
    console.log('4. Access admin at: https://skoot.bike/admin');
    console.log('\n💡 Note: This system uses OAuth (Google/Amazon) for login');
    console.log('💡 Make sure jevon@skoot.bike is connected to Google or Amazon');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 'P2002') {
      console.log('💡 User might already exist with different case. Trying to update...');
      
      try {
        const updatedUser = await prisma.user.updateMany({
          where: { 
            email: {
              equals: 'jevon@skoot.bike',
              mode: 'insensitive'
            }
          },
          data: {
            isAdmin: true
          }
        });
        
        console.log('✅ Updated user with case-insensitive match');
        console.log('✅ User is now admin - use Google/Amazon login');
        
      } catch (updateError) {
        console.error('❌ Failed to update existing user:', updateError);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();