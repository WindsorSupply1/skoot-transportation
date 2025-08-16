# 🚀 SKOOT Transportation - Complete Production Deployment Guide

## Prerequisites Checklist ✅

Before we start, ensure you have:
- [ ] Domain name ready (e.g., skoot.bike)
- [ ] Hosting platform chosen (Vercel recommended)
- [ ] Business email address
- [ ] Business bank account for Stripe
- [ ] Phone number for business verification

---

## Step 1: External Service Setup (30 minutes)

### A. Google OAuth Setup (10 minutes)
1. Go to [Google Cloud Console](https://console.developers.google.com)
2. Create new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
7. Copy Client ID and Client Secret

### B. Amazon Login Setup (10 minutes)
1. Go to [Amazon Developer Console](https://developer.amazon.com)
2. Sign in with Amazon account
3. Go to "Login with Amazon" → "Create a New Security Profile"
4. Add your domain to "Allowed Return URLs": `https://your-domain.com/api/auth/callback/amazon`
5. Copy Client ID and Client Secret

### C. Stripe Account Setup (10 minutes)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Complete business verification (required for live payments)
3. Go to Developers → API Keys
4. Copy Publishable Key and Secret Key (live mode)
5. Go to Developers → Webhooks → Add endpoint
6. Add webhook URL: `https://your-domain.com/api/stripe/webhook`
7. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
8. Copy Webhook Secret

---

## Step 2: Environment Variables Configuration

### Production Environment Variables (.env.production)
```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-32-character-random-string"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Amazon Login
AMAZON_CLIENT_ID="your_amazon_client_id"
AMAZON_CLIENT_SECRET="your_amazon_client_secret"

# Stripe Payment Processing
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-business-email@gmail.com"
SMTP_PASS="your-app-specific-password"
FROM_EMAIL="noreply@your-domain.com"

# Business Configuration
BUSINESS_NAME="SKOOT Transportation"
SUPPORT_EMAIL="support@your-domain.com"
SUPPORT_PHONE="+1-803-SKOOT-SC"
```

---

## Step 3: Database Setup

### A. Production Database (PostgreSQL)
**Recommended Providers:**
- Supabase (free tier available)
- Railway
- PlanetScale
- AWS RDS

### B. Database Migration
```bash
# Apply schema to production database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed initial data (optional)
npx prisma db seed
```

---

## Step 4: Hosting Deployment (Vercel Recommended)

### A. Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`
4. Add environment variables in Vercel dashboard
5. Connect custom domain

### B. Alternative: Netlify
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables
5. Connect custom domain

---

## Step 5: Domain Configuration

### A. DNS Setup
```
Type: CNAME
Name: www
Value: your-vercel-app.vercel.app

Type: A
Name: @
Value: 76.76.19.61 (Vercel IP)
```

### B. SSL Certificate
- Automatic with Vercel/Netlify
- Verify HTTPS is working

---

## Step 6: Email Configuration

### A. Gmail App Password Setup
1. Enable 2-factor authentication on Gmail
2. Go to Google Account Settings → Security
3. Generate App Password for "Mail"
4. Use this password in SMTP_PASS environment variable

### B. Custom Domain Email (Optional)
- Set up email forwarding
- Configure SPF/DKIM records
- Test email delivery

---

## Step 7: Initial Data Setup

### A. Admin Account Creation
```bash
# Run the admin creation script
node create-admin.js
```

### B. Pickup Locations Setup
1. Login to admin panel: `/admin`
2. Go to "Pickup Locations"
3. Add Columbia area locations:
   - Hotel Trundle (Downtown Columbia)
   - McDonald's Parklane Road
   - USC Campus (optional)
   - Columbia Metropolitan Airport (return trips)

### C. Route Configuration
1. Go to "Routes" in admin panel
2. Create route: "Columbia to Charlotte Airport"
3. Set duration: 120 minutes
4. Configure pricing tiers

---

## Step 8: Testing & Validation

### A. Booking Flow Test
- [ ] Complete guest booking flow
- [ ] Test Google OAuth login
- [ ] Test Amazon Login
- [ ] Test payment processing
- [ ] Verify receipt emails

### B. Admin Functions Test
- [ ] Login to admin panel
- [ ] Create/edit pickup locations
- [ ] View booking dashboard
- [ ] Process test refund

### C. Mobile Testing
- [ ] Test responsive design
- [ ] Verify mobile payment flow
- [ ] Check loading performance

---

## Step 9: Go-Live Checklist

### A. Security Verification
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Admin panel protected

### B. Performance Check
- [ ] Page load times < 3 seconds
- [ ] Payment processing working
- [ ] Email delivery functional
- [ ] Error monitoring setup

### C. Business Operations
- [ ] Customer support procedures
- [ ] Driver communication system
- [ ] Refund/cancellation policies
- [ ] Marketing materials updated

---

## Step 10: Launch Strategy

### A. Soft Launch (Week 1)
- Friends and family testing
- Limited booking availability
- Monitor system performance
- Gather feedback

### B. Public Launch (Week 2)
- Social media announcement
- Website traffic direction
- Customer acquisition campaigns
- Monitor booking conversions

### C. Growth Phase (Month 1-3)
- Analytics tracking
- Customer feedback collection
- System optimization
- Phase 2 planning

---

## Support & Maintenance

### A. Monitoring
- Set up error tracking (Sentry)
- Monitor payment success rates
- Track booking conversions
- Database performance monitoring

### B. Regular Tasks
- Weekly booking report review
- Monthly security updates
- Quarterly system backups
- Performance optimization

### C. Customer Support
- Booking assistance procedures
- Payment issue resolution
- Refund processing workflows
- Technical support escalation

---

## Emergency Contacts & Resources

### Technical Support
- Vercel Support: support@vercel.com
- Stripe Support: support@stripe.com
- Google OAuth: console.developers.google.com/support

### Business Support
- Payment Processing Issues: Stripe Dashboard
- DNS/Domain Issues: Domain registrar support
- Email Issues: Gmail/G Suite support

---

**🎉 Congratulations! Your SKOOT Transportation booking system is now live and ready to accept customers!**