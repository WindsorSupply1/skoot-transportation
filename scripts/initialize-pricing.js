#!/usr/bin/env node

/**
 * Initialize default pricing tiers in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializePricing() {
  try {
    console.log('🏷️ Initializing default pricing tiers...\n');

    // Default pricing tiers
    const defaultPricingTiers = [
      {
        name: 'Regular Adult',
        description: 'Standard adult fare',
        basePrice: 35.00,
        customerType: 'REGULAR',
        isActive: true
      },
      {
        name: 'Student Discount',
        description: 'Discounted fare for students with valid ID',
        basePrice: 32.00,
        customerType: 'STUDENT',
        isActive: true
      },
      {
        name: 'Military Discount',
        description: 'Discounted fare for military personnel',
        basePrice: 32.00,
        customerType: 'MILITARY',
        isActive: true
      },
      {
        name: 'Legacy Customer',
        description: 'Special pricing for early customers',
        basePrice: 31.00,
        customerType: 'LEGACY',
        isActive: true
      }
    ];

    // Check if pricing tiers already exist
    const existingTiers = await prisma.pricingTier.findMany();
    
    if (existingTiers.length > 0) {
      console.log(`Found ${existingTiers.length} existing pricing tiers:`);
      existingTiers.forEach(tier => {
        console.log(`  - ${tier.customerType}: $${tier.basePrice} (${tier.isActive ? 'Active' : 'Inactive'})`);
      });
      console.log('\n✅ Pricing tiers already exist. Skipping initialization.');
      return;
    }

    // Create pricing tiers
    console.log('Creating default pricing tiers...');
    
    for (const tierData of defaultPricingTiers) {
      const tier = await prisma.pricingTier.create({
        data: tierData
      });
      console.log(`  ✅ Created: ${tier.customerType} - $${tier.basePrice}`);
    }

    // Initialize fee settings
    console.log('\n🎒 Setting up additional fees...');
    
    await prisma.siteSettings.upsert({
      where: { key: 'extraLuggageFee' },
      update: { value: '5.00' },
      create: { key: 'extraLuggageFee', value: '5.00' }
    });
    console.log('  ✅ Extra luggage fee: $5.00 per bag');

    await prisma.siteSettings.upsert({
      where: { key: 'petFee' },
      update: { value: '10.00' },
      create: { key: 'petFee', value: '10.00' }
    });
    console.log('  ✅ Pet fee: $10.00 per pet');

    console.log('\n🎉 Pricing initialization complete!');
    console.log('\n📋 Admin Actions Available:');
    console.log('• Visit https://skoot.bike/admin/pricing to manage pricing');
    console.log('• Adjust base prices for different customer types');
    console.log('• Update extra luggage and pet fees');
    console.log('• Activate/deactivate pricing tiers');

  } catch (error) {
    console.error('❌ Error initializing pricing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
initializePricing();