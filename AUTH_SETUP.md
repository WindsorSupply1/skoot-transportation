# Authentication Setup Guide for SKOOT Transportation

This guide covers the complete setup of the authentication system for the SKOOT shuttle booking platform, which supports Google OAuth, Amazon Login, and guest booking flows.

## Overview

The authentication system implements:
- **Google OAuth** - Sign in with Google account
- **Amazon Login** - Sign in with Amazon account  
- **Guest Booking** - Book without account creation
- **Account Linking** - Convert guest bookings to registered accounts
- **Session Management** - Secure JWT-based sessions
- **Role-based Access** - Admin and customer permissions

## Environment Variables Setup

Copy `.env.example` to `.env` and configure the following variables:

### 1. Database Configuration
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/skoot_transportation"
```

### 2. NextAuth Configuration
```bash
NEXTAUTH_URL="http://localhost:3000"  # Your app URL
NEXTAUTH_SECRET="your-super-secret-32-char-string"  # Generate with: openssl rand -base64 32
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

```bash
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 4. Amazon Login Setup

1. Go to [Amazon Developer Console](https://developer.amazon.com/loginwithamazon/console/site/lwa/overview.html)
2. Create a new Security Profile
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/amazon` (development)
   - `https://yourdomain.com/api/auth/callback/amazon` (production)
4. Note down your Client ID and Client Secret

```bash
AMAZON_CLIENT_ID="your-amazon-client-id"
AMAZON_CLIENT_SECRET="your-amazon-client-secret"
```

## Database Schema

The authentication system uses the following Prisma models:

### User Model
```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  firstName       String
  lastName        String
  phone           String?
  isAdmin         Boolean  @default(false)
  image           String?
  emailVerified   DateTime?
  customerType    CustomerType @default(REGULAR)
  guestBookingHash String? // For linking guest bookings
  
  // Relations
  accounts        Account[]
  sessions        Session[]
  bookings        Booking[]
}
```

### NextAuth Models
- `Account` - OAuth provider accounts
- `Session` - User sessions
- `VerificationToken` - Email verification tokens

## Component Architecture

### AuthProvider (`/components/auth/AuthProvider.tsx`)
- Wraps the entire application
- Provides authentication context
- Manages loading states
- Exports `useAuth()` hook

### SignInModal (`/components/auth/SignInModal.tsx`)
- Modal dialog for authentication
- Supports Google, Amazon, and email/password
- Guest checkout option
- Responsive design

### UserProfileMenu (`/components/auth/UserProfileMenu.tsx`)
- Authenticated user dropdown menu
- Profile access, admin panel, sign out
- Shows user avatar and basic info

### AuthGuard (`/components/auth/AuthGuard.tsx`)
- Route protection components
- `RequireAuth` - Requires authentication
- `RequireAdmin` - Requires admin privileges
- `ConditionalAuth` - Different content for auth states

### GuestBookingForm (`/components/auth/GuestBookingForm.tsx`)
- Guest checkout form
- Optional account creation
- Contact information collection
- Account benefits promotion

### AccountLinkingModal (`/components/auth/AccountLinkingModal.tsx`)
- Post-booking account creation
- Links guest bookings to new accounts
- Social login options
- Password account creation

## API Endpoints

### NextAuth API (`/api/auth/[...nextauth]/route.ts`)
- Handles OAuth flows
- Session management
- User creation and linking

### Registration API (`/api/auth/register/route.ts`)
- Email/password account creation
- Input validation with Zod
- Password hashing with bcrypt

### Guest Account Creation (`/api/auth/create-account-from-guest/route.ts`)
- Converts guest bookings to user accounts
- Links existing bookings
- Automatic sign-in after creation

### Updated Booking API (`/api/bookings/route.ts`)
- Handles both authenticated and guest bookings
- User context detection
- Automatic account creation option
- Guest booking data storage

## Authentication Flow

### Guest Booking Flow
1. User starts booking process
2. Trip details selection
3. Customer details step shows two options:
   - Sign in to existing account
   - Continue as guest
4. Guest form with optional account creation checkbox
5. Payment processing
6. Post-booking account linking modal (if not created)

### Authenticated User Flow
1. User signs in via Google/Amazon/Email
2. Booking process uses saved user information
3. Faster checkout with pre-filled data
4. Booking history tracking

### Account Linking Flow
1. Guest completes booking
2. Account linking modal appears
3. Options: Create password account, use Google/Amazon, or skip
4. If account created, all guest bookings are linked
5. User is automatically signed in

## Security Features

### Password Security
- Bcrypt hashing with 12 rounds
- Minimum 6 character requirement
- Password visibility toggles

### Session Security
- HTTP-only cookies
- Secure cookies in production
- CSRF protection
- 30-day session expiry

### OAuth Security
- State parameter validation
- Proper redirect URI validation
- Scope-limited permissions
- Profile data validation

## Testing the Authentication System

### 1. Development Setup
```bash
npm install
npx prisma migrate dev
npm run dev
```

### 2. Test Scenarios

#### Guest Booking
1. Go to `/booking`
2. Fill trip details
3. Choose "Continue as Guest"
4. Complete booking
5. Test account linking modal

#### Social Login
1. Go to `/auth/signin`
2. Test Google OAuth flow
3. Test Amazon Login flow
4. Verify user creation in database

#### Email Registration
1. Go to `/auth/signup`
2. Create account with email/password
3. Verify automatic sign-in
4. Test dashboard access

#### Admin Access
1. Create admin user in database
2. Sign in as admin
3. Test admin panel access
4. Verify customer restrictions

## Production Deployment

### 1. Environment Variables
- Update `NEXTAUTH_URL` to production domain
- Use strong `NEXTAUTH_SECRET`
- Configure production OAuth redirect URIs
- Enable secure cookies

### 2. Database Migration
```bash
npx prisma migrate deploy
```

### 3. OAuth Provider Configuration
- Update redirect URIs to production URLs
- Verify domain ownership for OAuth providers
- Test OAuth flows in production

## Troubleshooting

### Common Issues

#### OAuth Errors
- Check redirect URI configuration
- Verify client ID/secret
- Ensure OAuth consent screen is configured

#### Database Errors
- Run database migrations
- Check connection string
- Verify Prisma schema matches database

#### Session Issues
- Clear browser cookies
- Check `NEXTAUTH_SECRET` configuration
- Verify secure cookie settings

#### Development Issues
- Use HTTP (not HTTPS) for local development
- Check port 3000 is available
- Verify environment variables are loaded

## Integration with Other Systems

### HubSpot Integration (Phase 2)
The authentication system exports user data in the format required for HubSpot:
- User profile information
- Booking history
- Contact preferences
- Authentication method tracking

### Payment Processing
User authentication state is passed to Stripe for:
- Customer creation/retrieval
- Payment method saving
- Booking association
- Refund processing

### Admin Dashboard
Authentication system provides admin guards for:
- Route protection
- User management
- Booking administration
- Analytics access

## Maintenance

### Regular Tasks
- Monitor OAuth provider status
- Update dependencies monthly
- Review session security logs
- Clean expired verification tokens

### Security Updates
- Rotate NEXTAUTH_SECRET annually
- Update OAuth app secrets as needed
- Monitor for security vulnerabilities
- Update authentication libraries

## Support

For authentication-related issues:
1. Check the troubleshooting section
2. Verify environment variables
3. Test OAuth provider configurations
4. Review browser network/console errors
5. Check database connectivity

The authentication system is designed to be secure, user-friendly, and maintainable while supporting both guest and registered user flows seamlessly.