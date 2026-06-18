# Kingdom Mission Network — Backend

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a Neon database (free at [neon.tech](https://neon.tech))

3. Set `DATABASE_URL` in your environment:
   ```bash
   # Windows PowerShell
   $env:DATABASE_URL="postgresql://user:pass@ep-xxxx.neon.tech/neondb"
   ```

4. Push schema to the database:
   ```bash
   npm run migrate
   ```

5. Seed demo data:
   ```bash
   npm run seed
   ```

6. Start the dev server:
   ```bash
   npm run dev
   ```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login (admin/admin123) |
| GET | `/api/prayers` | List prayers |
| POST | `/api/prayers` | Submit prayer |
| POST | `/api/prayers/:id/pray` | Pray for a request |
| GET | `/api/sermons` | List sermons |
| GET | `/api/events` | List events |
| POST | `/api/events/:id/rsvp` | RSVP to event |
| GET | `/api/bible/books` | Bible book list |
| GET | `/api/bible/verses/:book/:chapter` | Get verses (from bible-api.com) |
| GET | `/api/admin/stats` | Admin dashboard stats |
| GET | `/api/admin/prayers` | Admin prayer management |
