# 🚀 SKOOT Transportation Deployment Checklist

## Phase 1: Pre-Deployment Setup (30 minutes)

### ☐ 1. Verify System Readiness
```bash
node verify-setup.js
```

### ☐ 2. Configure Environment Variables
```bash
node deploy.js
```
This will ask for:
- Domain name
- Google OAuth credentials
- Amazon Login credentials  
- Stripe live API keys
- Database URL
- Email settings

### ☐ 3. Test Build
```bash
npm run build
```

---

## Phase 2: External Services (45 minutes)

### ☐ 4. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.developers.google.com)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 Client ID (Web application)
4. Add redirect URI: `https://your-domain.com/api/auth/callback/google`
5. Copy Client ID and Secret

### ☐ 5. Amazon Login Setup  
1. Go to [Amazon Developer Console](https://developer.amazon.com)
2. Create Security Profile for "Login with Amazon"
3. Add return URL: `https://your-domain.com/api/auth/callback/amazon`
4. Copy Client ID and Secret

### ☐ 6. Stripe Live Mode Setup
1. Complete business verification in [Stripe Dashboard](https://dashboard.stripe.com)
2. Copy live API keys (pk_live_... and sk_live_...)
3. Create webhook endpoint: `https://your-domain.com/api/stripe/webhook`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy webhook secret

---

## Phase 3: Database Setup (15 minutes)

### ☐ 7. Production Database
**Recommended:** Supabase (free tier)
1. Create account at [Supabase](https://supabase.com)
2. Create new project
3. Copy connection string
4. Update DATABASE_URL in environment

### ☐ 8. Database Migration
```bash
npx prisma db push
npx prisma generate
```

### ☐ 9. Create Admin Account & Initial Data
```bash
node setup-admin.js
```

---

## Phase 4: Hosting Deployment (20 minutes)

### ☐ 10. Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

### ☐ 11. Configure Environment Variables
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all variables from `.env.production`
3. Redeploy if needed

### ☐ 12. Connect Custom Domain
1. In Vercel Dashboard → Project → Settings → Domains
2. Add your domain (e.g., skoot.bike)
3. Configure DNS with your registrar:
   ```
   Type: CNAME, Name: www, Value: your-project.vercel.app
   Type: A, Name: @, Value: 76.76.19.61
   ```

---

## Phase 5: Testing & Validation (30 minutes)

### ☐ 13. Functionality Testing
- [ ] Homepage loads correctly
- [ ] Booking wizard works end-to-end
- [ ] Google OAuth login works
- [ ] Amazon Login works
- [ ] Payment processing works (test mode)
- [ ] Admin panel accessible
- [ ] Email receipts delivered

### ☐ 14. Mobile Testing
- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] Payment forms work on mobile
- [ ] Loading performance acceptable

### ☐ 15. Admin Testing
- [ ] Admin login works
- [ ] Pickup locations management
- [ ] Booking dashboard functional
- [ ] Reports and analytics working

---

## Phase 6: Go Live (15 minutes)

### ☐ 16. Enable Live Payments
1. Switch Stripe to live mode
2. Update STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY
3. Test with real payment (small amount)
4. Verify webhook delivery

### ☐ 17. Set Up Monitoring
- [ ] Check Vercel function logs
- [ ] Monitor Stripe webhook delivery
- [ ] Set up email notifications for errors
- [ ] Verify database performance

### ☐ 18. Business Operations
- [ ] Train staff on admin panel
- [ ] Set up customer support procedures
- [ ] Create booking confirmation templates
- [ ] Establish refund policies

---

## Phase 7: Launch Strategy (Ongoing)

### ☐ 19. Soft Launch (Week 1)
- [ ] Announce to friends and family
- [ ] Limited daily capacity
- [ ] Monitor system closely
- [ ] Collect feedback

### ☐ 20. Public Launch (Week 2+)
- [ ] Social media announcement
- [ ] Website traffic campaigns
- [ ] SEO optimization
- [ ] Customer acquisition campaigns

---

## Emergency Contacts

### Technical Issues
- **Vercel Support:** support@vercel.com
- **Stripe Support:** support@stripe.com  
- **Supabase Support:** support@supabase.io

### Quick Commands
```bash
# Check deployment status
vercel ls

# View live logs
vercel logs

# Rollback deployment
vercel rollback [deployment-url]

# Database access
npx prisma studio

# Run admin setup again
node setup-admin.js
```

---

## Success Metrics to Track

### Week 1 Targets
- [ ] 100% uptime
- [ ] <3 second page load times
- [ ] >90% payment success rate
- [ ] Zero critical errors

### Month 1 Targets  
- [ ] >80% booking conversion rate
- [ ] Positive customer feedback
- [ ] Operational efficiency gains
- [ ] Revenue targets met

---

**🎉 Once all items are checked, your SKOOT Transportation booking system is live and ready for customers!**

**Support:** Check PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions on each step.