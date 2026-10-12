# MerchantAI — fixed setup

## Start the app

1. Install Node.js 20 or later.
2. Open a terminal inside the repository folder (where package.json is).
3. Run `npm ci`.
4. Copy `.env.example` to `.env.local`. On Windows PowerShell: `Copy-Item .env.example .env.local`. On macOS/Linux: `cp .env.example .env.local`.
5. Open your Supabase project's Connect dialog or Settings > API Keys. Paste the project URL and **publishable key** into `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_REAL_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_REAL_PUBLISHABLE_KEY
```

A legacy anon key also works: leave VITE_SUPABASE_PUBLISHABLE_KEY empty and set VITE_SUPABASE_ANON_KEY instead. The URL and key must belong to the same project. Do not use a service_role or sb_secret_ key in frontend variables. No OpenAI, Gemini, or other paid AI key is needed: the assistant uses a rule-based parser.

6. Set up the database below, then run `npm run dev`.
7. Restart the dev server whenever you edit environment variables. For hosting, add the same VITE_ variables to your build environment and redeploy; changing them after building does not update the bundle.

## Database setup

For a new project, run all six SQL files in `supabase/migrations` in filename order using the Supabase SQL Editor (or apply them through your Supabase CLI migration workflow). Do not rerun initial schema migrations against a database that already has them.

For a database already using the original ZIP, run `supabase/fix-existing-business-policy.sql` once. This allows an owner to read a newly created business before its first profile exists; otherwise registration's insert/select fails under RLS.

Email confirmation is supported. Register, confirm the email if requested, then sign in. Display-name metadata is saved during signup; the first authenticated login completes business/profile creation. Interrupted setup reuses the existing owned business. Existing accounts created by the original app without a profile or signup metadata need administrator-assisted profile setup.

## Optional demo data

Deploy the bundled `seed-demo` Edge Function to the same Supabase project. With the Supabase CLI installed and authenticated:

```sh
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy seed-demo
```

Keep authentication verification enabled. The hosted function uses Supabase's server-side SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY environment variables. These must never be copied into browser variables. Sign in before choosing Settings > Load Demo Data.

Demo AI and Solana payments are simulated; the database and login still require Supabase.

## Troubleshooting

- Setup screen: `.env.local` is missing, uses placeholders, or contains an invalid URL/key format.
- Invalid API key / HTTP 401: copy an active publishable (or legacy anon) key from the same project as the URL, then restart/rebuild. A syntactically valid key can still be revoked or from a different project.
- Invalid login credentials: use a registered account, confirm its email, or reset its password in your project.
- Missing tables/functions: apply the six database migrations.
- Registration permission error: apply the existing-business policy fix above.
- Demo function not found: deploy seed-demo to the project used by the frontend.

## Changes and verification

- Removed startup crash for missing credentials; an actionable setup screen appears before any authenticated code runs.
- Added publishable-key support, legacy anon compatibility, whitespace trimming, URL/key validation, and rejection of privileged browser keys.
- Demo function invocation now uses the Supabase SDK, which sends the API key header along with the user's access token.
- Auth initialization handles failures and schedules profile requests outside the auth callback to avoid lock contention.
- Fixed email-confirmation onboarding and business bootstrap SELECT policy.
- Included regression tests for configuration validation. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.

No credentials were included in the source upload. Live login, database policies, and Edge Function execution cannot be verified without your configured project. Tests use mocked backend responses; they do not certify a live deployment. Existing lint warnings concern hot reload exports; the build also warns about bundle size.
