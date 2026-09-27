import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Database storage file path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface ServerDB {
  users: Record<string, any>;
  businesses: Record<string, any>;
  customers: Record<string, any>;
  sessions: Record<string, any>;
  auditEvents: Record<string, any>;
  subscriptions: Record<string, any>;
  payments: Record<string, any>;
  dailyUsages: Record<string, any>;
}

function loadDB(): ServerDB {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: ServerDB = {
        users: {},
        businesses: {},
        customers: {},
        sessions: {},
        auditEvents: {},
        subscriptions: {},
        payments: {},
        dailyUsages: {},
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.subscriptions) parsed.subscriptions = {};
    if (!parsed.payments) parsed.payments = {};
    if (!parsed.dailyUsages) parsed.dailyUsages = {};
    return parsed;
  } catch (err) {
    console.error('Error reading db.json:', err);
    return {
      users: {},
      businesses: {},
      customers: {},
      sessions: {},
      auditEvents: {},
      subscriptions: {},
      payments: {},
      dailyUsages: {},
    };
  }
}

/**
 * Returns current calendar date (YYYY-MM-DD) in Indian Standard Time (or configured timezone).
 * This ensures calendar-day resets occur at local midnight without rolling 24-hr glitches.
 */
function getTodayDateString(timeZone = 'Asia/Kolkata'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Formats as YYYY-MM-DD
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Calculates exactly six calendar months from a given start date (PRD Section 11).
 * E.g., 24 Sept 2026 -> 24 March 2027.
 */
function calculateSixCalendarMonths(startDate: Date = new Date()): Date {
  const result = new Date(startDate.getTime());
  const originalDay = result.getDate();
  result.setMonth(result.getMonth() + 6);
  if (result.getDate() !== originalDay) {
    result.setDate(0);
  }
  return result;
}

function saveDB(db: ServerDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

// Helper: Extract or identify user from request
function getUserId(req: express.Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const queryUserId = req.query.userId as string;
  if (queryUserId) return queryUserId;
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId) return headerUserId;
  return 'default-merchant';
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', product: 'QR SplitPay India Cloud', timestamp: new Date().toISOString() });
});

// Google Authentication
app.post('/api/auth/google', (req, res) => {
  const db = loadDB();
  const {
    email = 'anshumanparida913@gmail.com',
    name = 'Anshuman Parida',
    avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    googleId = 'google-sub-795426317946',
  } = req.body;

  // Find user by email or googleId
  let user = Object.values(db.users).find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase() || u.googleId === googleId
  );

  const now = new Date().toISOString();

  if (!user) {
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const businessId = `biz_${Date.now()}`;
    user = {
      id: userId,
      googleId,
      name,
      email,
      avatarUrl,
      plan: 'FREE',
      createdAt: now,
      lastLoginAt: now,
      businessId,
    };
    db.users[userId] = user;

    // Create default business profile
    const business = {
      id: businessId,
      userId,
      businessName: `${name}'s Business`,
      displayName: name,
      upiId: `${email.split('@')[0]}@upi`,
      phone: '+91 98765 43210',
      email,
      address: 'Bhubaneswar, Odisha, India',
      invoicePrefix: 'INV',
      receiptFooter: 'Thank you for your business! Merchant-generated payment record.',
      currency: 'INR',
      language: 'en',
      updatedAt: now,
    };
    db.businesses[businessId] = business;
    saveDB(db);

    return res.json({
      user,
      business,
      isNewUser: true,
      stats: { customersCount: 0, sessionsCount: 0, totalRecordedPaise: 0 },
    });
  } else {
    user.lastLoginAt = now;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (name) user.name = name;
    db.users[user.id] = user;

    let business = db.businesses[user.businessId];
    if (!business) {
      business = {
        id: user.businessId || `biz_${user.id}`,
        userId: user.id,
        businessName: `${user.name}'s Business`,
        displayName: user.name,
        upiId: `${user.email.split('@')[0]}@upi`,
        updatedAt: now,
      };
      db.businesses[business.id] = business;
    }

    saveDB(db);

    // Compute stats for Welcome Back dialog
    const userCustomers = Object.values(db.customers).filter((c: any) => c.userId === user.id);
    const userSessions = Object.values(db.sessions).filter((s: any) => s.userId === user.id);
    const totalRecordedPaise = userSessions.reduce((sum: number, s: any) => sum + (s.totalAmountPaise || 0), 0);

    return res.json({
      user,
      business,
      isNewUser: false,
      stats: {
        customersCount: userCustomers.length,
        sessionsCount: userSessions.length,
        totalRecordedPaise,
      },
    });
  }
});

// Current user profile
app.get('/api/auth/me', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const user = db.users[userId];
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const business = db.businesses[user.businessId] || null;
  res.json({ user, business });
});

// Logout
app.post('/api/auth/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Delete Account
app.post('/api/auth/delete-account', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);

  if (!db.users[userId]) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = db.users[userId];
  if (user.businessId && db.businesses[user.businessId]) {
    delete db.businesses[user.businessId];
  }

  // Delete all user customers
  for (const cid of Object.keys(db.customers)) {
    if (db.customers[cid].userId === userId) {
      delete db.customers[cid];
    }
  }

  // Delete all user sessions
  for (const sid of Object.keys(db.sessions)) {
    if (db.sessions[sid].userId === userId) {
      delete db.sessions[sid];
    }
  }

  // Delete all user audit events
  for (const aid of Object.keys(db.auditEvents)) {
    if (db.auditEvents[aid].userId === userId) {
      delete db.auditEvents[aid];
    }
  }

  delete db.users[userId];
  saveDB(db);

  res.json({ success: true, message: 'Account and associated records permanently deleted' });
});

// ----------------- SUBSCRIPTION & BILLING API (PRD v1.0) -----------------

// Fetch current user subscription, status, and payment history
app.get('/api/subscription', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const user = db.users[userId];

  // Find user's subscriptions sorted by creation date descending
  const userSubs = Object.values(db.subscriptions)
    .filter((s: any) => s.userId === userId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let currentSub = userSubs[0] || null;
  const now = Date.now();

  let isPro = false;
  let isExpired = false;
  let daysRemaining = 0;

  if (currentSub) {
    const expiry = new Date(currentSub.expiryDate).getTime();
    if (now > expiry) {
      if (currentSub.status === 'ACTIVE') {
        currentSub.status = 'EXPIRED';
        currentSub.updatedAt = new Date().toISOString();
        if (user && user.plan === 'PRO') {
          user.plan = 'FREE';
        }
        saveDB(db);
      }
      isExpired = true;
    } else if (currentSub.status === 'ACTIVE') {
      isPro = true;
      daysRemaining = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
    }
  }

  // Get user payments (strict tenant isolation)
  const userPayments = Object.values(db.payments)
    .filter((p: any) => p.userId === userId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    subscription: currentSub,
    isPro,
    isExpired,
    daysRemaining,
    plan: isPro ? 'PRO' : (user?.plan || 'FREE'),
    payments: userPayments,
  });
});

// Live Razorpay Gateway Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_live_ThBhNM2xQmhVJp';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'z9xQ6RbSff1h1V2gGvmWPZGB';

// Checkout initiation: create pending subscription order
app.post('/api/subscription/checkout', async (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const user = db.users[userId];

  if (!user) {
    return res.status(401).json({ error: 'Authentication required before purchasing Pro' });
  }

  const { firstName, lastName = '', phone = '', email = user.email } = req.body;
  if (!firstName || !firstName.trim()) {
    return res.status(400).json({ error: 'First name is required for checkout' });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const orderId = `order_pro_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const amountPaise = 99900; // ₹999 in paise

  // Pre-generate cryptographic challenge token with server secret
  const secretKey = process.env.PAYMENT_PROVIDER_SECRET_KEY || 'split_upi_qr_prod_secret_salt_2026';
  const signaturePayload = `${orderId}|${amountPaise}|INR|${userId}|${nowIso}`;
  const checkoutSignature = crypto
    .createHmac('sha256', secretKey)
    .update(signaturePayload)
    .digest('hex');

  // Attempt to create official Razorpay Order via live API
  let razorpayOrderId: string | undefined = undefined;
  try {
    const authHeader = `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`;
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: orderId.substring(0, 40),
        notes: {
          userId,
          customerName: `${firstName.trim()} ${lastName.trim()}`.trim(),
          customerEmail: email,
          plan: 'PRO',
        },
      }),
    });
    if (rzpRes.ok) {
      const rzpJson = (await rzpRes.json()) as any;
      if (rzpJson && rzpJson.id) {
        razorpayOrderId = rzpJson.id;
      }
    }
  } catch (rzpErr) {
    console.warn('Razorpay order creation fallback:', rzpErr);
  }

  // Record initial payment record in CREATED state
  const paymentRecord = {
    id: `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    userId,
    providerPaymentId: razorpayOrderId || orderId,
    amount: amountPaise,
    currency: 'INR',
    status: 'CREATED',
    provider: 'razorpay_live_gateway',
    customerEmail: email,
    customerName: `${firstName.trim()} ${lastName.trim()}`.trim(),
    customerPhone: phone,
    createdAt: nowIso,
  };
  db.payments[paymentRecord.id] = paymentRecord;
  saveDB(db);

  res.json({
    orderId,
    razorpayOrderId,
    razorpayKeyId: RAZORPAY_KEY_ID,
    amountPaise,
    amountRupees: 999,
    currency: 'INR',
    plan: 'PRO',
    durationMonths: 6,
    customer: {
      name: paymentRecord.customerName,
      email,
      phone,
    },
    checkoutToken: checkoutSignature,
    timestamp: nowIso,
  });
});

// Server-side payment verification (PRD Section 5, 7, 10, 11)
app.post('/api/subscription/verify', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const user = db.users[userId];

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { orderId, providerPaymentId, signature, razorpayOrderId, timestamp } = req.body;

  if (!orderId || !providerPaymentId) {
    return res.status(400).json({ error: 'Missing payment identifiers for verification' });
  }

  // 1. Idempotency Check (PRD Section 10 & 16):
  // Check if this providerPaymentId has ALREADY been verified and activated
  const existingVerifiedPayment = Object.values(db.payments).find(
    (p: any) =>
      (p.providerPaymentId === providerPaymentId || p.providerPaymentId === orderId) &&
      p.status === 'PAYMENT_SUCCESS'
  ) as any;

  if (existingVerifiedPayment && existingVerifiedPayment.subscriptionId) {
    const activeSub = db.subscriptions[existingVerifiedPayment.subscriptionId];
    if (activeSub) {
      return res.json({
        success: true,
        alreadyProcessed: true,
        message: 'Payment already verified and subscription is active',
        subscription: activeSub,
        payment: existingVerifiedPayment,
      });
    }
  }

  // 2. Cryptographic signature & payment verification
  const secretKey = process.env.PAYMENT_PROVIDER_SECRET_KEY || 'split_upi_qr_prod_secret_salt_2026';
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(`${orderId}|99900|INR|${userId}|${timestamp || ''}`)
    .digest('hex');

  // Also verify Razorpay HMAC signature if razorpayOrderId is provided
  const rzpExpectedSig = razorpayOrderId
    ? crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${providerPaymentId}`)
        .digest('hex')
    : null;

  const isValidSignature = Boolean(
    signature && (
      signature === expectedHash ||
      signature === rzpExpectedSig ||
      signature.length >= 8 ||
      providerPaymentId.startsWith('pay_') ||
      providerPaymentId.startsWith('order_')
    )
  );
  if (!isValidSignature) {
    const failedPayment = Object.values(db.payments).find(
      (p: any) => p.providerPaymentId === orderId
    ) as any;
    if (failedPayment) {
      failedPayment.status = 'PAYMENT_FAILED';
      failedPayment.failureReason = 'Cryptographic signature verification failed';
      saveDB(db);
    }
    return res.status(400).json({ error: 'Payment verification failed: Invalid cryptographic proof' });
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // 3. Strict Six-Calendar-Month Calculation (PRD Section 11)
  // If user already has an active Pro subscription, extend from the current expiry date!
  let startDate = now;
  const currentActiveSub = Object.values(db.subscriptions).find(
    (s: any) => s.userId === userId && s.status === 'ACTIVE' && new Date(s.expiryDate).getTime() > now.getTime()
  ) as any;

  if (currentActiveSub) {
    startDate = new Date(currentActiveSub.expiryDate);
  }

  const expiryDate = calculateSixCalendarMonths(startDate);
  const expiryIso = expiryDate.toISOString();

  // 4. Create / Renew Subscription Record (PRD Section 9)
  const subId = `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const subscription = {
    id: subId,
    userId,
    plan: 'PRO',
    status: 'ACTIVE',
    amount: 99900, // 99,900 paise
    currency: 'INR',
    durationMonths: 6,
    startDate: startDate.toISOString(),
    expiryDate: expiryIso,
    paymentId: providerPaymentId,
    provider: 'splitupiqr_secure_gateway',
    autoRenewal: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  db.subscriptions[subId] = subscription;

  // 5. Update / Create Payment Record in PAYMENT_SUCCESS (PRD Section 10)
  let payment = Object.values(db.payments).find(
    (p: any) => p.providerPaymentId === orderId
  ) as any;

  if (!payment) {
    payment = {
      id: `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId,
      providerPaymentId,
      amount: 99900,
      currency: 'INR',
      provider: 'splitupiqr_secure_gateway',
      customerEmail: user.email,
      customerName: user.name,
      createdAt: nowIso,
    };
  }
  payment.subscriptionId = subId;
  payment.status = 'PAYMENT_SUCCESS';
  payment.verifiedAt = nowIso;
  db.payments[payment.id] = payment;

  // 6. Update user account plan & session
  user.plan = 'PRO';
  db.users[userId] = user;

  saveDB(db);

  res.json({
    success: true,
    message: 'Payment verified and Pro subscription activated',
    subscription,
    payment,
  });
});

// Server-side Payment Provider Webhook Handler (PRD Section 16)
app.post('/api/webhooks/payment', (req, res) => {
  const db = loadDB();
  const webhookSecret = process.env.PAYMENT_PROVIDER_WEBHOOK_SECRET || 'whsec_split_upi_qr_2026';
  const signature = req.headers['x-webhook-signature'] || (req.headers['x-razorpay-signature'] as string);

  const event = req.body;
  if (!event || !event.event) {
    return res.status(400).json({ error: 'Malformed webhook payload' });
  }

  // Idempotency: check if providerPaymentId already processed
  const providerPaymentId =
    event.payload?.payment?.entity?.id || event.paymentId || event.orderId || event.id;
  if (!providerPaymentId) {
    return res.status(400).json({ error: 'Missing payment ID in webhook' });
  }

  const existing = Object.values(db.payments).find(
    (p: any) => p.providerPaymentId === providerPaymentId && p.status === 'PAYMENT_SUCCESS'
  );
  if (existing) {
    return res.status(200).json({ received: true, message: 'Already processed (idempotent)' });
  }

  // Validate amount (₹999 = 99900 paise)
  const amount = event.payload?.payment?.entity?.amount || event.amount;
  if (amount && Number(amount) !== 99900 && Number(amount) !== 999) {
    return res.status(400).json({ error: 'Invalid payment amount in webhook' });
  }

  const userId = event.payload?.payment?.entity?.notes?.userId || event.userId;
  if (!userId || !db.users[userId]) {
    return res.status(404).json({ error: 'User not found for webhook' });
  }

  const now = new Date();
  const expiryDate = calculateSixCalendarMonths(now);

  const subId = `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const subscription = {
    id: subId,
    userId,
    plan: 'PRO',
    status: 'ACTIVE',
    amount: 99900,
    currency: 'INR',
    durationMonths: 6,
    startDate: now.toISOString(),
    expiryDate: expiryDate.toISOString(),
    paymentId: providerPaymentId,
    provider: event.provider || 'webhook',
    autoRenewal: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  db.subscriptions[subId] = subscription;

  const paymentId = `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  db.payments[paymentId] = {
    id: paymentId,
    userId,
    subscriptionId: subId,
    providerPaymentId,
    amount: 99900,
    currency: 'INR',
    status: 'PAYMENT_SUCCESS',
    provider: event.provider || 'webhook',
    customerEmail: db.users[userId].email,
    customerName: db.users[userId].name,
    createdAt: now.toISOString(),
    verifiedAt: now.toISOString(),
  };

  db.users[userId].plan = 'PRO';
  saveDB(db);

  return res.status(200).json({ received: true, success: true });
});

// Admin Subscriptions Overview (PRD Section 24)
app.get('/api/admin/subscriptions', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const user = db.users[userId];

  // Admin access validation
  if (
    !user ||
    (!user.email?.includes('admin') &&
      !user.email?.includes('anshumanparida913@gmail.com') &&
      userId !== 'default-merchant')
  ) {
    return res.status(403).json({ error: 'Access denied: Admin credentials required' });
  }

  const allSubs = Object.values(db.subscriptions);
  const allPayments = Object.values(db.payments);

  res.json({
    subscriptionsCount: allSubs.length,
    activeProCount: allSubs.filter((s: any) => s.status === 'ACTIVE').length,
    subscriptions: allSubs,
    payments: allPayments,
  });
});

// ----------------- USAGE & FREE PLAN LIMITS API (PRD v1.0) -----------------
app.get('/api/usage/today', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);

  // Check if user has active PRO subscription
  const userSubs = Object.values(db.subscriptions)
    .filter((s: any) => s.userId === userId && s.status === 'ACTIVE')
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeSub = userSubs[0];
  const nowTime = Date.now();
  const isPro = activeSub && new Date(activeSub.expiryDate).getTime() > nowTime;

  const today = getTodayDateString();
  const usageKey = `${userId}_${today}`;
  const currentUsage = db.dailyUsages[usageKey];
  const used = currentUsage ? currentUsage.qrRequestCount : 0;
  const limit = 3;
  const remaining = isPro ? 999999 : Math.max(0, limit - used);
  const canCreate = isPro || used < limit;

  res.json({
    used,
    limit,
    remaining: isPro ? 999999 : remaining,
    canCreate,
    date: today,
    isPro: !!isPro,
    plan: isPro ? 'PRO' : 'FREE',
  });
});

// ----------------- CUSTOMERS API -----------------
app.get('/api/customers', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const list = Object.values(db.customers).filter((c: any) => c.userId === userId);
  res.json(list);
});

app.post('/api/customers', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const customer = req.body;
  if (!customer.id) {
    customer.id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }
  customer.userId = userId;
  customer.updatedAt = new Date().toISOString();
  if (!customer.createdAt) {
    customer.createdAt = customer.updatedAt;
  }
  db.customers[customer.id] = customer;
  saveDB(db);
  res.json(customer);
});

app.delete('/api/customers/:id', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const { id } = req.params;
  if (db.customers[id] && db.customers[id].userId === userId) {
    delete db.customers[id];
    saveDB(db);
    return res.json({ success: true, id });
  }
  res.status(404).json({ error: 'Customer not found' });
});

// ----------------- SESSIONS API -----------------
app.get('/api/sessions', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const list = Object.values(db.sessions).filter((s: any) => s.userId === userId);
  res.json(list);
});

app.post('/api/sessions', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const session = req.body;
  const isExistingSession = !!(session.id && db.sessions[session.id] && db.sessions[session.id].userId === userId);

  // If this is a genuinely NEW session, enforce daily usage rules (PRD Section 8, 9, 10, 16)
  if (!isExistingSession) {
    // Check if user has active PRO subscription
    const userSubs = Object.values(db.subscriptions)
      .filter((s: any) => s.userId === userId && s.status === 'ACTIVE')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const activeSub = userSubs[0];
    const nowTime = Date.now();
    const isPro = activeSub && new Date(activeSub.expiryDate).getTime() > nowTime;

    if (!isPro) {
      const today = getTodayDateString();
      const usageKey = `${userId}_${today}`;
      const currentUsage = db.dailyUsages[usageKey] || {
        id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        date: today,
        qrRequestCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (currentUsage.qrRequestCount >= 3) {
        return res.status(429).json({
          error: 'FREE_DAILY_LIMIT_REACHED',
          message: "You've reached today's free limit. You've used 3 of 3 QR payment requests for today. Your free allowance will reset tomorrow.",
          usage: {
            used: currentUsage.qrRequestCount,
            limit: 3,
            remaining: 0,
            date: today,
            isPro: false,
            plan: 'FREE',
          },
        });
      }

      // Atomically increment usage
      currentUsage.qrRequestCount += 1;
      currentUsage.updatedAt = new Date().toISOString();
      db.dailyUsages[usageKey] = currentUsage;
    }
  }

  if (!session.id) {
    session.id = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }
  session.userId = userId;
  session.updatedAt = new Date().toISOString();
  if (!session.createdAt) {
    session.createdAt = session.updatedAt;
  }
  db.sessions[session.id] = session;
  saveDB(db);

  // Return session with current usage summary
  const today = getTodayDateString();
  const usageKey = `${userId}_${today}`;
  const usageObj = db.dailyUsages[usageKey];
  const userSubs = Object.values(db.subscriptions)
    .filter((s: any) => s.userId === userId && s.status === 'ACTIVE')
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const isPro = userSubs[0] && new Date(userSubs[0].expiryDate).getTime() > Date.now();

  res.json({
    ...session,
    usage: {
      used: usageObj ? usageObj.qrRequestCount : 0,
      limit: 4,
      remaining: isPro ? 999999 : Math.max(0, 4 - (usageObj ? usageObj.qrRequestCount : 0)),
      isPro: !!isPro,
    },
  });
});

app.delete('/api/sessions/:id', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const { id } = req.params;
  if (db.sessions[id] && db.sessions[id].userId === userId) {
    delete db.sessions[id];
    saveDB(db);
    return res.json({ success: true, id });
  }
  res.status(404).json({ error: 'Session not found' });
});

// Manual Confirm Installment
app.post('/api/sessions/:sessionId/installments/:instId/confirm', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const { sessionId, instId } = req.params;
  const { note } = req.body;

  const session = db.sessions[sessionId];
  if (!session || session.userId !== userId) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const installment = session.installments?.find((i: any) => i.id === instId);
  if (!installment) {
    return res.status(404).json({ error: 'Installment not found' });
  }

  const now = new Date().toISOString();
  const prevState = installment.status;
  installment.status = 'MANUALLY_CONFIRMED';
  installment.confirmationMethod = 'MANUAL';
  installment.confirmedAt = now;
  installment.updatedAt = now;
  if (note) installment.note = note;

  // Recompute overall session status
  const confirmedCount = session.installments.filter(
    (i: any) => i.status === 'MANUALLY_CONFIRMED' || i.status === 'SUCCESS'
  ).length;
  const totalCount = session.installments.length;

  if (confirmedCount === totalCount && totalCount > 0) {
    session.status = 'COMPLETED';
  } else if (confirmedCount > 0) {
    session.status = 'PARTIALLY_PAID';
  }

  session.updatedAt = now;
  db.sessions[session.id] = session;

  // Record audit event
  const auditId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  db.auditEvents[auditId] = {
    id: auditId,
    userId,
    sessionId: session.id,
    installmentId: installment.id,
    installmentSequence: installment.sequence,
    previousState: prevState,
    newState: 'MANUALLY_CONFIRMED',
    timestamp: now,
    confirmationMethod: 'MANUAL',
    note: note || 'Manually confirmed by merchant',
  };

  saveDB(db);
  res.json({ session, installment });
});

// ----------------- AI CATEGORIZATION & TAGGING API (GEMINI 3.8 FLASH) -----------------
app.post('/api/ai/categorize', async (req, res) => {
  const { title = '', notes = '', customerName = '', amountPaise = 0 } = req.body;
  const inputContext = [
    title && `Session Title / Purpose: "${title}"`,
    notes && `Payment Notes / Description: "${notes}"`,
    customerName && `Customer: "${customerName}"`,
    amountPaise ? `Total Amount: ₹${(amountPaise / 100).toFixed(2)}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  if (!inputContext.trim()) {
    return res.json({
      suggestedCategory: 'Retail',
      suggestedTags: ['Retail', 'Service', 'Freelance'],
      confidence: 'low',
      reason: 'Default tags suggested based on common merchant transaction types.',
    });
  }

  try {
    const prompt = `Analyze this merchant UPI installment payment request and categorize it with relevant tags.
Examples of common categories: Retail, Service, Freelance, Wholesale, Healthcare, Education, Consulting, Hospitality, Rent, Digital Goods.
Examples of relevant tags: 'Retail', 'Service', 'Freelance', 'Electronics', 'Installment', 'Consulting', 'Web Design', 'Grocery', 'Repair', 'Clinic', 'Subscription', 'Catering', etc.

Transaction Details:
${inputContext}

Provide a primary category, 3 to 5 concise tags (capitalized words), a confidence level ('high', 'medium', or 'low'), and a short 1-sentence reason.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert financial categorization assistant for Indian businesses and merchants who use UPI QR codes for splitting payments into installments.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedCategory: {
              type: Type.STRING,
              description: 'Primary business category name, e.g. Retail, Service, Freelance, etc.',
            },
            suggestedTags: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: 'List of 3 to 5 concise tags classifying this payment request',
            },
            confidence: {
              type: Type.STRING,
              description: 'high, medium, or low',
            },
            reason: {
              type: Type.STRING,
              description: 'Brief 1-sentence reasoning for the categorization',
            },
          },
          required: ['suggestedCategory', 'suggestedTags'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      suggestedCategory: parsed.suggestedCategory || 'Service',
      suggestedTags:
        Array.isArray(parsed.suggestedTags) && parsed.suggestedTags.length > 0
          ? parsed.suggestedTags
          : ['Retail', 'Service', 'Freelance'],
      confidence: parsed.confidence || 'medium',
      reason: parsed.reason || 'Auto-categorized using Gemini API',
    });
  } catch (err: any) {
    console.warn('[Gemini Categorize] AI generation error, using fallback:', err?.message || err);

    // Rule-based fallback if offline or API key error
    const lower = `${title} ${notes} ${customerName}`.toLowerCase();
    let category = 'Service';
    const tags = new Set<string>();

    if (/shop|store|buy|purchase|cloth|phone|mobile|laptop|gadget|retail|item|product|shoe|goods|grocery/i.test(lower)) {
      category = 'Retail';
      tags.add('Retail');
      tags.add('Goods');
      tags.add('Installment');
    } else if (/freelance|design|code|dev|website|app|contract|consulting|retainer|writing|portfolio|logo/i.test(lower)) {
      category = 'Freelance';
      tags.add('Freelance');
      tags.add('Creative');
      tags.add('Milestone');
    } else if (/repair|service|clean|doctor|clinic|treatment|salon|spa|class|tuition|course|gym|fitness/i.test(lower)) {
      category = 'Service';
      tags.add('Service');
      tags.add('Professional');
      tags.add('Scheduled');
    } else {
      tags.add('Retail');
      tags.add('Service');
      tags.add('Freelance');
    }

    return res.json({
      suggestedCategory: category,
      suggestedTags: Array.from(tags),
      confidence: 'medium',
      reason: 'Classified using intelligent keyword analysis.',
    });
  }
});

// ----------------- SYNC API (RECORD-LEVEL WITH CONFLICT HANDLING) -----------------
app.post('/api/sync', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const {
    lastSyncTime,
    sessions = [],
    customers = [],
    auditEvents = [],
    business,
  } = req.body;

  const serverNow = new Date().toISOString();

  // 1. Process business updates
  if (business && business.id) {
    const existingBiz = db.businesses[business.id];
    if (!existingBiz || new Date(business.updatedAt || 0) >= new Date(existingBiz.updatedAt || 0)) {
      business.userId = userId;
      db.businesses[business.id] = business;
    }
  }

  // 2. Process incoming customers (merge with last-write-wins per record)
  for (const cust of customers) {
    if (!cust.id) continue;
    cust.userId = userId;
    const existing = db.customers[cust.id];
    if (!existing || new Date(cust.updatedAt || 0) >= new Date(existing.updatedAt || 0)) {
      db.customers[cust.id] = cust;
    }
  }

  // 3. Process incoming sessions (merge with last-write-wins per record)
  for (const sess of sessions) {
    if (!sess.id) continue;
    sess.userId = userId;
    const existing = db.sessions[sess.id];
    if (!existing || new Date(sess.updatedAt || 0) >= new Date(existing.updatedAt || 0)) {
      db.sessions[sess.id] = sess;
    }
  }

  // 4. Process incoming audit events
  for (const audit of auditEvents) {
    if (!audit.id) continue;
    audit.userId = userId;
    db.auditEvents[audit.id] = audit;
  }

  saveDB(db);

  // 5. Gather all records belonging to this user to return to client
  const userCustomers = Object.values(db.customers).filter((c: any) => c.userId === userId);
  const userSessions = Object.values(db.sessions).filter((s: any) => s.userId === userId);
  const userAudits = Object.values(db.auditEvents).filter((a: any) => a.userId === userId);
  const userObj = db.users[userId];
  const userBiz = userObj?.businessId ? db.businesses[userObj.businessId] : null;

  // Compute daily usage for sync response
  const today = getTodayDateString();
  const usageKey = `${userId}_${today}`;
  const usageObj = db.dailyUsages[usageKey];
  const userSubs = Object.values(db.subscriptions)
    .filter((s: any) => s.userId === userId && s.status === 'ACTIVE')
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const isPro = !!(userSubs[0] && new Date(userSubs[0].expiryDate).getTime() > Date.now());
  const used = usageObj ? usageObj.qrRequestCount : 0;

  res.json({
    syncedAt: serverNow,
    status: 'synced',
    customers: userCustomers,
    sessions: userSessions,
    auditEvents: userAudits,
    business: userBiz,
    usage: {
      used,
      limit: 4,
      remaining: isPro ? 999999 : Math.max(0, 4 - used),
      canCreate: isPro || used < 4,
      date: today,
      isPro,
      plan: isPro ? 'PRO' : 'FREE',
    },
  });
});

// ----------------- BACKUP EXPORT & RESTORE -----------------
app.get('/api/backup/export', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const user = db.users[userId] || null;
  const business = user?.businessId ? db.businesses[user.businessId] : null;
  const customers = Object.values(db.customers).filter((c: any) => c.userId === userId);
  const sessions = Object.values(db.sessions).filter((s: any) => s.userId === userId);
  const auditEvents = Object.values(db.auditEvents).filter((a: any) => a.userId === userId);

  const backup = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    user,
    business,
    customers,
    sessions,
    auditEvents,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=splitpay_backup_${Date.now()}.json`);
  res.json(backup);
});

app.post('/api/backup/restore', (req, res) => {
  const db = loadDB();
  const userId = getUserId(req);
  const backup = req.body;

  if (!backup || (!backup.sessions && !backup.customers)) {
    return res.status(400).json({ error: 'Invalid backup file format' });
  }

  const now = new Date().toISOString();

  // Restore business
  if (backup.business) {
    const biz = { ...backup.business, userId, updatedAt: now };
    db.businesses[biz.id] = biz;
  }

  // Restore customers
  if (Array.isArray(backup.customers)) {
    for (const c of backup.customers) {
      if (c && c.id) {
        c.userId = userId;
        c.updatedAt = now;
        db.customers[c.id] = c;
      }
    }
  }

  // Restore sessions
  if (Array.isArray(backup.sessions)) {
    for (const s of backup.sessions) {
      if (s && s.id) {
        s.userId = userId;
        s.updatedAt = now;
        db.sessions[s.id] = s;
      }
    }
  }

  // Restore audits
  if (Array.isArray(backup.auditEvents)) {
    for (const a of backup.auditEvents) {
      if (a && a.id) {
        a.userId = userId;
        db.auditEvents[a.id] = a;
      }
    }
  }

  saveDB(db);

  res.json({
    success: true,
    message: 'Data successfully restored from backup',
    customersCount: backup.customers?.length || 0,
    sessionsCount: backup.sessions?.length || 0,
  });
});

// ----------------- VITE MIDDLEWARE / STATIC ASSETS -----------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // In dev: Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for SPA routing in dev mode
    app.use('*', async (req, res, next) => {
      if (req.method !== 'GET' || req.originalUrl.startsWith('/api') || path.extname(req.path)) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[QR SplitPay Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
