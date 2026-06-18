# Contributing to Kingdom Mission Network

We welcome contributions from the community! This is an open-source Christian platform, and every contribution helps us serve more believers worldwide.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/hkn-website.git`
3. Install dependencies: `npm install`
4. Start dev server: `npm run dev`

## Development

- **Tech stack:** React 19, TypeScript, Vite, Tailwind CSS v3, shadcn/ui
- **Use `npm run dev`** for hot-reload development on port 3000
- **Run `npm run lint`** before committing to catch issues
- **Run `npm run test`** to verify tests pass
- **Run `npm run build`** to verify the project compiles

## Code Standards

- Follow existing code patterns and conventions
- Use TypeScript strict mode
- Add proper alt text to all images
- Use the API service layer (`src/lib/api.ts`) instead of importing demo data directly
- Use `react-hook-form` + `zod` for form validation
- Wrap new pages in `React.lazy()` for code splitting

## Pull Request Process

1. Create a feature branch from `master`
2. Make your changes
3. Ensure lint and tests pass
4. Open a PR with a clear description of the change

## Reporting Issues

Open an issue on GitHub with a clear description and steps to reproduce.
