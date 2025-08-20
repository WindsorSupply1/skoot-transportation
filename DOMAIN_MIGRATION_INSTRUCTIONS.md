# Domain Migration Instructions - skoot.bike to Vercel

## Migration Date: [Tomorrow's Date]

## Current Status
- Site is **PRODUCTION-READY** on Vercel ✅
- Database: PostgreSQL on Neon Cloud ✅
- Stripe: Test keys configured ✅
- Authentication: NextAuth configured ✅
- Auto-deployment: GitHub → Vercel active ✅

## Step-by-Step Migration Process

### Step 1: Vercel Dashboard Setup
1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add these domains:
   - `skoot.bike`
   - `www.skoot.bike`
4. Vercel will show "Invalid Configuration" until DNS is updated

### Step 2: Squarespace DNS Changes

Go to: https://account.squarespace.com/domains/managed/skoot.bike/dns/dns-settings

#### Records to DELETE:
- [ ] A record pointing to `216.198.79.1`
- [ ] CNAME for www pointing to `ext-cust.squarespace.com`
- [ ] CNAME `_domainconnect` (Squarespace-specific)
- [ ] CNAME verification record starting with `kzphjqb33erfmc9zm9` (optional)

#### Records to ADD:
1. **Root Domain A Record:**
   - Type: A
   - Host: @ (or leave blank)
   - Points to: `76.76.21.21`
   - TTL: 3600 (or default)

2. **WWW CNAME Record:**
   - Type: CNAME
   - Host: www
   - Points to: `cname.vercel-dns.com`
   - TTL: 3600 (or default)

#### Records to KEEP (DO NOT DELETE):
- ✅ All MX records (Google Workspace email)
- ✅ TXT record for `google_domainkey`
- ✅ Any other Google verification records
- ✅ All other email-related records

### Step 3: Verify Migration

After making DNS changes:

1. **Check DNS Propagation** (5-30 minutes typically):
   ```bash
   nslookup skoot.bike
   nslookup www.skoot.bike
   ```

2. **Verify in Vercel Dashboard**:
   - Domains should show "Valid Configuration" ✅
   - SSL certificates will auto-provision

3. **Test Critical Functions**:
   - [ ] Homepage loads at https://skoot.bike
   - [ ] Booking flow works
   - [ ] Admin panel accessible at /admin
   - [ ] Payment processing (use test card: 4242 4242 4242 4242)
   - [ ] Email still working (@skoot.bike addresses)

### Step 4: Post-Migration Checklist

- [ ] Update NEXTAUTH_URL if needed (should already be https://skoot.bike)
- [ ] Test OAuth login (Google/Amazon)
- [ ] Verify Stripe webhooks are receiving events
- [ ] Check that auto-deployment from GitHub still works
- [ ] Monitor for any 404 errors or broken links

## Important Notes

- **DNS Propagation**: Can take up to 48 hours globally, but usually 1-4 hours
- **Email Service**: Will continue working uninterrupted (MX records unchanged)
- **Rollback Plan**: Keep note of old DNS values in case needed:
  - Old A record: 216.198.79.1
  - Old www CNAME: ext-cust.squarespace.com

## Troubleshooting

If site doesn't load after DNS propagation:
1. Verify domains in Vercel show "Valid Configuration"
2. Check SSL certificate provisioned in Vercel
3. Clear browser cache and try incognito mode
4. Verify DNS records using: https://dnschecker.org

## Support Contacts

- Vercel Support: https://vercel.com/support
- Squarespace DNS Help: https://support.squarespace.com/hc/en-us/articles/360002101888

## Documentation References

- Full project docs: See handoff documentation
- Repository: https://github.com/WindsorSupply1/skoot-transportation
- Current deployment: Vercel dashboard

---

Ready to migrate tomorrow! All systems checked and production-ready.