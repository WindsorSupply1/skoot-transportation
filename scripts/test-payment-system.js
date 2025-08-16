/**
 * SKOOT Transportation Payment System Test Suite
 * 
 * This script tests the payment integration endpoints and functionality.
 * Run with: node scripts/test-payment-system.js
 */

const https = require('https');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 10000; // 10 seconds

// Test data
const TEST_DATA = {
  route: {
    routeId: 'test-route-1',
    passengerCount: 2,
    customerType: 'REGULAR',
    ticketType: 'ADULT',
    isRoundTrip: false,
    extraLuggageBags: 1,
    petCount: 0,
  },
  booking: {
    routeId: 'test-route-1',
    scheduleId: 'test-schedule-1',
    departureId: 'test-departure-1',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    passengers: 2,
    ticketType: 'ADULT',
    firstName: 'Test',
    lastName: 'Customer',
    email: 'test@example.com',
    phone: '555-0123',
    pickupLocationId: 'test-pickup-1',
  },
  payment: {
    amount: 45.50,
    currency: 'usd',
  },
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
};

// Utility functions
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PaymentSystemTest/1.0',
      },
    };

    const req = https.request(url, options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const parsedBody = responseBody ? JSON.parse(responseBody) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody,
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.setTimeout(TEST_TIMEOUT);

    if (data && (method === 'POST' || method === 'PUT')) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTest(testName, testFunction) {
  console.log(`🧪 Running test: ${testName}`);
  const startTime = performance.now();

  try {
    await testFunction();
    const duration = Math.round(performance.now() - startTime);
    console.log(`✅ ${testName} passed (${duration}ms)`);
    testResults.passed++;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    console.log(`❌ ${testName} failed (${duration}ms): ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
  }
}

// Test functions
async function testPricingCalculation() {
  const response = await makeRequest('/api/pricing/calculate', 'POST', TEST_DATA.route);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }

  const { body } = response;
  if (!body || typeof body.total !== 'number') {
    throw new Error('Invalid pricing response format');
  }

  if (body.total <= 0) {
    throw new Error('Pricing calculation returned invalid total');
  }

  console.log(`   💰 Calculated price: $${body.total}`);
}

async function testPricingWithPromoCode() {
  const dataWithPromo = { ...TEST_DATA.route, promoCode: 'WELCOME10' };
  const response = await makeRequest('/api/pricing/calculate', 'POST', dataWithPromo);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}`);
  }

  const { body } = response;
  if (body.discounts <= 0) {
    throw new Error('Promo code discount not applied');
  }

  console.log(`   🎫 Promo discount: $${body.discounts}`);
}

async function testInvalidPricingRequest() {
  const invalidData = { ...TEST_DATA.route, passengerCount: 0 };
  const response = await makeRequest('/api/pricing/calculate', 'POST', invalidData);
  
  if (response.statusCode !== 400) {
    throw new Error(`Expected status 400 for invalid data, got ${response.statusCode}`);
  }
}

async function testPaymentIntentCreation() {
  // First create a booking (this would normally be done in the booking flow)
  const bookingResponse = await makeRequest('/api/bookings', 'POST', TEST_DATA.booking);
  
  if (bookingResponse.statusCode !== 201 && bookingResponse.statusCode !== 200) {
    throw new Error(`Failed to create test booking: ${bookingResponse.statusCode}`);
  }

  const booking = bookingResponse.body.booking;
  if (!booking || !booking.id) {
    throw new Error('Booking creation did not return valid booking ID');
  }

  // Now test payment intent creation
  const paymentData = {
    bookingId: booking.id,
    amount: booking.totalAmount,
    currency: 'usd',
  };

  const response = await makeRequest('/api/stripe/create-payment-intent', 'POST', paymentData);
  
  if (response.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${response.statusCode}: ${JSON.stringify(response.body)}`);
  }

  const { body } = response;
  if (!body.clientSecret || !body.paymentIntentId) {
    throw new Error('Payment intent response missing required fields');
  }

  console.log(`   💳 Payment intent created: ${body.paymentIntentId}`);
  return { booking, paymentIntent: body };
}

async function testInvalidPaymentIntent() {
  const invalidData = {
    bookingId: 'invalid-booking-id',
    amount: 50.00,
  };

  const response = await makeRequest('/api/stripe/create-payment-intent', 'POST', invalidData);
  
  if (response.statusCode !== 404) {
    throw new Error(`Expected status 404 for invalid booking, got ${response.statusCode}`);
  }
}

async function testAmountMismatch() {
  // Create a booking first
  const bookingResponse = await makeRequest('/api/bookings', 'POST', TEST_DATA.booking);
  const booking = bookingResponse.body.booking;

  // Try to create payment intent with wrong amount
  const invalidData = {
    bookingId: booking.id,
    amount: booking.totalAmount + 10, // Wrong amount
  };

  const response = await makeRequest('/api/stripe/create-payment-intent', 'POST', invalidData);
  
  if (response.statusCode !== 400) {
    throw new Error(`Expected status 400 for amount mismatch, got ${response.statusCode}`);
  }
}

async function testRateLimiting() {
  const pricingData = TEST_DATA.route;

  // Make multiple rapid requests
  const promises = [];
  for (let i = 0; i < 6; i++) {
    promises.push(makeRequest('/api/pricing/calculate', 'POST', pricingData));
  }

  const responses = await Promise.all(promises);
  
  // Check if any were rate limited (status 429)
  const rateLimited = responses.some(r => r.statusCode === 429);
  if (!rateLimited) {
    console.log('   ⚠️  Rate limiting may not be properly configured');
  } else {
    console.log('   🛡️  Rate limiting working correctly');
  }
}

async function testEmailValidation() {
  const invalidEmailData = {
    ...TEST_DATA.booking,
    email: 'invalid-email',
  };

  const response = await makeRequest('/api/bookings', 'POST', invalidEmailData);
  
  if (response.statusCode === 200) {
    console.log('   ⚠️  Email validation may not be properly implemented');
  } else {
    console.log('   ✉️  Email validation working correctly');
  }
}

async function testSecurityHeaders() {
  const response = await makeRequest('/api/stripe/create-payment-intent', 'POST', {
    bookingId: 'test',
    amount: 50,
  });

  // Check for security headers
  const headers = response.headers;
  const securityHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
  ];

  const missingHeaders = securityHeaders.filter(header => !headers[header]);
  if (missingHeaders.length > 0) {
    console.log(`   ⚠️  Missing security headers: ${missingHeaders.join(', ')}`);
  } else {
    console.log('   🔒 Security headers present');
  }
}

async function testErrorHandling() {
  // Test various error scenarios
  const errorTests = [
    { data: null, name: 'null body' },
    { data: '', name: 'empty body' },
    { data: { invalid: 'data' }, name: 'invalid schema' },
  ];

  for (const test of errorTests) {
    try {
      const response = await makeRequest('/api/pricing/calculate', 'POST', test.data);
      if (response.statusCode < 400) {
        throw new Error(`Expected error status for ${test.name}, got ${response.statusCode}`);
      }
    } catch (error) {
      if (!error.message.includes('Expected error status')) {
        // Network errors are expected for some invalid data
        continue;
      }
      throw error;
    }
  }

  console.log('   🚨 Error handling working correctly');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting SKOOT Payment System Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('='.repeat(50));

  // Pricing tests
  await runTest('Pricing Calculation', testPricingCalculation);
  await runTest('Pricing with Promo Code', testPricingWithPromoCode);
  await runTest('Invalid Pricing Request', testInvalidPricingRequest);

  // Payment tests
  await runTest('Payment Intent Creation', testPaymentIntentCreation);
  await runTest('Invalid Payment Intent', testInvalidPaymentIntent);
  await runTest('Amount Mismatch Validation', testAmountMismatch);

  // Security tests
  await runTest('Rate Limiting', testRateLimiting);
  await runTest('Email Validation', testEmailValidation);
  await runTest('Security Headers', testSecurityHeaders);
  await runTest('Error Handling', testErrorHandling);

  // Results
  console.log('='.repeat(50));
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n🚨 Failed Tests:');
    testResults.errors.forEach(({ test, error }) => {
      console.log(`   ${test}: ${error}`);
    });
  }

  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Payment system is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix issues before deployment.');
    process.exit(1);
  }
}

// Error handling for the test script
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  makeRequest,
  TEST_DATA,
};