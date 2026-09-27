# Cloudflare & Custom Domain Setup Guide for `splitupiqr.in`
**Brand:** Split UPI QR  
**Application Target:** Google Cloud Run / AI Studio Applet  
**Origin Host:** `ais-dev-7qnlpw3fjfktir27ahqfyr-795426317946.asia-southeast1.run.app`

---

## 1. Domain Registrar Setup (GoDaddy, Hostinger, BigRock, Namecheap)

If your domain **`splitupiqr.in`** is registered with GoDaddy, Hostinger, BigRock, or any other domain registrar:

1. Log into your registrar's dashboard.
2. Go to **DNS Management** or **Nameservers**.
3. Select **Custom Nameservers** and replace the default nameservers with Cloudflare's assigned nameservers (provided when you add the site to Cloudflare, for example):
   - `alex.ns.cloudflare.com`
   - `beth.ns.cloudflare.com`
4. Save the changes. (Propagation usually takes between 5 minutes and 2 hours).

---

## 2. Cloudflare DNS Records Configuration

In your **Cloudflare Dashboard** → Select **`splitupiqr.in`** → **DNS** → **Records**:

| Type | Name | Content / Target | Proxy Status | TTL |
| :--- | :--- | :--- | :--- | :--- |
| **CNAME** | `@` (or `splitupiqr.in`) | `ais-dev-7qnlpw3fjfktir27ahqfyr-795426317946.asia-southeast1.run.app` | **Proxied** (Orange Cloud) | Auto |
| **CNAME** | `www` | `splitupiqr.in` | **Proxied** (Orange Cloud) | Auto |
| **TXT** | `@` | `v=spf1 ~all` | DNS Only | Auto |

> **Why Proxied (Orange Cloud)?**  
> Having the Orange Cloud enabled routes all traffic through Cloudflare’s Edge network, providing automatic DDoS protection, WAF inspection, SSL/TLS termination, Bot Fight Mode, and edge rate-limiting for your UPI QR application.

---

## 3. SSL / TLS Configuration

In **Cloudflare Dashboard** → **SSL/TLS**:

1. **Overview**: Set encryption mode to **Full (strict)** or **Full**.
2. **Edge Certificates**:
   - Enable **Always Use HTTPS**: `ON` (automatically redirects `http://splitupiqr.in` to `https://splitupiqr.in`).
   - Enable **Automatic HTTPS Rewrites**: `ON`.
   - Set **Minimum TLS Version**: `TLS 1.2` or `TLS 1.3`.
   - Enable **Opportunistic Encryption**: `ON`.

---

## 4. Cloudflare Worker Edge Rate-Limiting Route

Deploy the worker script from `cloudflare/worker.js` and bind it to your custom domain:

```bash
# In the terminal / Cloudflare CLI:
npx wrangler kv:namespace create OTP_RATE_LIMIT_KV
npx wrangler deploy cloudflare/worker.js
```

In **Cloudflare Dashboard** → **Workers & Pages** → **Triggers** → **Add Route**:
- **Route:** `splitupiqr.in/api/*`
- **Route:** `www.splitupiqr.in/api/*`
- **Worker:** `qr-indiapay-rate-limiter`

This ensures that all OTP and session creation requests directed to `https://splitupiqr.in/api/auth/*` are rate-limited to 5 requests per 10 minutes per IP/Phone.

---

## 5. Web Application Firewall (WAF) & Bot Fight Mode

In **Cloudflare Dashboard** → **Security**:

1. **Bots**:
   - Enable **Bot Fight Mode**: `ON` (challenges malicious automated scrapers trying to scrape UPI IDs or flood OTPs).
2. **WAF Custom Rules**:
   - Create Rule 1: **Block SQL Injection & XSS**
     ```text
     (http.request.uri.path contains "/api/" and (
       raw.http.request.uri contains "'" or 
       raw.http.request.uri contains "--" or 
       raw.http.request.uri contains "<script" or 
       raw.http.request.uri contains "UNION+SELECT"
     ))
     Action: Block
     ```
   - Create Rule 2: **Challenge Non-Browser Automated Clients on Auth Endpoints**
     ```text
     (http.request.uri.path contains "/api/auth/" and (
       http.user_agent contains "curl" or 
       http.user_agent contains "python-requests" or 
       http.user_agent contains "sqlmap" or 
       http.user_agent eq ""
     ))
     Action: Managed Challenge
     ```

---

## 6. Verification Commands

Once configured, verify from your local terminal:

```bash
# Check DNS Resolution
dig +short splitupiqr.in

# Check HTTPS Header & Cloudflare Proxy
curl -I https://splitupiqr.in

# Look for Cloudflare Edge Response Headers:
# server: cloudflare
# cf-ray: ...
# strict-transport-security: max-age=31536000; includeSubDomains; preload
```

Your web application **Split UPI QR** is now fully mapped to **`https://splitupiqr.in`** with enterprise-grade network security!
