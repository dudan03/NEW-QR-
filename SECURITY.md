# QR SplitPay India — Enterprise Security Architecture Guide

This document provides complete production-grade configuration guidelines and code references for securing **QR SplitPay India** across **Firebase (App & Data Level)**, **Cloudflare (Network & Edge Level)**, and **Backend Functions (Application & Code Level)**.

---

## 1. Firebase Security (Authentication, App Check & Database)

### 1.1 Phone OTP Authentication Configuration

#### Firebase Console Setup Steps:
1. Open the [Firebase Console](https://console.firebase.google.com/) and select your project.
2. Navigate to **Build > Authentication > Sign-in method**.
3. Enable the **Phone** provider.
4. **Whitelisting Test Numbers for App Review / QA**:
   - Under *Phone numbers for testing*, add:
     - Phone: `+91 9876543210`
     - Verification Code: `123456`
   - *Advantage:* Allows seamless Google Play/App Store review and automated testing without consuming SMS quotas or triggering carrier blocks.
5. In **Authentication > Settings > SMS Daily Quota**:
   - Set an alert threshold (e.g. 80%) to detect SMS toll fraud spikes early.

---

### 1.2 Firebase App Check (reCAPTCHA v3 / Enterprise)

Firebase App Check verifies that incoming requests originate solely from your authentic web app and not headless scrapers, curl scripts, or malicious emulators.

#### Configuration Steps:
1. In Google Cloud Console or [reCAPTCHA Console](https://www.google.com/recaptcha/admin), generate a **reCAPTCHA v3 or Enterprise Key**:
   - Platform: **Web**
   - Domains: Add your Vercel domain (`your-app.vercel.app`), custom domain (`qrsplitpay.in`), and development localhost (`localhost`).
2. In Firebase Console, go to **Build > App Check**.
3. Click on your Web App and choose **reCAPTCHA v3** (or Enterprise). Paste the Secret Key and Site Key.
4. Add the public site key to your client environment:
   ```env
   VITE_RECAPTCHA_SITE_KEY=6LeIxacZAAAAAF-your-actual-recaptcha-sitekey
   ```
5. In `src/services/firebaseAuth.ts`, App Check initializes automatically:
   ```typescript
   initializeAppCheck(app, {
     provider: new ReCaptchaV3Provider(firebaseConfig.reCaptchaSiteKey),
     isTokenAutoRefreshEnabled: true,
   });
   ```
6. **Enforcement**: Once verified in monitoring mode for 24 hours, toggle **Enforce** in Firebase App Check settings for **Firestore**, **Cloud Functions**, and **Authentication**.

---

### 1.3 Strict Firestore Security Rules

Deploy the rules file `firestore.rules` located in the root of the repository:
```bash
firebase deploy --only firestore:rules
```

#### Rule Architecture Summary:
- **Default Deny (`match /{document=**} { allow read, write: if false; }`)**: Everything is blocked unless explicitly permitted.
- **Tenant Isolation**: Each merchant's CRM, payment sessions, and customer profiles are isolated under `/merchants/{merchantId}`. Access is strictly constrained by `request.auth.uid == merchantId`.
- **Immutable Financial Audits**: Subcollection `/merchants/{merchantId}/auditLogs/{logId}` permits `create` and `read`, but strictly forbids `update` and `delete`. This ensures legal compliance and prevents rogue ledger tampering.
- **Strict Data Validation**: Validates that paise amounts are positive integers, installments count is within bounds (1-24), and session total amounts cannot be tampered with after creation.

---

### 1.4 Automatic 15-Minute Inactivity Session Logout

Financial and payment applications require automatic termination of inactive sessions to protect merchant balance and customer records on shared shop counters or public devices.

- **Hook**: `src/hooks/useInactivityTimeout.ts`
- **Behavior**:
  - Listens to active user events (`mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`).
  - At **14 minutes** (60 seconds before expiration), displays an in-app security warning banner with a countdown.
  - At **15 minutes** (900,000 ms), automatically calls `logoutFirebaseUser()`, clears all cached merchant credentials and session state, and redirects to the safe lock screen.

---

## 2. Cloudflare Security (Network & API Edge Protection)

### 2.1 Edge Rate Limiting with Cloudflare Worker

Deploy `cloudflare/worker.js` to protect your login, OTP, and sync endpoints before traffic ever touches your origin server.

#### Deployment Steps:
1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```
2. Create the KV namespace for rate limiting:
   ```bash
   wrangler kv:namespace create OTP_RATE_LIMIT_KV
   ```
3. Update `wrangler.toml`:
   ```toml
   name = "qrsplitpay-edge-security"
   main = "cloudflare/worker.js"
   compatibility_date = "2024-01-01"

   [[kv_namespaces]]
   binding = "OTP_RATE_LIMIT_KV"
   id = "<YOUR_GENERATED_KV_ID>"

   [routes]
   pattern = "qrsplitpay.in/api/auth/*"
   zone_name = "qrsplitpay.in"
   ```
4. Deploy the worker:
   ```bash
   wrangler deploy
   ```

#### Rate Limiting Policy Enforced:
- **IP-level**: Maximum **5 OTP requests per 10 minutes** per IP address.
- **Phone-level**: Maximum **3 OTP sends per hour** per target phone number.
- **Brute-force protection**: Maximum **10 verification attempts per 5 minutes** per IP address.
- Returns standard HTTP **429 (Too Many Requests)** with `Retry-After` header.

---

### 2.2 Cloudflare WAF (Web Application Firewall) Rules

In Cloudflare Dashboard, go to **Security > WAF > Custom Rules** and create the following production rules:

#### Rule 1: Block SQL Injection & Malicious Script Exploits
- **Name**: `Block-SQLi-and-XSS-Vectors`
- **Action**: `Block`
- **Expression**:
  ```text
  (http.request.uri.path contains "/api/" and (
    raw.http.request.uri contains "'" or 
    raw.http.request.uri contains "\"" or 
    raw.http.request.uri contains "--" or 
    raw.http.request.uri contains "/*" or 
    raw.http.request.uri contains "<script" or 
    raw.http.request.uri contains "javascript:" or
    raw.http.request.uri contains "UNION+SELECT" or
    raw.http.request.uri contains "OR+1=1"
  ))
  ```

#### Rule 2: Challenge Suspicious User Agents & Scrapers
- **Name**: `Challenge-Automated-Scrapers`
- **Action**: `Managed Challenge`
- **Expression**:
  ```text
  (http.user_agent contains "sqlmap" or 
   http.user_agent contains "nikto" or 
   http.user_agent contains "curl" or 
   http.user_agent contains "python-requests" or 
   http.user_agent contains "postman" or 
   http.user_agent contains "wget" or 
   http.user_agent eq "")
  ```

#### Rule 3: Restrict Sensitive Merchant API Access by Geography
- **Name**: `Challenge-Non-India-Admin-API`
- **Action**: `Managed Challenge`
- **Expression**:
  ```text
  (http.request.uri.path contains "/api/auth/" and not ip.geoip.country in {"IN"})
  ```
  *(Note: If merchant travels abroad, this serves an interactive Cloudflare Managed Challenge rather than outright blocking).*

---

### 2.3 Effective Configuration of Cloudflare "Bot Fight Mode"

1. In Cloudflare Dashboard, navigate to **Security > Bots**.
2. Toggle **Bot Fight Mode** to **ON**.
   - Cloudflare will automatically challenge known automated scrapers and bad bots using JavaScript/Wasm heuristics.
3. **PWA & API Webhook Compatibility**:
   - If using payment webhooks (e.g. Razorpay/Cashfree webhook notifications to `/api/webhooks`), create a **WAF Skip Rule**:
     - Expression: `(http.request.uri.path eq "/api/webhooks/upi")`
     - Action: `Skip` > Select `Bot Fight Mode` and `Rate Limiting`.
     - *Security note:* Secure webhooks using HMAC-SHA256 signature verification in code instead of edge bot challenges.

---

## 3. Application & Code Security

### 3.1 Secure Architecture for Handling API Keys & Secrets

#### The Principle of Least Privilege:
| Secret Type | Exposure Level | Storage Location | Example |
| :--- | :--- | :--- | :--- |
| Firebase Public Config | Client Safe (Public) | `VITE_FIREBASE_API_KEY` | `AIzaSy...` (restricted via Firebase Rules + App Check) |
| reCAPTCHA Site Key | Client Safe (Public) | `VITE_RECAPTCHA_SITE_KEY` | `6LeIxac...` (domain-restricted in Google Cloud) |
| Firebase Service Account | **STRICTLY PRIVATE** | Cloud Functions Secret Manager / Backend `.env` | `serviceAccountKey.json` |
| UPI Gateway / SMS API Secret | **STRICTLY PRIVATE** | Cloud Functions Secrets (`defineSecret`) | `FAST2SMS_KEY`, `RAZORPAY_SECRET` |

#### Securing Firebase Cloud Functions Secrets:
Never put backend secrets in frontend code or repository `.env` files.
In Firebase Cloud Functions v2:
```bash
firebase functions:secrets:set UPI_GATEWAY_KEY
```
Access them securely in Node.js functions:
```typescript
import { defineSecret } from 'firebase-functions/params';
const upiSecret = defineSecret('UPI_GATEWAY_KEY');

export const verifyUpiPayment = onCall({ secrets: [upiSecret] }, async (req) => {
  const secretKey = upiSecret.value();
  // ... secure validation logic
});
```

---

### 3.2 Server-Authoritative Payment Verification (Cloud Functions)

The code in `functions/src/index.ts` enforces that:
1. **No Client Math**: The frontend never dictates the merchant's remaining balance or customer's outstanding balance. The server recalculates from ground truth.
2. **Double-Spend Prevention**: Every 12-digit UPI Bank Reference (UTR) number is checked against existing records to prevent replay attacks.
3. **Atomic Transactions**: Uses `db.runTransaction` to simultaneously update installment status, session totals, customer CRM balance, and write an immutable audit event in a single atomic commit.

---

## 4. Verification & Testing Checklist

- [x] Run `npm run build` or `npm run lint` to verify frontend compilation.
- [x] Test Indian phone format validation (`+91 9XXXXXXXXX`).
- [x] Test 15-minute inactivity timer with simulated idle time.
- [x] Validate `firestore.rules` against unauthorized access attempts.
- [x] Verify Cloudflare Worker rate limiter response (`429 Too Many Requests`).
