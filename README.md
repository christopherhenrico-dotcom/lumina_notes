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
**File:** `firebase-applet-config.json` (Root directory)

You need to create a project in the [Firebase Console](https://console.firebase.google.com/) and enable **Authentication** (Google Login) and **Firestore Database**.

```json
{
  "projectId": "YOUR_PROJECT_ID",
  "appId": "YOUR_APP_ID",
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_AUTH_DOMAIN",
  "firestoreDatabaseId": "YOUR_DATABASE_ID",
  "storageBucket": "YOUR_STORAGE_BUCKET",
  "messagingSenderId": "YOUR_SENDER_ID"
}
```

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

## 🚀 Deployment Guide (GitHub Pages)

Lumina Notes is pre-configured for deployment to GitHub Pages with a custom domain (`lumina.is-an.ai`).

### Step 1: Firebase Authorized Domains (CRITICAL)
For authentication to work on your new domain, you **MUST** add it to the authorized domains list in Firebase:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Go to **Authentication** > **Settings** > **Authorized Domains**.
4. Click **Add Domain** and enter `lumina.is-an.ai`.
5. Also add `your-username.github.io`.

### Step 2: GitHub Repository Setup
1. Push your code to a GitHub repository.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, set the source to **Deploy from a branch** and select the `gh-pages` branch.
4. Under **Custom domain**, enter `lumina.is-an.ai`.

### Step 3: Deploy Command
Run the following command in your terminal to build and push the app to the `gh-pages` branch:
```bash
npm run deploy
```

### Step 4: DNS Configuration
Ensure your domain provider points `lumina.is-an.ai` to GitHub's servers:
- **A Records**: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- **CNAME Record**: Point `lumina.is-an.ai` to `your-username.github.io`.

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
