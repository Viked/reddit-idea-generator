#!/bin/bash

# Reddit Idea Generator - Setup Script
# This script initializes the project foundation

set -e  # Exit on error

echo "🚀 Setting up Reddit Idea Generator project..."

# Check if Next.js project already exists
if [ ! -f "package.json" ]; then
    echo "📦 Initializing Next.js 15 project..."
    npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
    # Note: If create-next-app doesn't support --yes, you may need to run interactively
else
    echo "✓ Next.js project already exists"
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install supabase @supabase/ssr inngest openai resend lucide-react clsx tailwind-merge

# Initialize Shadcn UI (creates components.json if it doesn't exist)
if [ ! -f "components.json" ]; then
    echo "🎨 Initializing Shadcn UI..."
    # Note: This may require interactive input. If so, run manually:
    # npx shadcn@latest init
    echo "⚠️  Please run 'npx shadcn@latest init' manually if components.json doesn't exist"
else
    echo "✓ Shadcn UI already configured"
fi

# Add Shadcn components
echo "🧩 Adding Shadcn components..."
npx shadcn@latest add button card badge input label skeleton sonner --yes
# Note: 'toast' is deprecated, using 'sonner' instead

# Create .cursor directory and rules.md
echo "📝 Creating .cursor/rules.md..."
mkdir -p .cursor
cat > .cursor/rules.md << 'EOF'
# Project Rules

## Stack
- Next.js 16 (Stable) (App Router)
- Supabase
- Inngest

## Rules
- Use Server Actions for mutations
- Use 'json_object' mode for all LLM outputs
- Strict TypeScript interfaces in `types`
- Strictly await `params` and `searchParams` in server components
- Turbopack is enabled by default

## Behavior
- Always plan before coding
EOF

# Create types directory and index.ts
echo "📁 Creating types/index.ts..."
mkdir -p types
cat > types/index.ts << 'EOF'
export interface Idea {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RedditPost {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  author: string;
  score: number;
  url: string;
  createdAt: Date;
}

export interface UserPreference {
  id: string;
  userId: string;
  subreddits: string[];
  keywords: string[];
  minScore: number;
  createdAt: Date;
  updatedAt: Date;
}
EOF

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start the development server"
echo "  2. Configure your environment variables"
echo "  3. Set up Supabase and Inngest"

