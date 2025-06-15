# MacroIntel

MacroIntel is a minimal two-page Next.js site for an AI-first macro‑economics newsletter.

## Project purpose

This site collects beta subscribers interested in macroeconomic insights powered by AI. The home page teases sample articles and provides a question form. The subscribe page offers a free beta sign‑up form.

## Environment variables

Copy `.env.local.example` to `.env.local` and replace `FORMSPREE_ENDPOINT` with your Formspree form URL.

The subscribe page posts directly to `https://formspree.io/f/xkgbbvda`. If you
have your own Formspree form for subscriptions, update `app/subscribe/page.tsx`
with that URL.

## Formspree submissions

To export subscriber data:

1. Open Formspree Dashboard.
2. Go to **Forms → Submissions** for your form.
3. Click `•••` → **Export CSV**.

## Scripts

- `npm run lint` – run ESLint
- `npm run build` – build the production app

Deploy the repository to Vercel and add `FORMSPREE_ENDPOINT` as a project secret.
