import { PrismaClient, CustomerType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data (optional - uncomment if you want to reset)
  // await prisma.emailLog.deleteMany()
  // await prisma.emailTemplate.deleteMany()
  // await prisma.revenueReport.deleteMany()
  // await prisma.testimonial.deleteMany()
  // await prisma.fAQ.deleteMany()
  // await prisma.siteSettings.deleteMany()
  // await prisma.passenger.deleteMany()
  // await prisma.payment.deleteMany()
  // await prisma.booking.deleteMany()
  // await prisma.departure.deleteMany()
  // await prisma.schedule.deleteMany()
  // await prisma.pricingTier.deleteMany()
  // await prisma.location.deleteMany()
  // await prisma.route.deleteMany()
  // await prisma.user.deleteMany()

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'hello@skoot.bike',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1-803-555-0001',
      isAdmin: true,
      customerType: 'REGULAR',
    }
  })

  // Create sample users
  const users = await Promise.all([
    // Legacy customers (first 100)
    prisma.user.create({
      data: {
        email: 'john.legacy@email.com',
        firstName: 'John',
        lastName: 'Legacy',
        phone: '+1-803-555-0101',
        isLegacyCustomer: true,
        legacyPrice: 31.00,
        customerType: 'LEGACY',
        dateOfBirth: new Date('1985-05-15'),
        emergencyContact: 'Jane Legacy',
        emergencyPhone: '+1-803-555-0102',
      }
    }),
    // Student customer
    prisma.user.create({
      data: {
        email: 'student@usc.edu',
        firstName: 'Sarah',
        lastName: 'Student',
        phone: '+1-803-555-0201',
        customerType: 'STUDENT',
        studentId: 'USC123456',
        dateOfBirth: new Date('2002-08-20'),
      }
    }),
    // Military customer
    prisma.user.create({
      data: {
        email: 'soldier@military.gov',
        firstName: 'Mike',
        lastName: 'Military',
        phone: '+1-803-555-0301',
        customerType: 'MILITARY',
        militaryId: 'MIL789012',
        dateOfBirth: new Date('1990-03-10'),
      }
    }),
    // Regular customer
    prisma.user.create({
      data: {
        email: 'regular@email.com',
        firstName: 'Jane',
        lastName: 'Regular',
        phone: '+1-803-555-0401',
        customerType: 'REGULAR',
        dateOfBirth: new Date('1988-11-25'),
      }
    })
  ])

  console.log('👤 Created users:', users.length)

  // Create main route: Columbia, SC → Charlotte Douglas Airport (CLT)
  const mainRoute = await prisma.route.create({
    data: {
      name: 'Columbia to Charlotte Airport',
      origin: 'Columbia, SC',
      destination: 'Charlotte Douglas International Airport (CLT)',
      duration: 130, // 100-130 minutes including Rock Hill stop
    }
  })

  console.log('🛣️ Created main route')

  // Create pickup locations
  const pickupLocations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'Downtown Columbia',
        address: '1425 Richland St',
        city: 'Columbia',
        state: 'SC',
        zipCode: '29201',
        latitude: 34.0007,
        longitude: -81.0348,
        isPickup: true,
        sortOrder: 1,
      }
    }),
    prisma.location.create({
      data: {
        name: 'USC Campus - Russell House',
        address: '1400 Greene St',
        city: 'Columbia',
        state: 'SC',
        zipCode: '29208',
        latitude: 34.0224,
        longitude: -81.0352,
        isPickup: true,
        sortOrder: 2,
      }
    }),
    prisma.location.create({
      data: {
        name: 'Fort Jackson Main Gate',
        address: '4442 Jackson Blvd',
        city: 'Columbia',
        state: 'SC',
        zipCode: '29207',
        latitude: 34.0515,
        longitude: -80.9709,
        isPickup: true,
        sortOrder: 3,
      }
    }),
    prisma.location.create({
      data: {
        name: 'Hampton Inn Columbia Downtown',
        address: '822 Gervais St',
        city: 'Columbia',
        state: 'SC',
        zipCode: '29201',
        latitude: 34.0012,
        longitude: -81.0374,
        isPickup: true,
        sortOrder: 4,
      }
    }),
    prisma.location.create({
      data: {
        name: 'Hotel Trundle',
        address: '1224 Taylor St',
        city: 'Columbia',
        state: 'SC',
        zipCode: '29201',
        latitude: 34.0038,
        longitude: -81.0331,
        isPickup: true,
        sortOrder: 5,
      }
    })
  ])

  // Create stop location
  const rockHillStop = await prisma.location.create({
    data: {
      name: 'Rock Hill Stop',
      address: '2301 Dave Lyle Blvd',
      city: 'Rock Hill',
      state: 'SC',
      zipCode: '29730',
      latitude: 34.9249,
      longitude: -81.0251,
      isPickup: false,
      isDropoff: false,
      sortOrder: 6,
    }
  })

  // Create destination
  const cltAirport = await prisma.location.create({
    data: {
      name: 'Charlotte Douglas International Airport',
      address: '5501 Josh Birmingham Pkwy',
      city: 'Charlotte',
      state: 'NC',
      zipCode: '28208',
      latitude: 35.2140,
      longitude: -80.9431,
      isDropoff: true,
      sortOrder: 7,
    }
  })

  console.log('📍 Created locations:', pickupLocations.length + 2)

  // Create pricing tiers
  const pricingTiers = await Promise.all([
    prisma.pricingTier.create({
      data: {
        name: 'Legacy Customer Rate',
        description: 'First 100 customers - $31 forever',
        basePrice: 31.00,
        customerType: 'LEGACY',
      }
    }),
    prisma.pricingTier.create({
      data: {
        name: 'Regular Adult Rate',
        description: 'Standard adult fare',
        basePrice: 35.00,
        customerType: 'REGULAR',
      }
    }),
    prisma.pricingTier.create({
      data: {
        name: 'Student Rate',
        description: 'Student discount with valid ID',
        basePrice: 32.00,
        customerType: 'STUDENT',
      }
    }),
    prisma.pricingTier.create({
      data: {
        name: 'Military Rate',
        description: 'Military discount with valid ID',
        basePrice: 32.00,
        customerType: 'MILITARY',
      }
    })
  ])

  console.log('💰 Created pricing tiers:', pricingTiers.length)

  // Create schedules for even hours (6AM, 8AM, 10AM, 12PM, 2PM, 4PM, 6PM, 8PM)
  const evenHourTimes = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
  const schedules = []

  // Create schedules for all 7 days of the week
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    for (const time of evenHourTimes) {
      const schedule = await prisma.schedule.create({
        data: {
          routeId: mainRoute.id,
          dayOfWeek,
          time,
        }
      })
      schedules.push(schedule)
    }
  }

  console.log('📅 Created schedules:', schedules.length)

  // Create departures for the next 30 days
  const departures = []
  const today = new Date()
  
  for (let i = 0; i < 30; i++) {
    const departureDate = new Date(today)
    departureDate.setDate(today.getDate() + i)
    const dayOfWeek = departureDate.getDay()
    
    // Find schedules for this day of week
    const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek)
    
    for (const schedule of daySchedules) {
      const [hours, minutes] = schedule.time.split(':').map(Number)
      const departureDateTime = new Date(departureDate)
      departureDateTime.setHours(hours, minutes, 0, 0)
      
      // Only create departures for future times
      if (departureDateTime > new Date()) {
        const departure = await prisma.departure.create({
          data: {
            scheduleId: schedule.id,
            date: departureDateTime,
            capacity: 15,
            bookedSeats: Math.floor(Math.random() * 8), // Random bookings for demo
          }
        })
        departures.push(departure)
      }
    }
  }

  console.log('🚌 Created departures:', departures.length)

  // Create sample bookings
  const sampleBookings = []
  for (let i = 0; i < 10; i++) {
    const randomDeparture = departures[Math.floor(Math.random() * departures.length)]
    const randomUser = users[Math.floor(Math.random() * users.length)]
    const randomPickup = pickupLocations[Math.floor(Math.random() * pickupLocations.length)]
    const pricingTier = pricingTiers.find(pt => pt.customerType === randomUser.customerType) || pricingTiers[1]
    
    const booking = await prisma.booking.create({
      data: {
        userId: randomUser.id,
        routeId: mainRoute.id,
        departureId: randomDeparture.id,
        pickupLocationId: randomPickup.id,
        dropoffLocationId: cltAirport.id,
        pricingTierId: pricingTier.id,
        passengerCount: Math.floor(Math.random() * 3) + 1,
        totalAmount: pricingTier.basePrice,
        status: Math.random() > 0.7 ? 'CONFIRMED' : 'PAID',
      }
    })
    sampleBookings.push(booking)

    // Create passenger for each booking
    await prisma.passenger.create({
      data: {
        bookingId: booking.id,
        firstName: randomUser.firstName,
        lastName: randomUser.lastName,
        email: randomUser.email,
        phone: randomUser.phone,
      }
    })

    // Create payment for paid bookings
    if (booking.status === 'PAID') {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          status: 'COMPLETED',
          paymentMethod: 'Credit Card',
          transactionId: `TXN_${Date.now()}_${i}`,
          processedAt: new Date(),
          netAmount: booking.totalAmount * 0.97, // 3% processing fee
          processorFee: booking.totalAmount * 0.03,
        }
      })
    }
  }

  console.log('📝 Created bookings:', sampleBookings.length)

  // Create testimonials
  const testimonials = await Promise.all([
    prisma.testimonial.create({
      data: {
        userId: users[0].id,
        name: 'John Legacy',
        title: 'Business Executive',
        content: 'Skoot has been a game-changer for my weekly trips to Charlotte. Reliable, comfortable, and the legacy pricing makes it unbeatable!',
        rating: 5,
        isVisible: true,
        isVerified: true,
      }
    }),
    prisma.testimonial.create({
      data: {
        userId: users[1].id,
        name: 'Sarah S.',
        title: 'USC Student',
        content: 'Perfect for getting to the airport for holiday flights. The student discount is awesome and the drivers are always friendly!',
        rating: 5,
        isVisible: true,
        isVerified: true,
      }
    }),
    prisma.testimonial.create({
      data: {
        name: 'Robert M.',
        title: 'Frequent Traveler',
        content: 'Much better than driving myself and paying for airport parking. The Rock Hill stop gives me time to grab coffee and stretch.',
        rating: 4,
        isVisible: true,
        isVerified: false,
      }
    }),
    prisma.testimonial.create({
      data: {
        userId: users[2].id,
        name: 'Mike Military',
        title: 'Army Officer',
        content: 'Reliable transportation from Fort Jackson to CLT. The military discount is appreciated and the service is always on time.',
        rating: 5,
        isVisible: true,
        isVerified: true,
      }
    }),
    prisma.testimonial.create({
      data: {
        name: 'Lisa H.',
        title: 'Hotel Guest',
        content: 'Hotel concierge recommended Skoot for my early morning flight. Pickup was right on time and the ride was smooth.',
        rating: 4,
        isVisible: true,
        isVerified: false,
      }
    })
  ])

  console.log('⭐ Created testimonials:', testimonials.length)

  // Create FAQ entries
  const faqs = await Promise.all([
    prisma.fAQ.create({
      data: {
        question: 'What are your operating hours?',
        answer: 'We operate departures every even hour from 6:00 AM to 8:00 PM (6AM, 8AM, 10AM, 12PM, 2PM, 4PM, 6PM, 8PM), 7 days a week.',
        category: 'Schedule',
        sortOrder: 1,
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'How long does the trip take?',
        answer: 'The journey from Columbia to Charlotte Airport takes approximately 100-130 minutes, including a 10-minute stop in Rock Hill.',
        category: 'Travel',
        sortOrder: 2,
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'What are your pickup locations in Columbia?',
        answer: 'We pick up from Downtown Columbia, USC Campus (Russell House), Fort Jackson Main Gate, and select hotels including Hampton Inn Downtown and Hotel Trundle.',
        category: 'Pickup',
        sortOrder: 3,
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'How much does it cost?',
        answer: 'Regular adult fare is $35. Students and military personnel pay $32 with valid ID. Our first 100 customers get a lifetime rate of $31. Round trip tickets are $62 and valid for 30 days.',
        category: 'Pricing',
        sortOrder: 4,
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'Can I bring luggage?',
        answer: 'Yes! Standard luggage is included. Extra bags are $5 each. We accommodate standard airline luggage sizes.',
        category: 'Luggage',
        sortOrder: 5,
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'Are pets allowed?',
        answer: 'Yes, we welcome pets for an additional $10 fee. Pets must be in carriers or on leash and well-behaved.',
        category: 'Pets',
        sortOrder: 6,
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'How many passengers per vehicle?',
        answer: 'Each departure has a maximum capacity of 15 passengers to ensure comfort and safety.',
        category: 'Capacity',
        sortOrder: 7,
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'How do I cancel or change my booking?',
        answer: 'You can cancel or modify your booking through your customer account or by calling our customer service line at least 2 hours before departure.',
        category: 'Booking',
        sortOrder: 8,
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'Do you offer round trip tickets?',
        answer: 'Yes! Round trip tickets are $62 and are valid for 30 days from the date of purchase, giving you flexibility for your return journey.',
        category: 'Pricing',
        sortOrder: 9,
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'What happens if my flight is delayed?',
        answer: 'We monitor flight schedules and can accommodate minor delays. For significant delays, please contact us to discuss rebooking options.',
        category: 'Travel',
        sortOrder: 10,
      }
    })
  ])

  console.log('❓ Created FAQs:', faqs.length)

  // Create email templates
  const emailTemplates = await Promise.all([
    prisma.emailTemplate.create({
      data: {
        name: 'booking_confirmation',
        subject: 'Booking Confirmation - Skoot Transportation',
        htmlBody: `
          <h2>Booking Confirmed!</h2>
          <p>Thank you for choosing Skoot Transportation. Your booking has been confirmed.</p>
          <h3>Booking Details:</h3>
          <ul>
            <li><strong>Booking Number:</strong> {{bookingNumber}}</li>
            <li><strong>Date:</strong> {{departureDate}}</li>
            <li><strong>Time:</strong> {{departureTime}}</li>
            <li><strong>Pickup:</strong> {{pickupLocation}}</li>
            <li><strong>Destination:</strong> {{destination}}</li>
            <li><strong>Passengers:</strong> {{passengerCount}}</li>
            <li><strong>Total Amount:</strong> ${{totalAmount}}</li>
          </ul>
          <p>Please arrive 15 minutes before your scheduled departure time.</p>
          <p>Safe travels!</p>
        `,
        textBody: 'Booking Confirmed! Booking Number: {{bookingNumber}}. Date: {{departureDate}} at {{departureTime}}. Please arrive 15 minutes early.',
      }
    }),
    prisma.emailTemplate.create({
      data: {
        name: 'payment_confirmation',
        subject: 'Payment Received - Skoot Transportation',
        htmlBody: `
          <h2>Payment Confirmed</h2>
          <p>We have successfully processed your payment for booking {{bookingNumber}}.</p>
          <p><strong>Amount Paid:</strong> ${{amount}}</p>
          <p><strong>Transaction ID:</strong> {{transactionId}}</p>
          <p>Your seat is now secured. We'll see you at departure!</p>
        `,
        textBody: 'Payment confirmed for booking {{bookingNumber}}. Amount: ${{amount}}. Transaction ID: {{transactionId}}.',
      }
    }),
    prisma.emailTemplate.create({
      data: {
        name: 'departure_reminder',
        subject: 'Departure Reminder - Tomorrow\'s Trip',
        htmlBody: `
          <h2>Departure Reminder</h2>
          <p>This is a friendly reminder about your upcoming trip tomorrow.</p>
          <h3>Trip Details:</h3>
          <ul>
            <li><strong>Date:</strong> {{departureDate}}</li>
            <li><strong>Departure Time:</strong> {{departureTime}}</li>
            <li><strong>Pickup Location:</strong> {{pickupLocation}}</li>
          </ul>
          <p><strong>Please arrive 15 minutes early.</strong></p>
          <p>Have your booking confirmation ready and enjoy your trip!</p>
        `,
        textBody: 'Departure reminder: Your trip is tomorrow at {{departureTime}} from {{pickupLocation}}. Please arrive 15 minutes early.',
      }
    })
  ])

  console.log('📧 Created email templates:', emailTemplates.length)

  // Create site settings
  const siteSettings = await Promise.all([
    prisma.siteSettings.create({
      data: {
        key: 'company_name',
        value: 'Skoot Transportation',
        description: 'Company name displayed on the website',
      }
    }),
    prisma.siteSettings.create({
      data: {
        key: 'contact_email',
        value: 'hello@skoot.bike',
        description: 'Primary contact email address',
      }
    }),
    prisma.siteSettings.create({
      data: {
        key: 'contact_phone',
        value: '+1-803-SKOOT-SC',
        description: 'Primary contact phone number',
      }
    }),
    prisma.siteSettings.create({
      data: {
        key: 'max_passengers_per_departure',
        value: '15',
        type: 'number',
        description: 'Maximum passengers allowed per departure',
      }
    }),
    prisma.siteSettings.create({
      data: {
        key: 'extra_luggage_fee',
        value: '5.00',
        type: 'number',
        description: 'Fee for extra luggage bags',
      }
    }),
    prisma.siteSettings.create({
      data: {
        key: 'pet_fee',
        value: '10.00',
        type: 'number',
        description: 'Fee for pets',
      }
    }),
    prisma.siteSettings.create({
      data: {
        key: 'round_trip_validity_days',
        value: '30',
        type: 'number',
        description: 'Number of days round trip tickets are valid',
      }
    }),
    prisma.siteSettings.create({
      data: {
        key: 'legacy_customer_count',
        value: '100',
        type: 'number',
        description: 'Number of legacy customers eligible for special pricing',
      }
    }),
    prisma.siteSettings.create({
      data: {
        key: 'booking_cutoff_hours',
        value: '2',
        type: 'number',
        description: 'Hours before departure that bookings close',
      }
    }),
    prisma.siteSettings.create({
      data: {
        key: 'website_maintenance_mode',
        value: 'false',
        type: 'boolean',
        description: 'Enable maintenance mode for the website',
      }
    })
  ])

  console.log('⚙️ Created site settings:', siteSettings.length)

  // Create sample revenue reports
  const revenueReports = []
  for (let i = 7; i >= 0; i--) {
    const reportDate = new Date()
    reportDate.setDate(reportDate.getDate() - i)
    reportDate.setHours(0, 0, 0, 0)
    
    const report = await prisma.revenueReport.create({
      data: {
        reportDate,
        totalBookings: Math.floor(Math.random() * 50) + 20,
        totalRevenue: (Math.random() * 1000) + 500,
        totalPassengers: Math.floor(Math.random() * 60) + 25,
        averageBookingValue: 35 + (Math.random() * 10),
        cancellationRate: Math.random() * 0.1,
        occupancyRate: 0.6 + (Math.random() * 0.3),
      }
    })
    revenueReports.push(report)
  }

  console.log('📊 Created revenue reports:', revenueReports.length)

  console.log('✅ Database seeding completed successfully!')
  console.log(`
    Summary:
    - ${users.length + 1} users created (including admin)
    - 1 main route created
    - ${pickupLocations.length + 2} locations created
    - ${pricingTiers.length} pricing tiers created
    - ${schedules.length} schedules created
    - ${departures.length} departures created
    - ${sampleBookings.length} bookings created
    - ${testimonials.length} testimonials created
    - ${faqs.length} FAQ entries created
    - ${emailTemplates.length} email templates created
    - ${siteSettings.length} site settings created
    - ${revenueReports.length} revenue reports created
  `)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })