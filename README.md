# Reddit Idea Generator

A SaaS MVP that transforms Reddit discussions into validated startup ideas. Built with Next.js, Supabase, Inngest, OpenAI, and Resend.

## Prerequisites

- **Node.js** 18+ and npm
- **Supabase** account ([supabase.com](https://supabase.com))
- **OpenAI** API key ([platform.openai.com](https://platform.openai.com))
- **Inngest** account ([inngest.com](https://inngest.com)) - for background workflows
- **Resend** account ([resend.com](https://resend.com)) - for email delivery (optional)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in `.env.local` with your credentials. For quick testing, you can use dummy values and enable `MOCK_MODE=true` to use mock data instead of real API calls.

3. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```
   
   > **Note:** First, link your Supabase project with `npm run db:link` if you haven't already.

4. **Start development servers:**
   ```bash
   npm run dev:all
   ```
   
   This starts both:
   - **Next.js** on `http://localhost:3000`
   - **Inngest Dev Server** on `http://localhost:8288`

## Architecture Overview

### Data Flow

1. **Sources** → Reddit posts are fetched from specified subreddits (e.g., r/entrepreneur)
2. **Signals** → Posts are analyzed by OpenAI to extract pain points
3. **Ideas** → Pain points are converted into validated SaaS product ideas
4. **Scoring** → Each idea receives a score (0-100) based on market potential
5. **Delivery** → Ideas are delivered via dashboard and email digests

### Tech Stack

- **Next.js 16** (App Router) - Frontend & API routes
- **TypeScript** - Type safety
- **Supabase** - PostgreSQL database & Authentication
- **Inngest** - Background job processing & scheduled workflows
- **OpenAI** - LLM for pain point analysis and idea generation
- **Resend** - Email delivery for idea digests

### Inngest Workflow

The core workflow (`inngest/functions/scrape-and-generate.ts`) runs automatically every 6 hours via cron, or can be triggered manually:

1. Fetches rising posts from Reddit
2. Analyzes pain points using OpenAI
3. Generates SaaS ideas for each pain point
4. Persists ideas to database
5. Sends email digests to subscribed users (only when new ideas are created)

**Cron Schedule**: Runs every 6 hours (`0 */6 * * *`)

Test workflows in the Inngest Dev Server UI at `http://localhost:8288`.

## Key Features

- ✅ **Source Linking** - Each idea links back to the Reddit posts that inspired it
- ✅ **Authentication** - Magic link authentication via Supabase Auth
- ✅ **Email Digests** - Automatic email updates with new ideas after each workflow run
- ✅ **Mock Mode** - Development without API quotas using `MOCK_MODE=true`
- ✅ **Row Level Security** - Database access controlled via Supabase RLS policies

## Environment Variables

Required variables (see `.env.example` for full list):

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (required for production)
OPENAI_API_KEY=your-api-key

# Email (optional)
RESEND_API_KEY=your-api-key
RESEND_FROM_EMAIL="Your App <onboarding@resend.dev>"

# App Configuration
MOCK_MODE=true  # Set to false for production
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Validation Scripts

Run these to verify each system component:

```bash
npm run db:validate      # Database connectivity
npm run ingest:validate  # Reddit ingestion service
npm run llm:validate     # LLM extraction & ideation
npm run workflow:test    # Inngest workflow pipeline
npm run ui:validate      # Landing page & dashboard
npm run auth:validate    # Authentication & email
npm run flow:validate    # Email digest flow
```

## Security

- **XSS Prevention**: All user-generated content is sanitized (React default escaping + HTML escaping in emails)
- **RLS Policies**: Database tables use Row Level Security - ideas are publicly readable, but only service role can write
- **Inngest Workflows**: All background jobs run securely via Inngest's managed infrastructure

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Inngest Documentation](https://www.inngest.com/docs)

## License

MIT
