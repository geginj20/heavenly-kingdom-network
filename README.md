# Heavenly Kingdom Network (HKN)

**Open-source church community platform** connecting believers worldwide through prayer, Bible study, sermons, events, and fellowship.

> **Live Demo:** [hkn-website.pages.dev](https://hkn-website.pages.dev)

---

## Features

- **Prayer Wall** — Share prayer requests, pray for others, and build community. Real-time moderation with approve/flag/delete controls.
- **Bible Reader** — Read scripture with **22 translations** from 3 API sources (bible-api.com, wldeh/bible-api CDN, rkeplin). Includes KJV, WEB, ASV, BSB, NIV, NLT, ESV, Geneva Bible, and more. Quick-access navigation by book/chapter, verse copy, bookmarking, and study notes.
- **Sermon Library** — Searchable collection of teachings from ministries worldwide. Filter by category, speaker, or keyword.
- **Events Calendar** — Interactive calendar with RSVP, online/offline events, and event management.
- **Live Streaming** — Upcoming live worship services and events.
- **Donations & Giving** — Multi-gateway payments: Paystack (cards + M-Pesa), PayPal. 10 currencies supported.
- **Admin Dashboard** — Manage users, moderate prayer requests, create/edit/delete sermons and events, view donation analytics, and platform settings.
- **User Authentication** — Login, registration, forgot/reset password, JWT-based sessions.
- **Mobile Responsive** — Fully responsive design with mobile navigation, staggered animations, and skeleton loading states.

## Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript 5.9 |
| **Bundler** | Vite 7.2 |
| **Routing** | react-router-dom v7 (HashRouter) |
| **Styling** | Tailwind CSS v3.4 + shadcn/ui (New York) |
| **Animation** | Framer Motion |
| **Forms** | react-hook-form + zod |
| **Icons** | lucide-react |
| **Backend** | Hono (Cloudflare Workers) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Hono JWT (Web Crypto API) |
| **Payments** | Paystack + PayPal + Wise FX |
| **Deployment** | Cloudflare Pages (CI/CD via GitHub Actions) |
| **Testing** | Vitest + React Testing Library |

## Bible Translations Available

22 translations across 3 API sources:

| Source | Translations |
|---|---|
| **bible-api.com** | KJV, WEB, ASV, BBE, Darby, YLT, WEB-BE, CUV (Chinese), BKR (Czech), Almeida (Portuguese), RCCV (Romanian) |
| **wldeh/bible-api CDN** | BSB, Geneva 1599, LSV, FBV, Revised Version, WMB, Douay-Rheims, T4T |
| **rkeplin** | NIV, NLT, ESV |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/geginj20/hkn-website.git
cd hkn-website

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/       # Shared UI components
│   └── ui/           # 53 shadcn/ui primitives
├── pages/            # Route pages
│   └── home/         # Home page section components
├── hooks/            # Custom React hooks
├── lib/              # API client, auth, toast, utilities
├── data/             # Type definitions
└── test/             # Vitest test files
backend/
├── src/
│   ├── routes/       # Hono route handlers
│   ├── lib/          # Supabase client, JWT, rate limiter, env
│   └── db/           # Database connection
└── functions/api/    # Cloudflare Pages Functions entry
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | Run ESLint across all source files |
| `npm run test` | Run Vitest test suite |
| `npm run preview` | Preview production build locally |

## Architecture

- **Frontend:** React SPA with HashRouter, deployed to Cloudflare Pages
- **Backend:** Hono REST API running on Cloudflare Pages Functions (same origin, no CORS needed)
- **Database:** Supabase PostgreSQL with Row-Level Security
- **Authentication:** JWT-based with Hono middleware, 7-day expiry
- **Rate Limiting:** In-memory sliding window (20 req/min standard, 5 req/min for auth)
- **Payments:** Paystack for African currencies (M-Pesa + cards), PayPal for international, Wise for FX rates
- **CI/CD:** GitHub Actions — lint → test → build → deploy to Cloudflare Pages via wrangler

## License

MIT — see [LICENSE](LICENSE)
