#!/usr/bin/env node

/**
 * SKOOT Transportation Setup Verification
 * Checks if all required configurations are in place
 */

const fs = require('fs');
const path = require('path');

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.log(`❌ ${description} - Missing: ${filePath}`);
    return false;
  }
}

function checkEnvVar(envFile, varName, description) {
  try {
    const content = fs.readFileSync(envFile, 'utf8');
    if (content.includes(`${varName}=`) && !content.includes(`${varName}="your_`)) {
      console.log(`✅ ${description}`);
      return true;
    } else {
      console.log(`❌ ${description} - Not configured in ${envFile}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Cannot read ${envFile}`);
    return false;
  }
}

function main() {
  console.log(`
🔍 SKOOT Transportation Setup Verification
==========================================
`);

  let allGood = true;

  // Check core files
  console.log('\n📁 Core Files:');
  allGood &= checkFile('package.json', 'Package configuration');
  allGood &= checkFile('prisma/schema.prisma', 'Database schema');
  allGood &= checkFile('src/app/page.tsx', 'Main application');
  allGood &= checkFile('src/app/booking/page.tsx', 'Booking system');
  allGood &= checkFile('src/app/admin/page.tsx', 'Admin panel');

  // Check environment configuration
  console.log('\n🔧 Environment Configuration:');
  const envFile = '.env.production';
  if (fs.existsSync(envFile)) {
    console.log(`✅ Production environment file exists`);
    
    allGood &= checkEnvVar(envFile, 'DATABASE_URL', 'Database connection');
    allGood &= checkEnvVar(envFile, 'NEXTAUTH_SECRET', 'NextAuth secret');
    allGood &= checkEnvVar(envFile, 'GOOGLE_CLIENT_ID', 'Google OAuth');
    allGood &= checkEnvVar(envFile, 'AMAZON_CLIENT_ID', 'Amazon Login');
    allGood &= checkEnvVar(envFile, 'STRIPE_PUBLISHABLE_KEY', 'Stripe payments');
    allGood &= checkEnvVar(envFile, 'SMTP_USER', 'Email configuration');
  } else {
    console.log(`❌ Production environment file missing`);
    console.log(`   Run: node deploy.js to create it`);
    allGood = false;
  }

  // Check dependencies
  console.log('\n📦 Dependencies:');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredDeps = [
      'next',
      'react',
      'prisma',
      '@prisma/client',
      'next-auth',
      'stripe',
      '@stripe/stripe-js',
      '@stripe/react-stripe-js',
      'tailwindcss'
    ];
    
    for (const dep of requiredDeps) {
      if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
        console.log(`✅ ${dep}`);
      } else {
        console.log(`❌ ${dep} - Missing dependency`);
        allGood = false;
      }
    }
  } catch (error) {
    console.log(`❌ Cannot read package.json`);
    allGood = false;
  }

  // Check build status
  console.log('\n🏗️ Build Status:');
  if (fs.existsSync('.next')) {
    console.log(`✅ Application has been built`);
  } else {
    console.log(`⚠️ Application not built yet - Run: npm run build`);
  }

  // Summary
  console.log('\n📋 Summary:');
  if (allGood) {
    console.log(`
🎉 All checks passed! Your SKOOT Transportation system is ready for deployment.

Next steps:
1. Run: npm run build (if not done already)
2. Run: vercel --prod (to deploy)
3. Configure your domain DNS
4. Test the live system
5. Set up initial data in admin panel
`);
  } else {
    console.log(`
⚠️ Some configuration is missing. Please:
1. Run: node deploy.js (to configure environment)
2. Install missing dependencies: npm install
3. Run this verification again: node verify-setup.js
`);
  }

  // Next steps
  console.log(`
📚 Resources:
- Setup Guide: PRODUCTION_DEPLOYMENT_GUIDE.md
- Stripe Setup: STRIPE_SETUP.md  
- Auth Setup: AUTH_SETUP.md
- Test Report: INTEGRATION_TEST_REPORT.md
`);
}

main();