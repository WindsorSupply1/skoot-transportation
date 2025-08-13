# Skoot Transportation Database Setup Guide

This guide walks you through setting up the Skoot Transportation database schema from scratch.

## Quick Start

If you just want to get up and running quickly:

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your database URL
# DATABASE_URL="postgresql://username:password@localhost:5432/skoot_transportation"

# 3. Install dependencies
npm install

# 4. Setup everything at once
npm run db:setup
```

## Detailed Setup

### Option 1: Using Docker (Recommended for Development)

1. **Start PostgreSQL with Docker**
   ```bash
   # Start PostgreSQL and Adminer
   docker-compose up -d
   
   # Check if containers are running
   docker-compose ps
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` to use the Docker database:
   ```env
   DATABASE_URL="postgresql://skoot_user:skoot_password@localhost:5432/skoot_transportation"
   ```

3. **Install dependencies and setup database**
   ```bash
   npm install
   npm run db:setup
   ```

4. **Access database management**
   - **Prisma Studio**: `npm run db:studio` (http://localhost:5555)
   - **Adminer**: http://localhost:8080
     - Server: `postgres`
     - Username: `skoot_user`
     - Password: `skoot_password`
     - Database: `skoot_transportation`

### Option 2: Using Local PostgreSQL

1. **Install PostgreSQL locally**
   - Download from https://postgresql.org/
   - Create a database named `skoot_transportation`
   - Create a user with access to the database

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your local database details:
   ```env
   DATABASE_URL="postgresql://your_user:your_password@localhost:5432/skoot_transportation"
   ```

3. **Install dependencies and setup database**
   ```bash
   npm install
   npm run db:setup
   ```

### Option 3: Using SQLite (Development Only)

1. **Configure for SQLite**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` to use SQLite:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

2. **Install and setup**
   ```bash
   npm install
   npm run db:setup
   ```

## Manual Setup Steps

If you prefer to run each step manually:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run db:generate

# 3. Push schema to database (creates tables)
npm run db:push

# 4. Seed database with sample data
npm run db:seed

# 5. Open Prisma Studio to view data
npm run db:studio
```

## Production Setup

For production deployment:

1. **Use proper database URL**
   ```env
   DATABASE_URL="postgresql://username:password@production-host:5432/skoot_transportation"
   NODE_ENV="production"
   ```

2. **Run migrations instead of db:push**
   ```bash
   # Generate initial migration
   npx prisma migrate dev --name init

   # Deploy to production
   npm run db:migrate:prod
   
   # Seed production data (optional)
   npm run db:seed
   ```

## Verification Steps

After setup, verify everything is working:

1. **Check database connection**
   ```bash
   npx prisma db pull
   ```

2. **View data in Prisma Studio**
   ```bash
   npm run db:studio
   # Opens http://localhost:5555
   ```

3. **Check seeded data**
   - Users: Should have 5 users including admin
   - Routes: 1 route (Columbia to CLT)
   - Schedules: 56 schedules (8 times × 7 days)
   - Departures: ~240 departures (next 30 days)
   - Locations: 7 locations (5 pickup + 1 stop + 1 destination)
   - Bookings: 10 sample bookings
   - Testimonials: 5 testimonials
   - FAQs: 10 FAQ entries

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Reset and try again
npm run db:reset
```

### Docker Issues

```bash
# View logs
docker-compose logs postgres

# Restart containers
docker-compose down
docker-compose up -d
```

### Migration Issues

```bash
# Reset migrations
npm run db:reset

# Or manually reset
npx prisma migrate reset --force
```

### Seeding Issues

```bash
# Run seed separately
npm run db:seed

# Or reset everything
npm run db:reset
```

## Database Schema Exploration

Once set up, explore the schema:

1. **Prisma Studio** (Visual interface)
   ```bash
   npm run db:studio
   ```

2. **Database queries** (using Prisma Client)
   ```javascript
   import { PrismaClient } from '@prisma/client'
   const prisma = new PrismaClient()
   
   // Get all routes
   const routes = await prisma.route.findMany()
   
   // Get upcoming departures
   const departures = await prisma.departure.findMany({
     where: { date: { gte: new Date() } },
     include: { schedule: true }
   })
   ```

3. **Direct SQL queries** (via Adminer or psql)
   ```sql
   SELECT * FROM routes;
   SELECT * FROM schedules;
   SELECT * FROM departures WHERE date >= NOW();
   ```

## Next Steps

After database setup:

1. **Build your application** using the Prisma Client
2. **Customize the schema** as needed for your requirements
3. **Add more seed data** for testing
4. **Set up your API layer** (REST, GraphQL, etc.)
5. **Configure authentication** and user management
6. **Set up email notifications** using the email templates

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs` or application logs
2. Verify environment variables in `.env`
3. Ensure database is accessible
4. Try resetting: `npm run db:reset`
5. Check Prisma documentation: https://www.prisma.io/docs/