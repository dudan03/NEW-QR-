import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return {
      users: {},
      businesses: {},
      customers: {},
      sessions: {},
      auditEvents: {},
    };
  }
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
  res.json(session);
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

  res.json({
    syncedAt: serverNow,
    status: 'synced',
    customers: userCustomers,
    sessions: userSessions,
    auditEvents: userAudits,
    business: userBiz,
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
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for SPA routing in dev mode
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
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
