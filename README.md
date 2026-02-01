# Review & Rule - Behavioral Trading Journal

**Review & Rule** is a comprehensive trading journal and behavioral analysis platform designed to help traders identify patterns, reduce losses, and improve discipline. It integrates with Zerodha Kite for automated trade syncing and provides advanced technical and stage analysis.

## Features

- **Behavioral Analysis**: Analyze holding periods, win/loss ratios, and emotional trading patterns.
- **Stage Analysis**: Automatic classification of stocks into Stan Weinstein's 4 Stages using Moving Average slope and price action.
- **Technical Flags**: Real-time signals (Golden Cross, RSI Overbought, Volume Surge) for your portfolio.
- **Alerts System**: Set custom price and indicator (RSI) alerts with email notifications.
- **Paper Trading Simulator**: Practice strategies with ₹1,00,000 virtual capital in a risk-free environment.
- **PWA Ready**: Installable on mobile and desktop devices.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **Database**: PostgreSQL (via Prisma ORM)
- **Auth**: NextAuth.js
- **Broker**: Zerodha Kite Connect API
- **Data**: Yahoo Finance API (Historical & Real-time)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL Database (Local or Cloud like Neon/Supabase)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/review-and-rule.git
cd review-and-rule
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory (copy from `.env.example`):
```bash
cp .env.example .env
```

Fill in your details:
- `DATABASE_URL`: Connection string to your Postgres DB.
- `NEXTAUTH_SECRET`: Generate using `openssl rand -base64 32`.
- `ZERODHA_API_KEY` & `SECRET`: From Kite Developer Console.

### 3. Database Sync
Push the schema to your database:
```bash
npx prisma db push
```

### 4. Run the App
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Required Accounts

1.  **Zerodha Kite Developer**:
    *   Sign up at [developers.kite.trade](https://developers.kite.trade/).
    *   Create an app to get `API_KEY` and `API_SECRET`.
    *   Set Redirect URL to `http://localhost:3000/api/zerodha/callback`.
    *   *Note: Costs ₹2000/month.*

2.  **PostgreSQL**:
    *   Install locally or use a free tier on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).

## Project Structure

- `/app`: App Router pages and API endpoints.
- `/components`: Reusable UI components (shadcn).
- `/lib`: Core logic (Analysis engines, Auth, DB).
    - `/analysis`: Behavioral & Technical algorithms.
    - `/simulator`: Paper trading engine.
- `/prisma`: Database schema.

## License
MIT
