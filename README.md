# my-poll

A "Favourite Lebanese Dish" poll built with Next.js, Tailwind, and Supabase.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. In Supabase, run `supabase/schema.sql` in the SQL Editor to create the `votes` table, its RLS policies, and enable Realtime.
3. Copy `.env.local.example` to `.env.local` and fill in the two values from your Supabase project (Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```
4. Run the dev server:
   ```
   npm run dev
   ```

## Deploy

Push to GitHub and import the repo in Vercel, adding the same two environment variables in the Vercel project settings.
