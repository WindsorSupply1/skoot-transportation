# Skoot Transportation - Complete Booking System

A professional, full-stack transportation booking system for Skoot Transportation's Columbia, SC to Charlotte Douglas Airport shuttle service.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/username/skoot-transportation.git
cd skoot-transportation

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up database
npm run db:setup

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📋 Features

### Customer Features
- **Easy Booking**: Simple, step-by-step booking process
- **Real-time Availability**: Live seat availability checking
- **Multiple Pricing Tiers**: Legacy ($31), Student/Military ($32), Regular ($35)
- **Round Trip Discounts**: Save 10% on round trip bookings
- **Stripe Payment Processing**: Secure payment handling
- **Email Confirmations**: Automated booking and payment confirmations
- **Mobile Responsive**: Optimized for all devices

### Admin Features
- **Comprehensive Dashboard**: Real-time booking and revenue overview
- **Booking Management**: View, edit, and manage all bookings
- **Schedule Management**: Create and manage departure schedules
- **Customer Management**: Customer database and booking history
- **Revenue Reporting**: Detailed financial analytics
- **Occupancy Analytics**: Route and time slot performance analysis

### Business Features
- **Route Management**: Columbia → Charlotte with Rock Hill stop
- **Capacity Management**: 15-passenger vehicle capacity tracking
- **Dynamic Pricing**: Customer type-based pricing system
- **Email Notifications**: Automated customer communications
- **Payment Tracking**: Complete payment and refund management

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Email**: Nodemailer
- **Deployment**: Vercel

### Project Structure
```
skoot-transportation/
├── src/
│   ├── app/                    # Next.js 14 app directory
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── admin/             # Admin dashboard
│   │   └── (pages)/           # Public pages
│   ├── components/            # React components
│   ├── lib/                   # Utilities and configurations
│   └── types/                 # TypeScript definitions
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── tests/                     # Test files
```

## 💾 Database Schema

### Core Models
- **User**: Customer and admin accounts
- **Route**: Transportation routes (Columbia → CLT)
- **Schedule**: Departure times and frequency
- **Departure**: Specific date/time instances
- **Booking**: Customer reservations
- **Payment**: Payment processing records
- **Location**: Pickup and destination points

### Key Relationships
- Bookings → Departures → Schedules → Routes
- Users → Bookings (for registered customers)
- Bookings → Payments (payment tracking)
- Bookings → Passengers (passenger details)

## 🔑 Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/skoot_db"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@skoot.bike"
```

## 🚀 Deployment

### Vercel Deployment
1. **Connect GitHub Repository**
   ```bash
   # Push to GitHub
   git remote add origin https://github.com/username/skoot-transportation.git
   git push -u origin main
   ```

2. **Configure Vercel Project**
   - Import project from GitHub
   - Set environment variables
   - Configure build settings

3. **Database Setup**
   ```bash
   # Production database migration
   npx prisma migrate deploy
   npx prisma generate
   npx prisma db seed
   ```

### Environment Configuration
```javascript
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "STRIPE_SECRET_KEY": "@stripe_secret_key"
  }
}
```

## 📊 Business Logic

### Pricing Structure
- **Legacy Rate**: $31 (first 100 customers, forever rate)
- **Student Rate**: $32 (valid student ID required, forever rate)
- **Military Rate**: $32 (military ID required, forever rate)
- **Regular Rate**: $35 (standard fare)
- **Round Trip**: 10% discount on total fare
- **Extra Luggage**: $5 per additional bag
- **Pet Transport**: $10 per pet

### Schedule Operations
- **Departure Times**: Every even hour (6AM - 8PM)
- **Route**: Columbia, SC → Rock Hill (10-min stop) → Charlotte CLT
- **Journey Time**: 100-130 minutes total
- **Vehicle Capacity**: 15 passengers per departure

### Booking Flow
1. **Customer Selection**: Date, time, passengers, pickup location
2. **Pricing Calculation**: Dynamic pricing based on customer type
3. **Payment Processing**: Secure Stripe payment handling
4. **Confirmation**: Email confirmation with booking details
5. **Admin Notification**: Real-time booking notifications

## 🔧 API Reference

### Public Endpoints
```
GET /api/departures          # Get available departures
GET /api/locations           # Get pickup locations
GET /api/pricing             # Calculate pricing
POST /api/bookings           # Create new booking
GET /api/bookings            # Lookup booking by confirmation
```

### Admin Endpoints
```
GET /api/admin/dashboard/stats    # Dashboard statistics
GET /api/admin/bookings          # Manage bookings
GET /api/admin/schedules         # Manage schedules
POST /api/admin/departures/generate  # Generate departures
GET /api/admin/reports/revenue   # Revenue analytics
GET /api/admin/reports/occupancy # Occupancy analytics
```

### Authentication
```
POST /api/auth/signin           # Admin login
POST /api/auth/signout         # Logout
GET /api/auth/session          # Get current session
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/                   # Unit tests
│   ├── components/        # Component tests
│   ├── lib/              # Utility tests
│   └── api/              # API route tests
├── integration/           # Integration tests
└── e2e/                  # End-to-end tests
```

## 📈 Monitoring & Analytics

### Key Metrics
- **Booking Conversion Rate**: Visitors to completed bookings
- **Occupancy Rate**: Seats filled vs. total capacity
- **Revenue per Departure**: Average revenue by time slot
- **Customer Acquisition**: New vs. returning customers
- **Payment Success Rate**: Successful payments vs. attempts

### Admin Dashboard Metrics
- Real-time booking counts
- Daily/weekly/monthly revenue
- Seat availability tracking
- Customer type distribution
- Peak time analysis

## 🔒 Security

### Implementation
- **HTTPS Everywhere**: SSL/TLS encryption
- **PCI Compliance**: Stripe handles sensitive payment data
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM parameterized queries
- **Authentication**: NextAuth.js secure session management
- **CORS Configuration**: Proper API access controls

### Best Practices
- Environment variable protection
- Audit logging for admin actions
- Rate limiting on API endpoints
- Secure password hashing (bcrypt)
- CSRF protection

## 📞 Support & Contact

### Customer Support
- **Phone**: (803) 555-SKOOT
- **Email**: hello@skoot.bike
- **Hours**: 6am - 10pm daily

### Technical Support
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive API and setup guides
- **Email Support**: Available for deployment assistance

## 🚗 Future Enhancements

### Planned Features
- **Mobile App**: Native iOS and Android applications
- **SMS Notifications**: Text message booking confirmations
- **Group Bookings**: Corporate and event group reservations
- **Loyalty Program**: Frequent rider rewards system
- **Route Expansion**: Columbia → Kingstree → Myrtle Beach

### Technical Roadmap
- **Performance Optimization**: Caching and CDN implementation
- **Advanced Analytics**: Machine learning booking predictions
- **API V2**: GraphQL API for mobile applications
- **Multi-language Support**: Spanish translation support

## 📄 License

This project is proprietary software owned by Skoot Transportation. All rights reserved.

---

**Skoot Transportation** - Reliable, affordable airport transportation
**Starting at $31** - Every even hour - Student & Military discounts available

For more information, visit [skoot.bike](https://skoot.bike)