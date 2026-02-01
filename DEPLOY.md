# Deployment & Configuration Guide

Each section guides you through setting up the external services required for "Review & Rule".

## 1. Supabase (Database) Guide
**Why:** To store user data, trades, and analysis.

1.  **Sign Up**: Go to [Supabase.com](https://supabase.com) and sign in.
2.  **Create Project**: Click "New Project".
    *   **Org**: Create new if empty.
    *   **Name**: `tradesight-db`.
    *   **Database Password**: Generate a strong password (Copy this, you will need it!).
    *   **Region**: **Mumbai (Asia South)**.
    *   **Pricing**: Select "Free".
3.  **Wait**: It takes ~2 minutes to provision.
4.  **Get Configuration**:
    *   Go to **Project Settings** (Cog icon) -> **Database**.
    *   Scroll to **Connection Pooling (Transaction Mode)**.
    *   Copy the **URI**. It looks like:
        `postgres://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
    *   Replace `[password]` with the one you copied in step 2.
    *   **Save this as `DATABASE_URL` for your .env.**

---

## 2. Vercel (Hosting) Guide
**Why:** To host your Next.js application online.

1.  **Sign Up**: Go to [Vercel.com](https://vercel.com) and sign in with GitHub.
2.  **Import Project**:
    *   Click "Add New..." -> "Project".
    *   Import the `review-and-rule` repository (ensure you pushed your code to GitHub first!).
3.  **Configure Environment Variables**:
    *   Open `.env.example` locally to see what you need.
    *   Add variables one by one in Vercel UI:
        *   `DATABASE_URL`: (From Supabase Step 4).
        *   `NEXTAUTH_URL`: Set to your Vercel domain (e.g., `https://review-and-rule.vercel.app`) - *Initially Vercel assigns a domain, you can update this later or leave as localhost during build, but for Auth to work in prod, it must match the live URL.* (Vercel automatically sets `VERCEL_URL`, NextAuth can use it if configured, but explicit is better).
        *   `NEXTAUTH_SECRET`: Generate random string (`openssl rand -base64 32`).
        *   `ZERODHA_API_KEY`: (From Zerodha Step).
        *   `ZERODHA_API_SECRET`: (From Zerodha Step).
        *   `EMAIL_USER`: Your Gmail address.
        *   `EMAIL_PASS`: Your Gmail App Password.
4.  **Deploy**: Click "Deploy".
5.  **Database Migration**:
    *   Vercel Build command runs `next build`.
    *   To sync DB schema, you might need to run `npx prisma db push` locally pointed at the PRODUCTION `DATABASE_URL` once, OR add a build command `npx prisma db push && next build` (Caution: db push in prod is risky for huge apps, but fine for this MVP).

---

## 3. Zerodha Kite Connect Guide
**Why:** To sync your real trades.

1.  **Sign Up**: Go to [developers.kite.trade](https://developers.kite.trade/).
2.  **Create App**:
    *   Click "Create New App".
    *   **App Name**: `Tradesight` (or similar).
    *   **Redirect URL**: This is CRITICAL.
        *   Localhost: `http://localhost:3000/api/zerodha/callback`
        *   Production: `https://your-vercel-domain.app/api/zerodha/callback`
    *   description: "Journal App".
3.  **Payment**: Pay ₹2000 (Credits needed).
4.  **Credentials**:
    *   Copy **API Key** and **API Secret**.
    *   Add to your `.env` (and Vercel Env Vars).

---

## 4. Gmail SMTP Setup (For Alerts)
**Why:** To send email notifications when alerts trigger.

1.  **Google Account**: Go to `myaccount.google.com`.
2.  **Security**: Search for "App Passwords" (You must have 2-Step Verification enabled first!).
3.  **Create App Password**:
    *   **App name**: `Tradesight`.
    *   Click "Create".
    *   Copy the 16-character password (e.g., `xxxx xxxx xxxx xxxx`).
4.  **Configure Config**:
    *   `EMAIL_USER`: Your full gmail address.
    *   `EMAIL_PASS`: The 16-char password (remove spaces).

---

## 5. Google Authentication Guide
**Why:** To allow users to sign in with their Google accounts.

1.  **Google Cloud Console**: Go to [console.cloud.google.com](https://console.cloud.google.com).
2.  **Create Project**: Click the project dropdown (top left) -> "New Project" -> Name it `Tradesight` -> Create.
3.  **OAuth Consent Screen**:
    *   Go to **APIs & Services** -> **OAuth consent screen**.
    *   Select **External** -> Create.
    *   **App Information**:
        *   App name: `Tradesight`.
        *   User support email: Your email.
        *   Developer contact information: Your email.
    *   Click "Save and Continue" through Scopes (no special scopes needed for now).
    *   Click "Save and Continue" through Test Users.
    *   **Publish App**: Go back to OAuth consent screen dashboard and click "Publish App" to make it live (otherwise only test users can login).
4.  **Create Credentials**:
    *   Go to **Credentials** (left sidebar).
    *   Click "**+ CREATE CREDENTIALS**" -> **OAuth client ID**.
    *   **Application type**: Web application.
    *   **Name**: `Tradesight Web Client`.
    *   **Authorized JavaScript origins**:
        *   `http://localhost:3000`
        *   `https://tradesight.in`
        *   `https://www.tradesight.in`
    *   **Authorized redirect URIs**:
        *   `http://localhost:3000/api/auth/callback/google`
        *   `https://tradesight.in/api/auth/callback/google`
        *   `https://www.tradesight.in/api/auth/callback/google`
    *   Click **Create**.
5.  **Get Configuration**:
    *   Copy **Client ID** and **Client Secret**.
    *   Add them to your `.env` file (and Vercel Environment Variables):
        *   `GOOGLE_CLIENT_ID=...`
        *   `GOOGLE_CLIENT_SECRET=...`
