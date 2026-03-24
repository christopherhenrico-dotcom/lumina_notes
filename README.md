# Lumina Notes 🌙

Lumina Notes is a professional, AI-powered note-taking application designed for clarity, focus, and productivity. It features AI-driven formatting, voice note transcription, and a premium "Lumina Insight" knowledge assistant.

## ✨ Features
- **AI Formatting**: Transform messy thoughts into structured, beautiful notes with one click.
- **Voice Notes**: Record audio directly and have it transcribed into your notes.
- **Lumina Insight**: A premium AI chat assistant that provides context and answers based on your notes.
- **Export to PDF**: Professional PDF generation with custom styling.
- **Monetization**: Integrated Google Pay for a one-time $9.99 premium upgrade.
- **Sharing**: One-click copy to clipboard and email sharing.

---

## 🔑 Required API Keys & Configuration

To run Lumina Notes locally or in production, you'll need to configure the following services.

### 1. Firebase (Database & Auth)
**Environment Variables (Required for Production/Vercel)**
Set these in your Vercel project settings (**Settings > Environment Variables**):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_FIRESTORE_DATABASE_ID`

**Local Development**
Create a `.env` file in the root directory and add the variables above.

### 2. Gemini AI API
**Environment Variable:** `GEMINI_API_KEY`

Used for AI formatting and the Lumina Insight chat.
- **Local Development:** Create a `.env` file in the root directory and add `GEMINI_API_KEY=your_key_here`.
- **Production (GitHub Pages):** You must define this in your repository's **Settings > Secrets and variables > Actions**.

### 3. Google Pay (Monetization)
**File:** `src/App.tsx` (Search for `GooglePayButton`)

To receive real payments, you must register with the [Google Pay Business Console](https://pay.google.com/business/console/).
- **Merchant ID:** Replace `'12345678901234567890'` with your actual Merchant ID.
- **Gateway Merchant ID:** Replace `'exampleGatewayMerchantId'` with your payment gateway's ID (e.g., Stripe, Braintree).

### 4. Google AdSense (Ads)
**File:** `index.html` (Line 10)

To show ads, you need an AdSense account.
- **Publisher ID:** Replace `ca-pub-0000000000000000` with your actual Publisher ID.

---

## 🚀 Deployment Guide (Vercel)

Lumina Notes is pre-configured for deployment to Vercel with a custom domain (`lumina.is-an.ai`).

### Step 1: Firebase Authorized Domains (CRITICAL)
For authentication to work on your new domain, you **MUST** add it to the authorized domains list in Firebase:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Go to **Authentication** > **Settings** > **Authorized Domains**.
4. Click **Add Domain** and enter `lumina.is-an.ai`.
5. Also add `your-app-name.vercel.app`.

### Step 2: Vercel Project Setup
1. Push your code to a GitHub repository.
2. Import the project into [Vercel](https://vercel.com/).
3. Vercel will automatically detect Vite and configure the build settings.
4. Add your environment variables (see above).
5. Deploy!

### Step 3: Custom Domain Setup
1. In Vercel, go to **Settings > Domains**.
2. Add `lumina.is-an.ai`.
3. Vercel will provide the DNS records (usually an A record or CNAME) to add to your domain provider.

---

## 🛠️ Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.
