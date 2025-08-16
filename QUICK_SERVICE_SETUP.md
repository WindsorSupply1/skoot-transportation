# 🔧 Quick Service Setup Guide

## 1. Google OAuth Setup (5 minutes)

### Step-by-Step:
1. **Go to:** [Google Cloud Console](https://console.developers.google.com)
2. **Sign in** with your Google account
3. **Create new project** or select existing one
4. **Enable APIs:**
   - Click "Enable APIs and Services"
   - Search for "Google+ API" and enable it
5. **Create Credentials:**
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - **Name:** SKOOT Transportation
   - **Authorized redirect URIs:** `https://your-domain.com/api/auth/callback/google`
6. **Copy:** Client ID and Client Secret

---

## 2. Amazon Login Setup (5 minutes)

### Step-by-Step:
1. **Go to:** [Amazon Developer Console](https://developer.amazon.com)
2. **Sign in** with your Amazon account
3. **Login with Amazon:**
   - Go to "Login with Amazon" 
   - Click "Create a New Security Profile"
4. **Fill out:**
   - **Security Profile Name:** SKOOT Transportation
   - **Security Profile Description:** Shuttle booking system
   - **Consent Privacy Notice URL:** https://your-domain.com/privacy
5. **Web Settings:**
   - **Allowed Origins:** `https://your-domain.com`
   - **Allowed Return URLs:** `https://your-domain.com/api/auth/callback/amazon`
6. **Copy:** Client ID and Client Secret

---

## 3. Stripe Setup (10 minutes)

### Step-by-Step:
1. **Go to:** [Stripe Dashboard](https://dashboard.stripe.com)
2. **Create account** or sign in
3. **Complete business verification** (required for live payments):
   - Business information
   - Bank account details
   - Identity verification
4. **Get API Keys:**
   - Go to "Developers" → "API Keys"
   - Copy **Publishable Key** (starts with `pk_live_`)
   - Copy **Secret Key** (starts with `sk_live_`)
5. **Set up Webhook:**
   - Go to "Developers" → "Webhooks"
   - Click "Add endpoint"
   - **URL:** `https://your-domain.com/api/stripe/webhook`
   - **Events:** Select `payment_intent.succeeded` and `payment_intent.payment_failed`
   - Copy **Webhook Secret** (starts with `whsec_`)

---

## 4. Email Setup (Gmail) (5 minutes)

### Step-by-Step:
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Go to:** Google Account Settings → Security
3. **App Passwords:**
   - Click "App Passwords"
   - Select "Mail" for app type
   - Generate password
4. **Copy:** 
   - **SMTP Username:** your-email@gmail.com
   - **SMTP Password:** (the app password you just generated)

---

## 5. Database Setup (Supabase - Free) (10 minutes)

### Step-by-Step:
1. **Go to:** [Supabase](https://supabase.com)
2. **Create account** and new project
3. **Project Settings:**
   - Go to Settings → Database
   - Copy the **Connection String** (URI)
4. **Security:**
   - Go to Settings → API
   - Note the service role key (for later if needed)

---

## Quick Reference Card

Copy this and fill it out as you complete each service:

```
DOMAIN: ___________________________

GOOGLE OAUTH:
Client ID: ________________________
Client Secret: ____________________

AMAZON LOGIN:
Client ID: ________________________
Client Secret: ____________________

STRIPE:
Publishable Key: __________________
Secret Key: _______________________
Webhook Secret: ___________________

EMAIL:
Gmail Address: ____________________
App Password: _____________________

DATABASE:
Connection URL: ___________________
```

---

## 🎯 Pro Tips:

### Security:
- Use a dedicated business Gmail account
- Keep all credentials secure and private
- Never share API keys publicly

### Testing:
- Start with Stripe test mode first
- Test OAuth logins before going live
- Verify email delivery works

### Backup:
- Save all credentials in a secure password manager
- Document which accounts were used for setup
- Keep business verification documents handy

---

**Once you have all these credentials, run `node deploy.js` in your project folder!**