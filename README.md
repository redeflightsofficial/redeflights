# Pride-i-Flights Frontend

Next.js frontend using Supabase directly for authentication and data access.

## Environment Setup

Create `.env.local`:

```bash
cp .env.local.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Deploy on Vercel (recommended). Add the same two environment variables in project settings.

## Notes

- This app does not require a separate Nest backend to run.
- Keep Supabase RLS enabled and define policies for each table before production use.
