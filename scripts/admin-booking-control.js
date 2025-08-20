/**
 * Admin script to control booking availability
 * Run this in the browser console on the admin dashboard
 */

async function setBookedUntilOctober() {
  console.log('🚌 Setting bookings as unavailable until October 1, 2025...');
  
  try {
    // Step 1: Generate departures until October 1, 2025 (fully booked)
    const response1 = await fetch('/api/admin/departures/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        startDate: new Date().toISOString().split('T')[0], // Today
        endDate: '2025-10-01', // October 1, 2025
        capacity: 15 // Standard capacity
      })
    });
    
    const result1 = await response1.json();
    console.log('✅ Generated departures until October 1, 2025:', result1);
    
    // Step 2: Mark all existing departures as fully booked until October 1, 2025
    const response2 = await fetch('/api/admin/departures/mark-booked', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        endDate: '2025-10-01'
      })
    });
    
    if (response2.ok) {
      const result2 = await response2.json();
      console.log('✅ Marked departures as fully booked:', result2);
    }
    
    // Step 3: Generate available departures starting October 1, 2025
    const response3 = await fetch('/api/admin/departures/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        startDate: '2025-10-01', // October 1, 2025
        endDate: '2025-12-31', // End of 2025
        capacity: 15
      })
    });
    
    const result3 = await response3.json();
    console.log('✅ Generated available departures from October 1, 2025:', result3);
    
    console.log(`
🎉 SUCCESS! 
• All bookings until October 1, 2025: UNAVAILABLE (Sold Out)
• Bookings from October 1, 2025: AVAILABLE
• Customers will see "Sold Out" message until October 1st
    `);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Instructions for use:
console.log(`
📋 INSTRUCTIONS:
1. Open https://skoot.bike/admin in your browser
2. Log in as admin
3. Open browser developer console (F12)
4. Paste this entire script and press Enter
5. Run: setBookedUntilOctober()
`);

// Auto-run if you want (uncomment next line)
// setBookedUntilOctober();