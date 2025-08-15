const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@skoot.bike' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@skoot.bike',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1-803-SKOOT-SC',
        isAdmin: true,
        customerType: 'REGULAR',
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@skoot.bike');
    console.log('Password: Any password (auth is set to skip validation)');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();