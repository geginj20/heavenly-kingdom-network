# Heavenly Kingdom Network (HKN)

A global, open-source Christian platform connecting believers worldwide through prayer, scripture, and fellowship.

## Features

- **Prayer Wall** — Share prayer requests, pray for others, and build community
- **Bible Reader** — Read scripture with multiple translations (NIV, ESV, KJV), bookmark verses, and add study notes
- **Sermon Library** — Searchable collection of teachings from ministries worldwide
- **Events Calendar** — Interactive calendar with RSVP for global gatherings
- **Live Streaming** — Watch live worship services and events
- **Give** — Support the mission with one-time or recurring donations
- **Admin Dashboard** — Manage users, moderate prayers, create events, and view analytics

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 19 + TypeScript 5.9 |
| Bundler | Vite 7.2 |
| Routing | react-router-dom v7 (HashRouter) |
| Styling | Tailwind CSS v3.4 + shadcn/ui |
| Animation | Framer Motion |
| Forms | react-hook-form + zod |
| Icons | lucide-react |
| Testing | Vitest + React Testing Library |

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
```

## Project Structure

```
src/
├── components/       # Shared components
│   └── ui/           # 53 shadcn/ui primitives
├── pages/            # Route pages
│   └── home/         # Home page sections
├── hooks/            # Custom React hooks
├── lib/              # Utilities, API layer, auth
├── data/             # Demo data & types
└── test/             # Test files
```

## Scripts

- `npm run dev` — Start dev server (port 3000)
- `npm run build` — TypeScript check + production build
- `npm run lint` — Run ESLint
- `npm run test` — Run Vitest tests
- `npm run preview` — Preview production build

## License

MIT — see [LICENSE](LICENSE)
