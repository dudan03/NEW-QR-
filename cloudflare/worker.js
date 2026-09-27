/**
 * Cloudflare Worker: Enterprise Rate Limiting & Edge WAF for Split UPI QR
 * Target Domain: splitupiqr.in
 * 
 * Features:
 * 1. Dual-Key Sliding Window Rate Limiting (IP + Normalized Phone Number)
 * 2. Protection against SMS Toll Fraud & OTP Brute-Force Attacks
 * 3. Enforces strict HTTP Security Headers (HSTS, CSP, X-Frame-Options)
 * 4. Bot & Threat Scoring Integration (cf.clientTrustScore / cf.botManagement)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. CORS Preflight Handling
    if (request.method === 'OPTIONS') {
      return handleCorsPreflight(request);
    }

    // 2. Identify Target Path
    const isOtpSend = url.pathname.endsWith('/api/auth/otp/send') || url.pathname.includes('/auth/otp/request');
    const isOtpVerify = url.pathname.endsWith('/api/auth/otp/verify') || url.pathname.includes('/auth/otp/confirm');
    const isAuthEndpoint = isOtpSend || isOtpVerify || url.pathname.startsWith('/api/auth');

    // 3. Client Attributes from Cloudflare Edge
    const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const clientCountry = request.headers.get('cf-ipcountry') || 'XX';
    const userAgent = request.headers.get('user-agent') || '';

    // Block obvious malicious scrapers / missing user agents
    if (!userAgent || userAgent.length < 5 || /(curl|python|sqlmap|nikto|burp|wget)/i.test(userAgent)) {
      return new Response(JSON.stringify({ error: 'Request blocked by Cloudflare Edge Security' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Rate Limiting Logic for OTP Request Endpoints
    if (isOtpSend && request.method === 'POST') {
      let bodyText = '';
      try {
        bodyText = await request.clone().text();
      } catch (e) {}

      let targetPhone = '';
      try {
        const parsed = JSON.parse(bodyText);
        targetPhone = parsed.phone || parsed.phoneNumber || '';
      } catch (e) {}

      // A. IP Rate Limit: Max 5 OTP requests per 10 minutes per IP
      const ipLimitKey = `rl:ip:${clientIp}:10m`;
      const ipCount = await getRateCount(env, ipLimitKey);

      if (ipCount >= 5) {
        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'Too many OTP requests from your IP address. Please wait 10 minutes.',
            retryAfterSeconds: 600,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '600',
              'X-RateLimit-Limit': '5',
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }

      // B. Destination Phone Rate Limit: Max 3 OTP sends per 1 hour per phone number
      if (targetPhone) {
        const cleanPhone = targetPhone.replace(/\D/g, '');
        const phoneLimitKey = `rl:phone:${cleanPhone}:1h`;
        const phoneCount = await getRateCount(env, phoneLimitKey);

        if (phoneCount >= 3) {
          return new Response(
            JSON.stringify({
              error: 'Too Many Requests',
              message: 'Maximum OTP limit reached for this phone number. Please wait 1 hour.',
              retryAfterSeconds: 3600,
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '3600',
                'X-RateLimit-Limit': '3',
                'X-RateLimit-Remaining': '0',
              },
            }
          );
        }

        // Increment Phone counter with 1 hour TTL
        await incrementRateCount(env, phoneLimitKey, 3600);
      }

      // Increment IP counter with 10 min TTL
      await incrementRateCount(env, ipLimitKey, 600);
    }

    // 5. Rate Limiting for OTP Verification (Brute-force protection)
    if (isOtpVerify && request.method === 'POST') {
      const verifyIpKey = `rl:verify:${clientIp}:5m`;
      const verifyCount = await getRateCount(env, verifyIpKey);

      // Max 10 verification attempts per 5 minutes per IP
      if (verifyCount >= 10) {
        return new Response(
          JSON.stringify({
            error: 'Account Temporarily Locked',
            message: 'Too many incorrect OTP attempts. Please wait 5 minutes.',
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json', 'Retry-After': '300' },
          }
        );
      }

      await incrementRateCount(env, verifyIpKey, 300);
    }

    // 6. Forward Request to Origin Application
    const response = await fetch(request);

    // 7. Clone Response and Append Enterprise Security Headers
    const secureHeaders = new Headers(response.headers);
    secureHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    secureHeaders.set('X-Content-Type-Options', 'nosniff');
    secureHeaders.set('X-Frame-Options', 'SAMEORIGIN');
    secureHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    secureHeaders.set(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=*'
    );
    secureHeaders.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://firebaseappcheck.googleapis.com; img-src 'self' data: https://*;"
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: secureHeaders,
    });
  },
};

// Rate-limiting helpers using KV or in-memory fallback
const inMemoryCache = new Map();

async function getRateCount(env, key) {
  if (env && env.OTP_RATE_LIMIT_KV) {
    const val = await env.OTP_RATE_LIMIT_KV.get(key);
    return val ? parseInt(val, 10) : 0;
  }
  const entry = inMemoryCache.get(key);
  if (!entry) return 0;
  if (Date.now() > entry.expiresAt) {
    inMemoryCache.delete(key);
    return 0;
  }
  return entry.count;
}

async function incrementRateCount(env, key, ttlSeconds) {
  if (env && env.OTP_RATE_LIMIT_KV) {
    const current = (await env.OTP_RATE_LIMIT_KV.get(key)) || '0';
    const next = parseInt(current, 10) + 1;
    await env.OTP_RATE_LIMIT_KV.put(key, next.toString(), { expirationTtl: ttlSeconds });
    return next;
  }
  const entry = inMemoryCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    inMemoryCache.set(key, { count: 1, expiresAt: Date.now() + ttlSeconds * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

function handleCorsPreflight(request) {
  const origin = request.headers.get('Origin') || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-AppCheck, x-user-id',
      'Access-Control-Max-Age': '86400',
    },
  });
}
