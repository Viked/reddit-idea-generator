This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Running the Development Environment

For testing and development, use the unified dev script that runs both Next.js and Inngest dev servers:

```bash
npm run dev:all
```

This will start:
- **Next.js dev server** on `http://localhost:3000`
- **Inngest dev server** on `http://localhost:8288`

Both servers run concurrently with color-coded output for easy monitoring.

### Running Individual Servers

If you need to run servers separately:

```bash
# Next.js only
npm run dev

# Inngest only
npm run inngest:dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Configuration

Before running the application, you need to set up your environment variables.

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your environment variables in `.env.local`:**
   - **Supabase**: Get your project URL and keys from your [Supabase Dashboard](https://app.supabase.com)
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep this secret!)
   
   - **OpenAI**: Get your API key from [OpenAI Platform](https://platform.openai.com)
     - `OPENAI_API_KEY`: Your OpenAI API key
   
   - **Inngest**: Get your keys from your [Inngest Dashboard](https://app.inngest.com)
     - `INNGEST_EVENT_KEY`: Your Inngest event key
     - `INNGEST_SIGNING_KEY`: Your Inngest signing key
   
   - **App Logic**:
     - `MOCK_MODE`: Set to `"true"` to enable mock mode (default), or `"false"` for production
     - `REDDIT_USER_AGENT`: A user agent string for Reddit API requests (e.g., `"MyApp/1.0 by /u/yourusername"`)
   
   - **Email** (Resend): Get your API key from [Resend](https://resend.com)
     - `RESEND_API_KEY`: Your Resend API key
     - `RESEND_FROM_EMAIL`: Email address to send from (e.g., `"Reddit Idea Generator <onboarding@resend.dev>"`)
   
   - **Site Configuration**:
     - `NEXT_PUBLIC_SITE_URL`: Your site URL (e.g., `http://localhost:3000` for local dev, `https://yourdomain.com` for production)
   
   - **Cron Configuration** (optional):
     - `EMAIL_DIGEST_INTERVAL_HOURS`: Hours to look back for ideas in digest emails (default: `24`)

### MOCK_MODE

When `MOCK_MODE` is set to `"true"` (default), the application will use mock data instead of making real API calls. This is useful for:
- Development and testing without consuming API quotas
- Demonstrating the application without external dependencies
- Local development when services are unavailable

Set `MOCK_MODE` to `"false"` to enable production mode with real API integrations.

**Note**: Environment variable validation runs automatically on import. If any required variables are missing or invalid, the application will fail to start with a clear error message listing the missing keys.

## Database Setup

After configuring your environment variables, you need to apply the database migrations to create the required tables.

### Option 1: Using Supabase CLI (Recommended)

1. **Login to Supabase:**
   ```bash
   npx supabase login
   ```
   This will open your browser to authenticate with your Supabase account.

2. **Link your Supabase project:**
   ```bash
   npm run db:link
   ```
   This will prompt you for your project reference ID (found in your Supabase project settings).

3. **Push migrations:**
   ```bash
   npm run db:migrate
   ```
   This will apply all migrations in `supabase/migrations/` to your remote database.

4. **Check migration status:**
   ```bash
   npm run db:status
   ```

### Option 2: Using Supabase Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the contents of `supabase/migrations/20240101000000_initial_schema.sql`
5. Paste and run the SQL in the editor

### Validate Database Connection

After running migrations, validate your database connection:

```bash
npm run db:validate
```

This will confirm that:
- Your environment variables are correctly configured
- The database connection is working
- The required tables exist

If validation fails, the script will provide helpful error messages and guidance on how to fix the issue.

### Database Health Check API

Once your application is running, you can check the database health via the API endpoint:

**Endpoint:** [`GET /api/health/db`](app/api/health/db/route.ts)

This endpoint performs a real-time database connection check and returns:
- `status`: `'ok'` if the database is accessible, `'error'` if there's an issue
- `timestamp`: ISO timestamp of the check
- `latency`: Response time in milliseconds
- `count`: Number of rows in the `subreddits` table (on success)

**Example response (success):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "latency": "45ms",
  "count": 0
}
```

**Example response (error):**
```json
{
  "status": "error",
  "message": "Could not find the table 'public.subreddits' in the schema cache",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "latency": "12ms"
}
```

You can test this endpoint by visiting `http://localhost:3000/api/health/db` when your development server is running.

## Inngest Workflow Testing

The application uses Inngest for background job processing and scheduled workflows. To test Inngest workflows:

### Start Development Environment

Use the unified dev script to run both servers:

```bash
npm run dev:all
```

This starts:
- Next.js on `http://localhost:3000`
- Inngest Dev Server on `http://localhost:8288`

### Testing Workflows

1. **Access Inngest Dev Server UI:**
   - Open `http://localhost:8288` in your browser
   - Navigate to the "Functions" tab to see registered functions
   - Navigate to the "Events" tab to send test events

2. **Send Test Events:**
   - In the Inngest UI, click "Send event"
   - Event name: `app/scrape`
   - Event data (optional): `{ "subreddit": "entrepreneur" }`
   - If `subreddit` is omitted, it defaults to `"entrepreneur"`

3. **Monitor Function Execution:**
   - Check the "Runs" tab to see function execution history
   - View step-by-step execution logs and results

### Validate Workflow Logic (Without Inngest Server)

To test the workflow logic chain without running the full Inngest server:

```bash
npm run workflow:test
```

This script:
- Forces `MOCK_MODE=true`
- Executes the full pipeline: Fetch → Analyze → Ideate
- Validates that at least one valid `Idea` object is produced
- Useful for CI/CD and quick validation

**Note**: Always use `npm run dev:all` for testing Inngest workflows, as it ensures both servers are running and functions are properly registered.

## Authentication & Email Delivery

The application uses Supabase Auth for authentication with magic links and Resend for email delivery.

### Authentication Flow

1. **User visits `/login`** → Enters email address
2. **Magic Link Sent** → Supabase sends a magic link email via Resend
3. **User clicks link** → Redirects to `/auth/callback?code=...`
4. **Session Created** → Code is exchanged for a session, user record is created in `users` table
5. **Redirect to Dashboard** → User is redirected to `/dashboard` where they can view ideas

### Email Delivery Flow

1. **User Subscribes** → User clicks "Subscribe to Updates" button in dashboard header
2. **Subscription Saved** → User's `subscription_topics` array is updated in database
3. **Confirmation Email Sent** → User receives a subscription confirmation email
4. **Cron Job Runs** → Scheduled cron job at `/api/cron/email-digest` (interval configurable)
5. **Ideas Fetched** → System fetches ideas created in the configured time interval
6. **Emails Sent** → Personalized digest emails sent to all subscribed users via Resend

**Note:** Users also receive confirmation emails when they unsubscribe.

### Testing the Full Flow

#### Prerequisites

1. **Supabase Setup:**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Enable Email Auth in Authentication settings
   - Configure email templates (or use default)
   - Get your project URL and API keys

2. **Resend Setup:**
   - Create account at [resend.com](https://resend.com)
   - Get your API key from dashboard
   - Verify a domain (or use `onboarding@resend.dev` for testing)
   - Set `RESEND_FROM_EMAIL` in your `.env.local`

3. **Environment Variables:**
   ```bash
   # Required for authentication
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   
   # Required for email delivery
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL="Reddit Idea Generator <onboarding@resend.dev>"
   
   # Disable mock mode to use real services
   MOCK_MODE=false
   ```

#### Step-by-Step Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test Authentication:**
   - Navigate to `http://localhost:3000/login`
   - Enter a test email (e.g., `test@example.com`)
   - Click "Send Magic Link"
   - Check your email inbox for the magic link
   - Click the link to authenticate
   - You should be redirected to `/dashboard`

3. **Test Subscription:**
   - Once logged in, you'll see the dashboard
   - Click "Subscribe to Updates" button in the header
   - Button should change to "Unsubscribe"
   - **Check your email** - You should receive a subscription confirmation email
   - Check your database to verify `subscription_topics` contains `["all"]`
   - Click "Unsubscribe" to test unsubscription
   - **Check your email again** - You should receive an unsubscription confirmation email

4. **Test Email Delivery:**
   - First, ensure you have some ideas in the database (from Inngest workflow or manual insert)
   - Manually trigger the email digest cron:
     ```bash
     curl http://localhost:3000/api/cron/email-digest
     ```
   - Or visit `http://localhost:3000/api/cron/email-digest` in your browser
   - Check your email inbox for the digest email
   - Email should contain all ideas from the configured time interval (default: 24 hours)

5. **Validate Auth System:**
   ```bash
   npm run auth:validate
   ```
   This will:
   - Check that `proxy.ts` exists
   - Validate Resend configuration
   - Test email sending functionality

### Sample Test Credentials

For local development and testing, you can use these sample values:

```bash
# Supabase (replace with your actual values)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend (replace with your actual API key)
RESEND_API_KEY=re_1234567890abcdefghijklmnopqrstuvwxyz
RESEND_FROM_EMAIL="Reddit Idea Generator <onboarding@resend.dev>"

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Disable mock mode for real email testing
MOCK_MODE=false

# Cron Configuration (optional)
EMAIL_DIGEST_INTERVAL_HOURS=24
```

**Important Notes:**
- Replace all sample values with your actual credentials
- Never commit `.env.local` to version control
- For production, use a verified domain in `RESEND_FROM_EMAIL`
- The `onboarding@resend.dev` email only works in development/testing

### Email Digest Cron Job

The email digest cron job can be configured in Vercel or triggered manually:

**Configurable Interval:**
Set `EMAIL_DIGEST_INTERVAL_HOURS` in your environment variables to control how far back the cron job looks for ideas:
```bash
# Development: Check last 1 hour
EMAIL_DIGEST_INTERVAL_HOURS=1

# Staging: Check last 6 hours
EMAIL_DIGEST_INTERVAL_HOURS=6

# Production: Check last 24 hours (default)
EMAIL_DIGEST_INTERVAL_HOURS=24
```

**Manual Trigger:**
```bash
# Using curl
curl http://localhost:3000/api/cron/email-digest

# Or visit in browser
http://localhost:3000/api/cron/email-digest
```

**Vercel Cron Configuration:**
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/email-digest",
    "schedule": "0 9 * * *"
  }]
}
```
This runs daily at 9 AM UTC. Adjust the schedule based on your `EMAIL_DIGEST_INTERVAL_HOURS` setting.

**Optional Security:**
Add `CRON_SECRET` to your environment variables and configure Vercel to send it as a Bearer token:
```bash
CRON_SECRET=your-secret-key-here
```

**Response Format:**
The cron endpoint returns JSON with execution details:
```json
{
  "message": "Email digest processed",
  "ideasFound": 5,
  "usersProcessed": 3,
  "emailsSent": 3,
  "emailsFailed": 0,
  "intervalHours": 24,
  "results": [...]
}
```

### Troubleshooting

**Authentication Issues:**
- Check Supabase Auth settings: Email templates, redirect URLs
- Verify `NEXT_PUBLIC_SITE_URL` matches your actual site URL
- Check browser console for errors
- Verify Supabase project has email auth enabled

**Email Delivery Issues:**
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for delivery status
- Ensure `RESEND_FROM_EMAIL` uses a verified domain (or `onboarding@resend.dev` for testing)
- Check server logs for email sending errors
- If `MOCK_MODE=true`, emails will only be logged to console

**Subscription Issues:**
- Verify user record exists in `users` table
- Check `subscription_topics` array contains `["all"]`
- Ensure user is authenticated (check session)
- Check email inbox for confirmation emails (subscribe/unsubscribe)
- If confirmation emails aren't arriving, check Resend dashboard and server logs

**Cron Job Issues:**
- Verify `EMAIL_DIGEST_INTERVAL_HOURS` is set correctly (defaults to 24 if not set)
- Check that ideas exist within the configured time interval
- Verify subscribed users exist in database
- Check cron job response for error details

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
