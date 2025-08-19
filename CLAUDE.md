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

# Neon Auth (Stack)
NEXT_PUBLIC_STACK_PROJECT_ID=[Stack project ID]
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=[Stack publishable key]
STACK_SECRET_SERVER_KEY=[Stack server key]
```

### Local Development .env File
Use Stripe TEST keys for development to avoid processing real payments.

---

*Last Updated: December 19, 2024*  
*Document Version: 2.1 - Complete System Documentation*  
*Repository: https://github.com/WindsorSupply1/skoot-transportation*  
*Current Commit: 83494b1*