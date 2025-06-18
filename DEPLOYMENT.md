# BugBoard AI - Deployment Guide

This guide will help you deploy BugBoard AI to a production environment.

## Prerequisites

- Node.js 18 or later
- PostgreSQL database
- Vercel account (for frontend deployment)
- Supabase account (for authentication and database)

## Environment Variables

Create a `.env.local` file in the `frontend` directory with the following variables:

```env
# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bugboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Admin User (for initial setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
```

## Local Development

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

### 1. Deploy to Vercel

1. Push your code to a GitHub repository.
2. Import the repository to Vercel.
3. Add the environment variables in the Vercel project settings.
4. Deploy!

### 2. Set Up Database

1. Create a new PostgreSQL database.
2. Run the database migrations:
   ```bash
   npx prisma migrate deploy
   ```

### 3. Set Up Supabase

1. Create a new project in Supabase.
2. Set up authentication providers.
3. Configure the required tables and RLS policies.

## Initial Setup

1. After deployment, visit `/admin` and log in with the admin credentials.
2. Create additional users and configure roles as needed.

## Running Tests

### Unit Tests
```bash
npm test
```

### End-to-End Tests
1. Start the development server:
   ```bash
   npm run dev
   ```

2. In a new terminal, run:
   ```bash
   npx playwright test
   ```

## Troubleshooting

- **Database Connection Issues**: Verify your `DATABASE_URL` and ensure the database is accessible.
- **Authentication Problems**: Check your Supabase configuration and environment variables.
- **Build Failures**: Ensure all dependencies are installed and environment variables are set.

## Support

For support, please open an issue in the GitHub repository.
