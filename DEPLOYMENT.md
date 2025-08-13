# Skoot Transportation - Deployment Guide

Complete deployment guide for the Skoot Transportation booking system on Vercel with PostgreSQL.

## 🚀 Quick Deployment

### Prerequisites
- [Vercel Account](https://vercel.com) (SkootAdmin)
- [GitHub Repository](https://github.com) (jevon@windsor.supply)
- PostgreSQL Database (Vercel Postgres or external)
- Stripe Account (Windsor.supply business account)
- Email Service (Gmail or SMTP)

### 1. Database Setup

#### Option A: Vercel Postgres (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Create Postgres database
vercel postgres create skoot-db

# Get connection string
vercel env pull .env.local
```

#### Option B: External PostgreSQL
```bash
# Set up your PostgreSQL instance
# Update DATABASE_URL in environment variables
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 2. Environment Variables Setup

Configure these environment variables in your Vercel dashboard:

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-super-secret-jwt-token"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Stripe (Get from your Stripe dashboard)
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="hello@skoot.bike"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="Skoot Transportation <hello@skoot.bike>"
```

### 3. GitHub Repository Setup

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: Complete Skoot Transportation booking system"

# Add GitHub remote (jevon@windsor.supply)
git remote add origin https://github.com/username/skoot-transportation.git
git branch -M main
git push -u origin main
```

### 4. Vercel Deployment

1. **Connect GitHub to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure project settings

2. **Build Settings**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm ci",
     "framework": "nextjs"
   }
   ```

3. **Environment Variables**
   - Add all environment variables from step 2
   - Ensure sensitive keys are properly configured
   - Test configuration with `vercel env pull`

### 5. Database Migration & Seeding

```bash
# After deployment, run database setup
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

### 6. Stripe Webhook Configuration

1. **Create Webhook in Stripe Dashboard**
   - URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

2. **Test Webhook**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

## 🔧 Configuration Files

### vercel.json
```json
{
  "builds": [
    {
      "src": "package.json", 
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret"
  }
}
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  }
}

module.exports = nextConfig
```

## 🏗️ Build Process

### Local Development
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Code linting
npm run type-check   # TypeScript checking
```

### Production Build
```bash
# Vercel automatically runs these commands:
npm ci               # Clean install
npm run build        # Next.js production build
npm start           # Start production server
```

## 🔒 Security Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database connection secured
- [ ] Stripe keys properly set
- [ ] SMTP credentials configured
- [ ] NEXTAUTH_SECRET generated (32+ characters)
- [ ] CORS headers configured

### Post-Deployment
- [ ] SSL certificate active (HTTPS)
- [ ] Stripe webhooks functioning
- [ ] Email notifications working
- [ ] Database migrations applied
- [ ] Admin login functional
- [ ] Test booking flow complete
- [ ] Payment processing verified

## 📊 Domain Configuration

### Custom Domain Setup (skoot.bike)
1. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Add `skoot.bike` as custom domain
   - Configure DNS records as instructed

2. **DNS Configuration**
   ```
   Type: A
   Name: @
   Value: 76.76.19.61 (Vercel IP)
   
   Type: CNAME  
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate**
   - Vercel automatically provisions SSL
   - Verify HTTPS is working
   - Test redirect from HTTP to HTTPS

## 🧪 Testing Deployment

### Functional Tests
```bash
# Test booking flow
curl -X POST https://skoot.bike/api/bookings \
  -H "Content-Type: application/json" \
  -d '{...booking data...}'

# Test payment processing
curl -X POST https://skoot.bike/api/stripe/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{...payment data...}'

# Test admin authentication
curl -X POST https://skoot.bike/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@skoot.bike","password":"admin123"}'
```

### Performance Tests
- Page load times < 2 seconds
- API response times < 500ms
- Database query optimization
- Image optimization and CDN

## 📈 Monitoring Setup

### Vercel Analytics
```javascript
// Enable in vercel.json
{
  "analytics": {
    "id": "your-analytics-id"
  }
}
```

### Error Tracking
```javascript
// pages/_app.js
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

## 🔄 Continuous Deployment

### Auto-Deploy Setup
1. **GitHub Integration**
   - Automatic deploys on `main` branch push
   - Preview deployments for pull requests
   - Branch protection rules

2. **Deploy Hooks**
   ```bash
   # Manual deployment trigger
   curl -X POST https://api.vercel.com/v1/integrations/deploy/...
   ```

### Environment Management
- **Production**: `main` branch → skoot.bike
- **Staging**: `staging` branch → staging-skoot.vercel.app  
- **Development**: `dev` branch → dev-skoot.vercel.app

## 📋 Post-Deployment Checklist

### Immediate Actions
- [ ] Verify website loads at skoot.bike
- [ ] Test complete booking flow
- [ ] Verify payment processing works
- [ ] Check email notifications
- [ ] Test admin dashboard access
- [ ] Confirm database connectivity

### Business Setup  
- [ ] Add sample schedules and departures
- [ ] Configure email templates
- [ ] Set up Stripe payment methods
- [ ] Test customer service workflows
- [ ] Train staff on admin dashboard

### Marketing Activation
- [ ] Update Google My Business
- [ ] Launch social media campaigns  
- [ ] Enable Google Analytics
- [ ] Set up conversion tracking
- [ ] Begin customer acquisition

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check TypeScript errors
npm run type-check

# Verify dependencies
npm audit fix
```

#### Database Connection Issues
```bash
# Test database connection
npx prisma db push --preview-feature

# Reset database if needed
npx prisma migrate reset --force
```

#### Stripe Integration Issues
```bash
# Test Stripe keys
stripe balance retrieve --api-key sk_live_...

# Verify webhook endpoints
stripe webhooks list
```

### Support Contacts
- **Technical Issues**: GitHub Issues
- **Vercel Support**: Vercel Dashboard → Help
- **Stripe Support**: Stripe Dashboard → Help
- **Domain Issues**: Domain registrar support

---

**Deployment completed successfully!** 🎉

Your Skoot Transportation booking system is now live at **skoot.bike** and ready to accept bookings.

Next steps:
1. Monitor system performance
2. Train staff on admin features  
3. Begin customer acquisition campaigns
4. Set up regular backups and monitoring