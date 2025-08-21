# SKOOT Transportation - Complete System Documentation

## 🚀 Project Overview

**Live URL**: https://skoot.bike  
**Repository**: https://github.com/WindsorSupply1/skoot-transportation  
**Current Commit**: 83494b1 (Fix booking payment flow and improve error handling)  
**Application**: Complete shuttle booking system for routes between Columbia, SC and Charleston, SC  
**Framework**: Next.js 14.2.31 with TypeScript  
**Hosting**: Vercel with automatic GitHub deployment  
**Database**: Neon PostgreSQL Cloud  
**Payments**: Stripe (Live Mode)  
**Email**: Google Workspace (hello@skoot.bike)  

---

## 🛠️ Technology Stack

### Core Framework
- **Next.js 14.2.31** (App Router)
- **TypeScript** for type safety
- **React 18** with Server/Client Components
- **Tailwind CSS** for styling

### Database & ORM
- **PostgreSQL** (Neon Cloud Database)
- **Prisma ORM v5.22.0**
- **Database URL**: Configured via environment variables

### Authentication
- **NextAuth.js** with multiple providers:
  - Google OAuth
  - Amazon Login
  - Email/Password credentials
- **Admin role system** with isAdmin flag

### Payment Processing
- **Stripe integration** (Live and Test modes)
- **Webhook handling** for payment confirmation
- **Refund capabilities**

### Live Transit System (NEW)
- **Real-time GPS tracking** with 15-second updates
- **SMS notifications** via Twilio integration
- **Live ETA calculations** with traffic-aware algorithms
- **Driver tablet interface** with PIN authentication
- **Customer live tracking** with Uber-like experience
- **Automatic notifications** for all trip status changes

### Deployment
- **Vercel hosting** with automatic GitHub deployment
- **Environment variables** managed through Vercel dashboard
- **Custom domain**: skoot.bike

---

## 🔧 Key Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Database operations
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

---

## 📊 Database Schema Overview

### Core Models

#### Users (users table)
- **Fields**: id, email, firstName, lastName, phone
- **Admin Control**: isAdmin (Boolean for admin access)
- **Customer Types**: REGULAR | STUDENT | MILITARY | LEGACY
- **OAuth Integration**: Provider-specific fields
- **Additional**: Emergency contacts, student/military IDs

#### Routes (routes table)
- **Fields**: name, origin, destination, duration
- **Status**: isActive (Boolean)
- **Relationships**: schedules[], bookings[]

#### Schedules (schedules table)
- **Fields**: routeId, time, dayOfWeek (1=Monday, 7=Sunday)
- **Capacity**: Int (default seat capacity)
- **Status**: isActive (Boolean)
- **Relationships**: departures[]

#### Departures (departures table)
- **Fields**: scheduleId, date, capacity, bookedSeats
- **Status**: SCHEDULED | BOARDING | IN_TRANSIT | COMPLETED | CANCELLED
- **Computed**: availableSeats = capacity - bookedSeats

#### Bookings (bookings table)
- **Support**: User or guest booking
- **Details**: Route, departure, pickup/dropoff locations
- **Data**: Passenger count, pricing, special requests
- **Status**: PENDING | CONFIRMED | PAID | COMPLETED | CANCELLED

#### PricingTiers (pricing_tiers table)
- **Customer-based**: Different pricing for customer types
- **Base Pricing**: Different categories
- **Validity**: Date-range support

---

## 🏗️ Application Architecture

### Frontend Structure
```
src/app/
├── (auth)/              # Authentication pages
├── admin/               # Admin dashboard pages
├── booking/             # Customer booking flow
├── api/                 # API routes
└── components/          # Reusable components
```

### API Architecture

#### Public APIs (No Auth Required)
- `GET /api/routes` - Customer route browsing
- `GET /api/schedules` - Public schedule/departure data
- `POST /api/bookings` - Create bookings
- `GET /api/locations` - Pickup/dropoff locations
- `POST /api/stripe/create-payment-intent` - Payment processing

#### Admin APIs (Auth Required)
- `/api/admin/routes` - Route management
- `/api/admin/schedules` - Schedule management
- `/api/admin/bookings` - Booking management
- `/api/admin/dashboard/stats` - Analytics
- `/api/admin/customers` - Customer management
- `/api/admin/seed-sample-data` - Data seeding

#### Utility APIs
- `GET|POST /api/setup-admin` - Make user admin
- `POST /api/auth/register` - User registration
- `POST /api/stripe/webhook` - Stripe webhooks

---

## 🌐 Domain & DNS Configuration

### Domain: skoot.bike
- **Registrar**: Squarespace
- **DNS**: Managed through Squarespace
- **SSL**: Automatically handled by Vercel

### DNS Records
```
Type: A
Host: @
Value: 216.198.79.1
TTL: 4 hrs
```

### Email DNS (Google Workspace)
- MX records configured for hello@skoot.bike
- Google Workspace integration active

---

## 🔐 Authentication & Authorization

### Auth Flow
1. **NextAuth.js** handles OAuth and credentials
2. **Session management** via JWT tokens
3. **Admin middleware** (withAuth) protects admin routes
4. **Role-based access** via isAdmin user flag

### Setting Up Admin Access
```javascript
// After logging in, visit: https://skoot.bike/api/setup-admin
// Or run in admin panel console:
fetch('/api/setup-admin', {method: 'POST'})
```

### Protected Route Pattern
```javascript
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    // Admin-only logic here
  }, true); // true = require admin
}
```

---

## 💳 Stripe Configuration

### Live Environment
- **Dashboard**: https://dashboard.stripe.com
- **Mode**: Live (production payments)
- **Webhook Endpoint**: https://skoot.bike/api/webhooks/stripe

### Payment Flow
1. **Customer selects trip** → Create payment intent
2. **Stripe handles card processing**
3. **Webhook confirms payment** → Update booking status
4. **Email confirmation sent**

### Test Configuration
- **Test Card**: 4242 4242 4242 4242
- **Test Keys**: Use sk_test_ and pk_test_ prefixes
- **Test Webhook**: Use whsec_test_ prefix

### Webhook Events
Configured to listen for:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## 📧 Email Configuration

### Provider: Google Workspace
- **Email**: hello@skoot.bike
- **SMTP**: Gmail SMTP servers
- **Authentication**: App Password (16-character)

### Email Functions
- Booking confirmations
- Payment receipts
- System notifications
- Customer support

---

## 📱 Key Features Implemented

### Customer Features
- ✅ **Multi-step booking flow** (Trip → Info → Payment → Confirmation)
- ✅ **Route selection** with real-time availability
- ✅ **Guest bookings** (no account required)
- ✅ **User accounts** with booking history
- ✅ **Payment processing** with Stripe
- ✅ **Email confirmations** for bookings
- ✅ **Responsive design** (mobile-first)

### Admin Features
- ✅ **Dashboard** with live stats and metrics
- ✅ **Route management** (create, edit, deactivate)
- ✅ **Schedule management** with capacity settings
- ✅ **Booking management** (view, modify, cancel)
- ✅ **Customer database** with search/filter
- ✅ **Revenue reporting** and analytics
- ✅ **Departure tracking** with occupancy rates

### System Features
- ✅ **Data seeding** for development/testing
- ✅ **Error handling** and user feedback
- ✅ **Loading states** and optimistic UI
- ✅ **Type safety** throughout application
- ✅ **Scalable architecture** for future growth

---

## 🚀 Development Setup

### Initial Setup
1. **Clone repository**
2. **Copy environment variables** to `.env.local`
3. **Install dependencies**: `npm install`
4. **Run database migrations**: `npx prisma migrate deploy`
5. **Generate Prisma client**: `npx prisma generate`
6. **Start development server**: `npm run dev`

### Database Schema Changes
```bash
# After modifying schema.prisma:
npx prisma migrate dev --name describe_change
npx prisma generate
```

---

## 🛠️ Development Issues Resolved

### Major Fixes Implemented

#### 1. Build Errors Resolution
- **Issue**: Multiple TypeScript compilation errors
- **Resolution**: Fixed imports, type definitions, component syntax
- **Commits**: 88, 52f582d, 73fd675

#### 2. Admin Panel Save Issues
- **Issue**: "Data saves but disappears" - missing database schema
- **Resolution**: Added capacity field to Schedule model, fixed API handling
- **Commits**: 9fcef6a, 79da0d1

#### 3. Routes Not Visible on Booking Page
- **Issue**: Booking page used admin-only endpoints
- **Resolution**: Created public /api/routes and /api/schedules endpoints
- **Commits**: e370755

#### 4. Authentication Setup
- **Issue**: Setup-admin only supported POST requests
- **Resolution**: Added GET method for browser access
- **Commits**: 79da0d1

#### 5. Data Seeding Errors
- **Issue**: Schema mismatches in seeding scripts
- **Resolution**: Fixed missing fields (dayOfWeek, removed invalid customer types)
- **Commits**: 0851006, 09dbacc

---

## 🚌 SKOOT Live Transit System - Complete Implementation

### 🎯 System Overview
The SKOOT Live Transit System transforms the basic booking platform into a cutting-edge transportation experience comparable to Uber, providing real-time tracking, automatic notifications, and seamless communication between drivers, customers, and administrators.

### ✅ Key Features Implemented

#### 1. **Real-time GPS Tracking Infrastructure**
- **Database Models**: Added comprehensive tracking schema with GPS breadcrumbs, live status, and trip events
- **15-second GPS updates** during active trips
- **Automatic progress calculation** based on route completion
- **Location history** stored for route optimization and analytics

#### 2. **Driver Tablet Interface** 
- **Simple PIN Authentication**: 4-digit PIN system for easy tablet login
- **One-Touch Workflow**: Start Boarding → Depart → Arrived → Complete
- **Automatic GPS Tracking**: Background location updates without driver intervention
- **Minimal Interface**: Designed to avoid driver distraction while driving
- **URL**: `/driver` - Accessible on any tablet or mobile device

#### 3. **Customer Live Tracking**
- **Uber-like Interface**: Real-time progress bars, ETA updates, driver contact
- **Auto-refresh**: Updates every 30 seconds without manual refresh
- **Live Status**: Boarding, En Route, Delayed, Arrived notifications
- **Driver Info**: Contact details, ratings, and emergency contact options
- **URL Pattern**: `/live/[departureId]` - Unique link per trip

#### 4. **SMS Notification System**
- **Twilio Integration**: Production-ready SMS service with fallback to dev logging
- **Automatic Triggers**: Booking confirmation, boarding, departure, delays, arrival
- **Template System**: Pre-built message templates for all trip statuses
- **Phone Validation**: Automatic formatting and validation for US numbers
- **Delivery Tracking**: Success/failure logging with error handling

#### 5. **Real-time ETA Calculations**
- **Traffic-aware Algorithm**: Considers time of day, rush hours, weekend patterns
- **Distance Calculation**: Haversine formula for accurate GPS-based distances  
- **Confidence Scoring**: 50-95% accuracy based on trip progress and conditions
- **Dynamic Updates**: Recalculates based on current location and traffic
- **Pickup Stop Integration**: Accounts for multiple passenger pickup locations

#### 6. **Admin Management Interfaces**
- **Driver Management**: Complete CRUD for driver accounts, PINs, performance tracking
- **SMS Dashboard**: Send bulk notifications, view delivery history, template management
- **Capacity Alerts**: Real-time notifications when vans reach 80%/90%/100% capacity
- **Notification History**: Searchable log of all customer communications

### 📱 Customer Experience Flow

#### Booking Confirmation
1. **Payment Success** → Automatic SMS with tracking link sent
2. **Email Confirmation** → Includes tracking URL and trip details  
3. **Live Status Created** → Departure becomes trackable immediately

#### Trip Day Experience
1. **30-min Reminder** → SMS with pickup details and tracking link
2. **Boarding Started** → SMS notification when driver begins boarding
3. **Departed** → SMS with ETA and live tracking URL
4. **Live Updates** → Automatic page refresh every 30 seconds
5. **Delays** → Immediate SMS notifications with updated ETA
6. **Arrival** → SMS with driver contact and pickup instructions

### 🚐 Driver Experience Flow

#### Login Process
1. **Visit** `/driver` on tablet or mobile
2. **Enter 4-digit PIN** (generated by admin)
3. **Select Active Trip** from assigned departures

#### Trip Management
1. **Start Boarding** → Triggers customer SMS notifications
2. **Depart** → Begins GPS tracking, sends departure SMS  
3. **En Route** → Automatic location updates every 15 seconds
4. **Arrived** → Stops tracking, sends arrival notifications
5. **Complete** → Finalizes trip, archives tracking data

### 🛠️ Technical Implementation

#### Database Schema Extensions
```sql
-- New tables added for live tracking
Driver (id, name, email, phone, licenseNumber, pin, isActive)
VehicleTracking (id, vehicleId, driverId, departureId, status, coordinates, timestamps)
GpsTracking (id, vehicleTrackingId, latitude, longitude, speed, timestamp)
LiveDepartureStatus (id, departureId, currentStatus, progressPercentage, trackingUrl)
CustomerNotification (id, bookingId, type, message, status, deliveryInfo)
TripEvent (id, vehicleTrackingId, eventType, eventData, location, timestamp)
```

#### Key API Endpoints
```
/api/driver/auth - PIN-based driver authentication
/api/driver/update-status - Trip status updates with GPS
/api/live/tracking?departureId=X - Customer tracking data
/api/live/eta?departureId=X - Real-time ETA calculations  
/api/admin/drivers - Driver management CRUD
/api/admin/notifications/sms - SMS management interface
/api/admin/send-tracking-reminders - Bulk notification sending
```

#### Core Services
```typescript
// SMS Service - /src/lib/sms.ts
smsService.sendSMS() // Twilio integration
SMS_TEMPLATES // Pre-built message templates
sendTripStatusSMS() // Automatic trip notifications

// ETA Service - /src/lib/eta.ts  
etaService.calculateETA() // Traffic-aware calculations
etaService.updateETAWithProgress() // Dynamic updates
COMMON_LOCATIONS // Route coordinate mapping
```

### 📊 Admin Dashboard Integration

#### New Quick Actions Added
- **Driver Management** → Manage driver accounts, PINs, performance
- **SMS Notifications** → Send alerts, view delivery history  
- **Capacity Alerts** → Real-time van capacity monitoring

#### Notification Management
- **Send Tab** → Bulk SMS to departures or custom phone numbers
- **History Tab** → Complete delivery log with success/failure tracking
- **Templates** → Boarding, Departure, Delay, Arrival, Pickup Reminder messages

### 🔗 Booking Flow Integration

#### Automatic Tracking Link Distribution
1. **Payment Webhook** → Creates live departure status record
2. **SMS Sent** → Tracking link included in booking confirmation  
3. **Email Template** → {{trackingUrl}} variable added to confirmations
4. **Database Logging** → All notifications tracked for audit purposes

#### Return Trip Support
- **Round-trip bookings** → Separate tracking links for each departure
- **Multi-passenger notifications** → Individual SMS to each contact number
- **Guest booking support** → Works without user accounts

### ⚙️ Environment Configuration

#### New Environment Variables Added
```bash
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"  
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_FROM_NUMBER="+1234567890"
```

#### Development vs Production
- **Development Mode** → SMS logged to console, GPS simulated
- **Production Mode** → Real Twilio SMS, actual GPS coordinates
- **Automatic Detection** → Based on NODE_ENV variable

### 🎨 UI/UX Enhancements

#### Live Tracking Page Features
- **Progress Bar** → Visual trip completion percentage
- **ETA Display** → Time remaining with confidence indicator  
- **Status Icons** → Visual indicators for each trip phase
- **Driver Contact** → One-tap calling with ratings display
- **Auto-refresh** → 30-second updates with loading indicators

#### Admin Interface Improvements  
- **Real-time Alerts** → Capacity warnings with sound notifications
- **Notification History** → Search, filter, mark as read functionality
- **Driver Stats** → Trip count, ratings, current status display
- **Bulk Actions** → Send reminders to multiple departures

### 🔧 Development Tools & Debugging

#### GPS Simulation (Development)
- **Mock Coordinates** → Predefined route waypoints for testing
- **Progress Simulation** → Automatic trip progression for demos
- **Console Logging** → Detailed SMS and tracking logs

#### Admin Testing Features
- **Manual GPS Updates** → Override location for testing
- **Force Status Changes** → Test notification triggers
- **SMS Preview** → See message content before sending

### 📈 Performance Considerations

#### Real-time Updates
- **15-second GPS intervals** → Balances accuracy with battery usage
- **30-second page refresh** → Optimal for customer experience
- **2-minute ETA recalculation** → Prevents excessive API calls

#### Database Optimization
- **Indexed tracking queries** → Fast location lookups
- **Archived trip data** → Completed trips moved to historical tables
- **Efficient SMS logging** → Bulk inserts for notification records

### 🚨 Error Handling & Resilience

#### SMS Delivery
- **Retry Logic** → Automatic retry for failed deliveries
- **Fallback Logging** → Database records even when SMS fails
- **Error Tracking** → Detailed failure reasons for debugging

#### GPS Tracking  
- **Offline Support** → Cached location updates when connectivity lost
- **Battery Optimization** → Reduced frequency when stationary
- **Accuracy Validation** → Filters out invalid GPS coordinates

### 🔄 Future Enhancement Opportunities

#### Immediate Next Steps
- **Push Notifications** → Browser notifications for web app users
- **WhatsApp Integration** → Alternative to SMS for international users
- **Voice Calls** → Automated status update calls for accessibility

#### Advanced Features
- **Route Optimization** → AI-powered pickup sequencing
- **Predictive ETAs** → Machine learning based on historical data
- **Multi-language Support** → Spanish/other language SMS templates
- **Driver Mobile App** → Native iOS/Android app for enhanced features

---

## 📊 Data Management

### Sample Data Structure
```javascript
// Routes
Columbia to Charleston (120 min)
Charleston to Columbia (120 min)

// Locations
Columbia Downtown, USC Campus, Charleston Airport

// Pricing Tiers
Regular Adult: $35
Student: $30
Military: $32

// Schedules
Multiple daily departures (6AM, 9AM, 12PM, 3PM, 6PM, 9PM)
Capacity: 15-20 seats per departure
```

### Data Seeding
```javascript
// Run in admin panel console:
fetch('/api/admin/seed-sample-data', {method: 'POST'})
  .then(r => r.json()).then(console.log)
```

---

## 🚀 Deployment Information

### Hosting: Vercel
- **Project**: skoot-transportation-kbv8
- **Team**: SkootAdmin's projects
- **Auto-deploy**: Connected to git repository

### Environments
- **Production**: https://skoot.bike
- **Preview**: Auto-generated URLs for pull requests
- **Development**: Local development server

### Deployment Process
- **Auto-deploy**: Pushes to main branch trigger Vercel deployment
- **Build time**: ~2-3 minutes
- **Rollback**: Available via Vercel dashboard

---

## 🔒 Security & Access

### Critical Security Notes
- **All keys shown are LIVE production keys**
- **Stripe keys process real payments**
- **Database contains production data**
- **Environment variables are sensitive**

### Access Management
- **Vercel Dashboard**: SkootAdmin account
- **Stripe Dashboard**: windSORsupply account
- **Domain Management**: Squarespace account
- **Database**: Neon console access

### Security Measures
- **SQL injection protection** via Prisma
- **Authentication required** for all admin operations
- **CORS configured** for production domain
- **Environment variables secured** in Vercel

---

## 📋 Deployment Checklist

### Before Deploying Changes
- [ ] Test locally with development environment
- [ ] Verify database migrations work
- [ ] Test payment flows with Stripe test mode
- [ ] Check email notifications
- [ ] Verify environment variables are set

### Production Deployment
- [ ] Push to main branch (auto-deploys to Vercel)
- [ ] Monitor deployment logs
- [ ] Test live functionality
- [ ] Verify Stripe webhooks are working
- [ ] Check error monitoring

---

## 📋 Current Status & Next Steps

### ✅ Completed Features
- **Full booking system** with payment processing
- **Admin dashboard** with comprehensive management
- **User authentication** with multiple providers
- **Responsive design** across all devices
- **Data seeding** and sample content
- **Error handling** and user feedback
- **Production deployment** on Vercel

### 🔄 Immediate Tasks for New Developer
1. **Test the full booking flow** with sample data
2. **Review admin panel functionality** - all CRUD operations
3. **Understand API architecture** - public vs admin endpoints
4. **Familiarize with database schema** and relationships
5. **Test payment flow** with Stripe test cards

### 🚀 Potential Future Enhancements
- **Real-time seat availability** with WebSocket updates
- **SMS notifications** for booking confirmations
- **Advanced analytics** with detailed reporting
- **Mobile app development** (React Native)
- **Driver app** for departure management
- **Multi-language support** for broader market
- **API rate limiting** and caching for scale
- **Advanced pricing** (surge pricing, promotions)

---

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Errors:
- Verify DATABASE_URL is correct
- Check Neon database status
- Ensure SSL mode is required

#### Payment Issues:
- Verify Stripe keys are live (not test)
- Check webhook secret is correct
- Monitor Stripe dashboard for errors

#### Email Not Sending:
- Verify Google App Password is valid
- Check SMTP settings
- Ensure 2FA is enabled on Google account

#### Domain Issues:
- Check DNS propagation (up to 24 hours)
- Verify A record points to correct Vercel IP
- Check SSL certificate status

### Performance Considerations
- **Database queries** optimized with proper include statements
- **API responses** include computed fields to reduce client-side calculations
- **Pagination implemented** for large datasets

### Browser Compatibility
- **Modern browsers** (Chrome, Firefox, Safari, Edge)
- **Mobile responsive design** tested on iOS/Android
- **Progressive enhancement** for older browsers

---

## 🐛 Known Issues & Considerations

### Current Focus
- **Domain migration** from Squarespace to Vercel (if needed)
- **Site is production-ready** with all features working
- **Database on Neon Cloud**, Stripe payments configured
- **Auto-deployment** from GitHub to Vercel active

### Support Resources
- **Vercel Support**: https://vercel.com/support
- **Stripe Support**: https://support.stripe.com
- **Neon Support**: https://neon.tech/docs
- **Google Workspace**: https://support.google.com/a

---

## 📞 Emergency Contacts & Access

### Key Services
- **Domain**: Squarespace account holder
- **Hosting**: Vercel SkootAdmin account
- **Payments**: Stripe windSORsupply account
- **Email**: Google Workspace admin

### Important URLs
- **Production**: https://skoot.bike
- **Admin Dashboard**: https://skoot.bike/admin
- **Booking Page**: https://skoot.bike/booking
- **Admin Setup**: https://skoot.bike/api/setup-admin
- **Driver Tablet**: https://skoot.bike/driver
- **SMS Management**: https://skoot.bike/admin/notifications
- **Driver Management**: https://skoot.bike/admin/drivers
- **Live Tracking Example**: https://skoot.bike/live/[departureId]

### Access Credentials
- **Admin Access**: Login → Visit /api/setup-admin
- **Test Payments**: Card 4242 4242 4242 4242
- **Database**: Managed via Prisma Studio (`npx prisma studio`)

### Rollback Procedures
1. **Revert** to previous Vercel deployment
2. **Check database** for any required rollbacks
3. **Monitor** error logs and user reports
4. **Communicate** with stakeholders

---

## 🔧 Environment Variables (Sensitive - Store Securely)

### Production Environment Variables (Vercel)
Note: These are LIVE production keys - handle with extreme care!

```bash
# Database & Authentication
DATABASE_URL=[Neon PostgreSQL connection string]
NEXTAUTH_URL=https://skoot.bike
NEXTAUTH_SECRET=[32-character secure random string]

# Email Configuration (Google Workspace)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hello@skoot.bike
SMTP_PASSWORD=[Google App Password - 16 characters]
SMTP_FROM=hello@skoot.bike

# Stripe Payment Processing (LIVE KEYS)
STRIPE_SECRET_KEY=[Live secret key starting with sk_live_]
STRIPE_PUBLISHABLE_KEY=[Live publishable key starting with pk_live_]
STRIPE_WEBHOOK_SECRET=[Webhook signing secret starting with whsec_]

# OAuth Providers
GOOGLE_CLIENT_ID=[Google OAuth Client ID]
GOOGLE_CLIENT_SECRET=[Google OAuth Secret]
AMAZON_CLIENT_ID=[Amazon Login Client ID]
AMAZON_CLIENT_SECRET=[Amazon Login Secret]

# Additional Neon Database Variables (Auto-generated)
DATABASE_URL_UNPOOLED=[Unpooled connection string]
POSTGRES_URL=[Pooled connection string]
POSTGRES_PRISMA_URL=[Prisma-specific connection string]

# SMS Configuration (Twilio) - LIVE KEYS
TWILIO_ACCOUNT_SID=[Twilio Account SID starting with AC]
TWILIO_AUTH_TOKEN=[Twilio Auth Token]  
TWILIO_FROM_NUMBER=[Twilio phone number in +1XXXXXXXXXX format]

# Neon Auth (Stack)
NEXT_PUBLIC_STACK_PROJECT_ID=[Stack project ID]
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=[Stack publishable key]
STACK_SECRET_SERVER_KEY=[Stack server key]
```

### Local Development .env File
Use Stripe TEST keys for development to avoid processing real payments.

---

*Last Updated: August 21, 2025*  
*Document Version: 3.0 - Complete System with Live Transit Implementation*  
*Repository: https://github.com/WindsorSupply1/skoot-transportation*  
*Live Transit System: Fully Implemented and Production Ready*