# ARRA Hub

Creative operations for ARRA Studios and Squatch Media, built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Local setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and add Supabase credentials (optional; the interface uses complete demo data without them).
3. Run `pnpm dev`.
4. Apply `supabase/migrations/202608160001_initial_schema.sql` in Supabase, then `supabase/seed.sql` for development data.

## Validation

Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.

The UI is intentionally demo-first. `lib/supabase/client.ts` returns a configured browser client when environment variables exist; otherwise the app remains fully navigable with realistic local data.
