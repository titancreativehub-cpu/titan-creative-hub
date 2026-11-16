import 'dotenv/config';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_LOGO_URL,
  DEFAULT_SITE_SETTINGS,
  LEGACY_SEED_COURSE_IDS,
  LEGACY_SEED_EBOOK_IDS,
  OFFICIAL_BUSINESS_EMAIL,
  OFFICIAL_WHATSAPP_DIGITS,
  OFFICIAL_WHATSAPP_NUMBER,
  SEED_COURSES,
  SEED_EBOOKS,
} from './server/catalogData.ts';
import {
  isEmailConfigured,
  sendAdminOrderNotification,
  sendCustomerConfirmationEmail,
} from './server/emailService.ts';
import {
  type AuthenticatedRequest,
  getAdminFirestore,
  getAdminStorage,
  isFirebaseAdminConfigured,
  requireAdmin,
  requireAuth,
} from './server/firebaseAdmin.ts';
import type {
  Announcement,
  Course,
  Ebook,
  EbookAvailabilityStatus,
  Enrollment,
  Order,
  ProductType,
  SiteSettings,
  SystemConfigStatus,
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '2mb' }));

// In-memory store for pending orders ONLY when Firebase Admin is unconfigured yet.
// Never grants access or fakes PAID status; purely holds PENDING references & WhatsApp payloads.
const pendingOrdersFallback = new Map<string, Order>();

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildOrderWhatsAppUrl(params: {
  customerName: string;
  customerEmail: string;
  productTitle: string;
  reference: string;
  amountNGN: number;
  status: string;
}): string {
  const message = [
    `Hello TITAN CREATIVE HUB ™, I just initiated an order:`,
    `• Customer Name: ${params.customerName}`,
    `• Customer Email: ${params.customerEmail}`,
    `• Product/Course: ${params.productTitle}`,
    `• Order Reference: ${params.reference}`,
    `• Order Amount: ${formatNGN(params.amountNGN)} (NGN)`,
    `• Payment Status: ${params.status}`,
  ].join('\n');
  return `https://wa.me/${OFFICIAL_WHATSAPP_DIGITS}?text=${encodeURIComponent(message)}`;
}

function getConfigStatus(): SystemConfigStatus {
  const clientRequired: Array<[string, string | undefined]> = [
    ['VITE_FIREBASE_API_KEY', process.env.VITE_FIREBASE_API_KEY],
    ['VITE_FIREBASE_AUTH_DOMAIN', process.env.VITE_FIREBASE_AUTH_DOMAIN],
    ['VITE_FIREBASE_PROJECT_ID', process.env.VITE_FIREBASE_PROJECT_ID],
    ['VITE_FIREBASE_STORAGE_BUCKET', process.env.VITE_FIREBASE_STORAGE_BUCKET],
    ['VITE_FIREBASE_MESSAGING_SENDER_ID', process.env.VITE_FIREBASE_MESSAGING_SENDER_ID],
    ['VITE_FIREBASE_APP_ID', process.env.VITE_FIREBASE_APP_ID],
  ];

  const missingClientVars = clientRequired
    .filter(([, val]) => !val || val.trim() === '')
    .map(([key]) => key);

  const missingServerVars: string[] = [];
  if (!isFirebaseAdminConfigured()) missingServerVars.push('FIREBASE_SERVICE_ACCOUNT_JSON');
  if (!process.env.PAYSTACK_SECRET_KEY) missingServerVars.push('PAYSTACK_SECRET_KEY');
  if (!isEmailConfigured()) missingServerVars.push('GMAIL_USER / GMAIL_APP_PASSWORD');

  const paystackKey = process.env.PAYSTACK_SECRET_KEY || '';
  let paystackMode: 'test' | 'live' | 'unconfigured' = 'unconfigured';
  if (paystackKey.startsWith('sk_test_')) paystackMode = 'test';
  else if (paystackKey.startsWith('sk_live_')) paystackMode = 'live';
  else if (paystackKey.length > 0) paystackMode = 'test';

  return {
    firebaseClientConfigured: missingClientVars.length === 0,
    firebaseAdminConfigured: isFirebaseAdminConfigured(),
    paystackConfigured: paystackKey.length > 0,
    paystackMode,
    emailConfigured: isEmailConfigured(),
    missingClientVars,
    missingServerVars,
  };
}

const OFFICIAL_CATALOG_VERSION = '2026-official-6';

async function syncOfficialCourseCatalogueInFirestore(force = false) {
  const db = getAdminFirestore();
  if (!db) return;

  try {
    const migrationDocRef = db.collection('siteSettings').doc('catalogMigration');
    const migrationSnap = await migrationDocRef.get();
    const alreadyMigrated =
      !force &&
      migrationSnap.exists &&
      migrationSnap.data()?.version === OFFICIAL_CATALOG_VERSION;

    if (!alreadyMigrated) {
      // 1. Retire outdated legacy courses without deleting historical orders/enrollments
      for (const legacyId of LEGACY_SEED_COURSE_IDS) {
        const legacyRef = db.collection('courses').doc(legacyId);
        const legacySnap = await legacyRef.get();
        if (!legacySnap.exists) continue;

        const [ordersSnap, enrSnap] = await Promise.all([
          db.collection('orders').where('productId', '==', legacyId).limit(1).get(),
          db.collection('enrollments').where('productId', '==', legacyId).limit(1).get(),
        ]);

        if (!ordersSnap.empty || !enrSnap.empty) {
          // Preserve historical course metadata for past purchasers, remove from active catalogue
          await legacyRef.update({
            published: false,
            archived: true,
            featured: false,
            updatedAt: new Date().toISOString(),
          });
        } else {
          await legacyRef.delete();
        }
      }

      // 2. Ensure all six official courses exist cleanly without duplicates
      const batch = db.batch();
      for (const course of SEED_COURSES) {
        const ref = db.collection('courses').doc(course.id);
        batch.set(ref, course, { merge: true });
      }
      batch.set(migrationDocRef, {
        version: OFFICIAL_CATALOG_VERSION,
        migratedAt: new Date().toISOString(),
      });
      await batch.commit();
    }

    const settingsDoc = await db.collection('siteSettings').doc('main').get();
    if (!settingsDoc.exists) {
      await db.collection('siteSettings').doc('main').set(DEFAULT_SITE_SETTINGS);
    } else if (!settingsDoc.data()?.logoUrl) {
      await db.collection('siteSettings').doc('main').update({
        logoUrl: DEFAULT_LOGO_URL,
        updatedAt: new Date().toISOString(),
      });
    }

    const annSnap = await db.collection('announcements').limit(1).get();
    if (annSnap.empty) {
      const batch = db.batch();
      for (const ann of DEFAULT_ANNOUNCEMENTS) {
        batch.set(db.collection('announcements').doc(ann.id), ann);
      }
      await batch.commit();
    }
  } catch (err) {
    console.warn('[Firestore Seed] Could not verify/migrate official catalog:', err);
  }
}

const OFFICIAL_EBOOK_CATALOG_VERSION = '2026-official-2-ebooks';

async function syncOfficialEbookStoreInFirestore(force = false) {
  const db = getAdminFirestore();
  if (!db) return;

  try {
    const ebookMigrationRef = db.collection('siteSettings').doc('ebookCatalogMigration');
    const ebookMigrationSnap = await ebookMigrationRef.get();
    const alreadyMigrated =
      !force &&
      ebookMigrationSnap.exists &&
      ebookMigrationSnap.data()?.version === OFFICIAL_EBOOK_CATALOG_VERSION;

    if (!alreadyMigrated) {
      for (const legacyId of LEGACY_SEED_EBOOK_IDS) {
        const legacyRef = db.collection('ebooks').doc(legacyId);
        const legacySnap = await legacyRef.get();
        if (!legacySnap.exists) continue;

        const [ordersSnap, enrSnap] = await Promise.all([
          db.collection('orders').where('productId', '==', legacyId).limit(1).get(),
          db.collection('enrollments').where('productId', '==', legacyId).limit(1).get(),
        ]);

        if (!ordersSnap.empty || !enrSnap.empty) {
          await legacyRef.update({
            published: false,
            archived: true,
            availabilityStatus: 'unpublished',
            featured: false,
            updatedAt: new Date().toISOString(),
          });
        } else {
          await legacyRef.delete();
        }
      }

      const batch = db.batch();
      for (const ebook of SEED_EBOOKS) {
        batch.set(db.collection('ebooks').doc(ebook.id), ebook, { merge: true });
      }
      batch.set(ebookMigrationRef, {
        version: OFFICIAL_EBOOK_CATALOG_VERSION,
        migratedAt: new Date().toISOString(),
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('[Firestore Ebook Seed] Could not verify/migrate official ebooks:', err);
  }
}

async function ensureSeedCatalogInFirestore() {
  await syncOfficialCourseCatalogueInFirestore(false);
  await syncOfficialEbookStoreInFirestore(false);
}

function sanitizeCourseForPublic(course: Course): Course {
  return {
    ...course,
    pdfStoragePath: undefined,
    modules: (course.modules || []).map((mod) => ({
      ...mod,
      lessons: (mod.lessons || []).map((lesson) => ({
        ...lesson,
        videoUrl: lesson.isPreview ? lesson.videoUrl : '',
        videoStoragePath: undefined,
        resourceStoragePath: undefined,
        resourceUrl: undefined,
      })),
    })),
  };
}

function sanitizeEbookForPublic(ebook: Ebook): Ebook {
  return {
    ...ebook,
    pdfStoragePath: undefined,
  };
}

async function getCatalogData(): Promise<{
  courses: Course[];
  ebooks: Ebook[];
  siteSettings: SiteSettings;
  announcements: Announcement[];
}> {
  const db = getAdminFirestore();
  if (!db) {
    return {
      courses: SEED_COURSES.filter((c) => c.published),
      ebooks: SEED_EBOOKS.filter((e) => e.published),
      siteSettings: DEFAULT_SITE_SETTINGS,
      announcements: DEFAULT_ANNOUNCEMENTS.filter((a) => a.active),
    };
  }

  await ensureSeedCatalogInFirestore();

  const [coursesSnap, ebooksSnap, settingsDoc, annSnap] = await Promise.all([
    db.collection('courses').where('published', '==', true).get(),
    db.collection('ebooks').where('published', '==', true).get(),
    db.collection('siteSettings').doc('main').get(),
    db.collection('announcements').where('active', '==', true).get(),
  ]);

  const courses = coursesSnap.docs
    .map((d) => d.data() as Course)
    .filter((c) => !c.archived);

  const ebooks = ebooksSnap.docs
    .map((d) => d.data() as Ebook)
    .filter((e) => !e.archived && e.availabilityStatus !== 'unpublished');

  return {
    courses,
    ebooks,
    siteSettings: (settingsDoc.data() as SiteSettings) || DEFAULT_SITE_SETTINGS,
    announcements: annSnap.docs.map((d) => d.data() as Announcement),
  };
}

async function findProductServerSide(
  productType: ProductType,
  productId: string
): Promise<{
  title: string;
  priceNGN: number;
  published: boolean;
  availabilityStatus?: EbookAvailabilityStatus;
} | null> {
  const db = getAdminFirestore();
  if (db) {
    const col = productType === 'course' ? 'courses' : 'ebooks';
    const docSnap = await db.collection(col).doc(productId).get();
    if (docSnap.exists) {
      if (productType === 'course') {
        const data = docSnap.data() as Course;
        return {
          title: data.title,
          priceNGN: data.priceNGN,
          published: Boolean(data.published && !data.archived),
        };
      }
      const data = docSnap.data() as Ebook;
      return {
        title: data.title,
        priceNGN: data.priceNGN,
        published: Boolean(data.published && !data.archived && data.availabilityStatus !== 'unpublished'),
        availabilityStatus: data.availabilityStatus || (data.published ? 'available' : 'unpublished'),
      };
    }
  }

  if (productType === 'course') {
    const found = SEED_COURSES.find((c) => c.id === productId);
    return found ? { title: found.title, priceNGN: found.priceNGN, published: found.published } : null;
  }
  const found = SEED_EBOOKS.find((e) => e.id === productId);
  return found
    ? {
        title: found.title,
        priceNGN: found.priceNGN,
        published: found.published,
        availabilityStatus: found.availabilityStatus || (found.published ? 'available' : 'unpublished'),
      }
    : null;
}

async function getSignedOrAuthorizedUrl(storagePath?: string, fallbackUrl?: string): Promise<string> {
  if (storagePath) {
    const storage = getAdminStorage();
    if (storage) {
      try {
        const [url] = await storage
          .bucket()
          .file(storagePath)
          .getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 15, // 15-minute short-lived URL
          });
        return url;
      } catch (err) {
        console.warn('[Storage] Signed URL generation failed:', err);
      }
    }
  }
  return fallbackUrl || '';
}

function buildFallbackPdfBuffer(ebook: Ebook, customerEmail: string): Buffer {
  // Minimal valid single-page PDF document with ebook metadata and preview excerpt
  const safeTitle = ebook.title.replace(/[()\\]/g, '');
  const safeAuthor = ebook.author.replace(/[()\\]/g, '');
  const safeBuyer = customerEmail.replace(/[()\\]/g, '');
  const streamContent = [
    'BT',
    '/F1 18 Tf 50 740 Td (TITAN CREATIVE HUB - DIGITAL EDITION) Tj',
    '/F1 14 Tf 0 -36 Td (' + safeTitle + ') Tj',
    '/F1 11 Tf 0 -24 Td (Author: ' + safeAuthor + ') Tj',
    '0 -20 Td (Licensed To: ' + safeBuyer + ') Tj',
    '0 -32 Td (Chapter 1 Excerpt:) Tj',
    '0 -20 Td (' + ebook.previewExcerpt.slice(0, 95).replace(/[()\\]/g, '') + ') Tj',
    '0 -16 Td (' + ebook.previewExcerpt.slice(95, 190).replace(/[()\\]/g, '') + ') Tj',
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(streamContent, 'utf8')} >> stream\n${streamContent}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj + '\n';
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function buildCoursePdfBuffer(course: Course, customerEmail: string): Buffer {
  const safeTitle = course.title.replace(/[()\\]/g, '');
  const safeInstructor = course.instructorName.replace(/[()\\]/g, '');
  const safeBuyer = customerEmail.replace(/[()\\]/g, '');
  const safeSummary = (course.subtitle || course.description).slice(0, 92).replace(/[()\\]/g, '');
  const streamContent = [
    'BT',
    '/F1 18 Tf 50 740 Td (TITAN CREATIVE HUB - OFFICIAL COURSE PDF) Tj',
    '/F1 14 Tf 0 -36 Td (' + safeTitle + ') Tj',
    '/F1 11 Tf 0 -24 Td (Instructor: ' + safeInstructor + ') Tj',
    '0 -20 Td (Licensed Student: ' + safeBuyer + ') Tj',
    '0 -32 Td (Course Overview:) Tj',
    '0 -20 Td (' + safeSummary + ') Tj',
    '0 -28 Td (Modules Included:) Tj',
    ...(course.modules || []).slice(0, 4).map((m, idx) => {
      const modTitle = `${idx + 1}. ${m.title}`.slice(0, 80).replace(/[()\\]/g, '');
      return `0 -18 Td (${modTitle}) Tj`;
    }),
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(streamContent, 'utf8')} >> stream\n${streamContent}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj + '\n';
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

// ---------- Public Health & Config Status ----------
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'TITAN CREATIVE HUB ™', timestamp: new Date().toISOString() });
});

app.get('/api/config/status', (_req, res) => {
  res.json(getConfigStatus());
});

// ---------- Public Catalog ----------
app.get('/api/catalog', async (_req, res) => {
  try {
    const data = await getCatalogData();
    res.json({
      courses: data.courses.map(sanitizeCourseForPublic),
      ebooks: data.ebooks.map(sanitizeEbookForPublic),
      siteSettings: data.siteSettings,
      announcements: data.announcements,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load catalog.' });
  }
});

// ---------- Auth Session Role Check ----------
app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  const db = getAdminFirestore();
  let profile = null;
  if (db && req.authUser) {
    const snap = await db.collection('users').doc(req.authUser.uid).get();
    if (snap.exists) {
      profile = snap.data();
    }
  }
  res.json({
    uid: req.authUser?.uid,
    email: req.authUser?.email,
    emailVerified: req.authUser?.emailVerified,
    isAdmin: Boolean(req.authUser?.isAdmin),
    profile,
  });
});

// ---------- Orders & Paystack Payment Pipeline ----------
app.post('/api/orders/create', async (req: AuthenticatedRequest, res) => {
  try {
    const { customerName, customerEmail, productType, productId } = req.body as {
      customerName?: string;
      customerEmail?: string;
      productType?: ProductType;
      productId?: string;
    };

    if (!customerName || customerName.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide your full name.' });
    }
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (productType !== 'course' && productType !== 'ebook') {
      return res.status(400).json({ error: 'Invalid product type.' });
    }
    if (!productId || !/^[a-zA-Z0-9_-]+$/.test(productId)) {
      return res.status(400).json({ error: 'Invalid product identifier.' });
    }

    // Optional Bearer auth check when Firebase Admin is configured
    let resolvedUserId = 'guest';
    const authHeader = req.headers.authorization;
    if (isFirebaseAdminConfigured() && authHeader?.startsWith('Bearer ')) {
      try {
        const { getAdminAuth } = await import('./server/firebaseAdmin.ts');
        const decoded = await getAdminAuth()!.verifyIdToken(authHeader.slice(7).trim());
        resolvedUserId = decoded.uid;
      } catch {
        return res.status(401).json({ error: 'Invalid authentication session. Please sign in again.' });
      }
    } else if (isFirebaseAdminConfigured() && !authHeader) {
      return res.status(401).json({ error: 'Please sign in to your account before creating an order.' });
    }

    const product = await findProductServerSide(productType, productId);
    if (!product || !product.published) {
      return res.status(404).json({ error: 'Requested course or ebook was not found.' });
    }
    if (productType === 'ebook' && product.availabilityStatus === 'coming_soon') {
      return res.status(403).json({
        error: 'This eBook is currently marked COMING SOON and is not open for purchase yet.',
      });
    }

    const now = new Date().toISOString();
    const orderId = `ord_${crypto.randomBytes(6).toString('hex')}`;
    const reference = `TCH-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const order: Order = {
      id: orderId,
      reference,
      userId: resolvedUserId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      productType,
      productId,
      productTitle: product.title,
      amountNGN: product.priceNGN,
      currency: 'NGN',
      status: 'PENDING',
      paymentProvider: 'paystack',
      whatsappPreparedUrl: buildOrderWhatsAppUrl({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        productTitle: product.title,
        reference,
        amountNGN: product.priceNGN,
        status: 'PENDING',
      }),
      createdAt: now,
      updatedAt: now,
    };

    const db = getAdminFirestore();
    if (db) {
      await db.collection('orders').doc(order.id).set(order);
    } else {
      pendingOrdersFallback.set(order.reference, order);
    }

    const emailStatus = await sendAdminOrderNotification('NEW_ORDER', order);
    order.emailNotificationStatus = emailStatus;

    return res.status(201).json({
      order,
      persistedToFirestore: Boolean(db),
    });
  } catch (err) {
    console.error('[Create Order Error]', err);
    return res.status(500).json({ error: 'Could not create pending order.' });
  }
});

app.post('/api/payments/paystack/initialize', async (req, res) => {
  try {
    const { reference } = req.body as { reference?: string };
    if (!reference) {
      return res.status(400).json({ error: 'Order reference is required.' });
    }

    let order: Order | null = null;
    const db = getAdminFirestore();
    if (db) {
      const snap = await db.collection('orders').where('reference', '==', reference).limit(1).get();
      if (!snap.empty) order = snap.docs[0].data() as Order;
    } else {
      order = pendingOrdersFallback.get(reference) || null;
    }

    if (!order) {
      return res.status(404).json({ error: 'Pending order not found.' });
    }
    if (order.status === 'PAID') {
      return res.status(409).json({ error: 'This order has already been paid and verified.' });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return res.status(503).json({
        configured: false,
        error:
          'Paystack backend key (PAYSTACK_SECRET_KEY) is not configured yet. Order remains PENDING. You can contact us on WhatsApp or configure PAYSTACK_SECRET_KEY in server environment variables.',
        missing: ['PAYSTACK_SECRET_KEY'],
        order,
      });
    }

    const origin =
      process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
        ? process.env.APP_URL
        : `${req.protocol}://${req.get('host')}`;

    const paystackResp = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: order.customerEmail,
        amount: Math.round(order.amountNGN * 100), // kobo
        currency: 'NGN',
        reference: order.reference,
        callback_url: `${origin}/payment/callback?reference=${encodeURIComponent(order.reference)}`,
        metadata: {
          orderId: order.id,
          productType: order.productType,
          productId: order.productId,
          userId: order.userId,
          customerName: order.customerName,
        },
      }),
    });

    const data = (await paystackResp.json()) as {
      status: boolean;
      message?: string;
      data?: { authorization_url: string; access_code: string; reference: string };
    };

    if (!paystackResp.ok || !data.status || !data.data?.authorization_url) {
      return res.status(502).json({
        error: data.message || 'Paystack refused payment initialization.',
      });
    }

    return res.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
      mode: paystackSecret.startsWith('sk_live_') ? 'live' : 'test',
    });
  } catch (err) {
    console.error('[Paystack Init Error]', err);
    return res.status(500).json({ error: 'Payment initialization failed.' });
  }
});

app.post('/api/payments/paystack/verify', async (req, res) => {
  try {
    const { reference } = req.body as { reference?: string };
    if (!reference) {
      return res.status(400).json({ error: 'Payment reference is required.' });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return res.status(503).json({
        configured: false,
        error: 'Paystack backend verification requires PAYSTACK_SECRET_KEY to be configured.',
      });
    }

    const db = getAdminFirestore();
    if (!db) {
      return res.status(503).json({
        configured: false,
        error: 'Firebase Admin Firestore must be configured to persist verified order fulfillment.',
      });
    }

    const orderQuery = await db.collection('orders').where('reference', '==', reference).limit(1).get();
    if (orderQuery.empty) {
      return res.status(404).json({ error: 'Order record not found for this reference.' });
    }

    const orderDoc = orderQuery.docs[0];
    const order = orderDoc.data() as Order;

    // Duplicate payment processing guard
    if (order.status === 'PAID') {
      return res.json({ verified: true, alreadyProcessed: true, order });
    }

    const verifyResp = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
      }
    );

    const payload = (await verifyResp.json()) as {
      status: boolean;
      message?: string;
      data?: {
        status: string;
        reference: string;
        amount: number;
        currency: string;
        id?: number;
      };
    };

    const tx = payload.data;
    const expectedKobo = Math.round(order.amountNGN * 100);
    const isSuccess =
      verifyResp.ok &&
      payload.status === true &&
      tx?.status === 'success' &&
      tx?.currency === 'NGN' &&
      tx?.amount >= expectedKobo;

    const now = new Date().toISOString();

    if (!isSuccess) {
      const failedOrder: Order = {
        ...order,
        status: 'FAILED',
        paymentReference: tx?.reference || reference,
        paystackStatus: tx?.status || 'failed',
        whatsappPreparedUrl: buildOrderWhatsAppUrl({
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          productTitle: order.productTitle,
          reference: order.reference,
          amountNGN: order.amountNGN,
          status: 'FAILED',
        }),
        updatedAt: now,
      };
      await orderDoc.ref.update({
        status: 'FAILED',
        paymentReference: failedOrder.paymentReference,
        paystackStatus: failedOrder.paystackStatus,
        whatsappPreparedUrl: failedOrder.whatsappPreparedUrl,
        updatedAt: now,
      });
      await sendAdminOrderNotification('PAYMENT_FAILED', failedOrder);
      return res.status(402).json({
        verified: false,
        error: 'Payment verification failed or was not completed on Paystack.',
        order: failedOrder,
      });
    }

    // Atomic fulfillment: mark PAID + grant enrollment
    const paymentRef = String(tx?.id || tx?.reference || reference);
    const paidOrder: Order = {
      ...order,
      status: 'PAID',
      paymentReference: paymentRef,
      paystackStatus: 'success',
      whatsappPreparedUrl: buildOrderWhatsAppUrl({
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        productTitle: order.productTitle,
        reference: order.reference,
        amountNGN: order.amountNGN,
        status: 'PAID',
      }),
      paidAt: now,
      updatedAt: now,
    };

    const enrollmentId = `${order.userId}_${order.productType}_${order.productId}`;
    const enrollment: Enrollment = {
      id: enrollmentId,
      userId: order.userId,
      productType: order.productType,
      productId: order.productId,
      orderId: order.id,
      grantedBy: 'paystack_verified',
      completedLessonIds: [],
      createdAt: now,
    };

    const batch = db.batch();
    batch.update(orderDoc.ref, {
      status: 'PAID',
      paymentReference: paymentRef,
      paystackStatus: 'success',
      whatsappPreparedUrl: paidOrder.whatsappPreparedUrl,
      paidAt: now,
      updatedAt: now,
    });
    batch.set(db.collection('enrollments').doc(enrollmentId), enrollment, { merge: true });
    await batch.commit();

    await Promise.all([
      sendAdminOrderNotification('PAYMENT_VERIFIED', paidOrder),
      sendAdminOrderNotification(
        order.productType === 'course' ? 'COURSE_PURCHASED' : 'EBOOK_PURCHASED',
        paidOrder
      ),
      sendCustomerConfirmationEmail(paidOrder),
    ]);

    return res.json({ verified: true, order: paidOrder, enrollment });
  } catch (err) {
    console.error('[Paystack Verify Error]', err);
    return res.status(500).json({ error: 'Server-side payment verification failed.' });
  }
});

app.post('/api/orders/:orderId/refund-request', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getAdminFirestore()!;
    const { orderId } = req.params;
    const { reason } = req.body as { reason?: string };

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderDoc.data() as Order;
    if (order.userId !== req.authUser?.uid && !req.authUser?.isAdmin) {
      return res.status(403).json({ error: 'You cannot request a refund for another user’s order.' });
    }
    if (order.status !== 'PAID') {
      return res.status(400).json({ error: 'Only PAID orders are eligible for refund requests.' });
    }

    const now = new Date().toISOString();
    const updatedOrder: Order = {
      ...order,
      status: 'REFUND_REQUESTED',
      refundReason: (reason || 'Customer requested refund').slice(0, 500),
      updatedAt: now,
    };

    await orderDoc.ref.update({
      status: 'REFUND_REQUESTED',
      refundReason: updatedOrder.refundReason,
      updatedAt: now,
    });

    await sendAdminOrderNotification('REFUND_REQUESTED', updatedOrder);
    return res.json({ order: updatedOrder });
  } catch (err) {
    return res.status(500).json({ error: 'Could not submit refund request.' });
  }
});

// ---------- Student Dashboard, Video Learning & Protected Downloads ----------
app.get('/api/student/dashboard', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getAdminFirestore()!;
    const uid = req.authUser!.uid;

    const [enrollmentsSnap, ordersSnap, catalog] = await Promise.all([
      db.collection('enrollments').where('userId', '==', uid).get(),
      db.collection('orders').where('userId', '==', uid).get(),
      getCatalogData(),
    ]);

    const enrollments: Enrollment[] = enrollmentsSnap.docs.map((d) => d.data() as Enrollment);
    const orders: Order[] = ordersSnap.docs
      .map((d) => d.data() as Order)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const enrolledCourseIds = Array.from(
      new Set(enrollments.filter((e) => e.productType === 'course').map((e) => e.productId))
    );
    const enrolledEbookIds = Array.from(
      new Set(enrollments.filter((e) => e.productType === 'ebook').map((e) => e.productId))
    );

    // Fetch enrolled courses & ebooks directly so historical purchasers retain access even if archived
    const [enrolledCourseDocs, enrolledEbookDocs] = await Promise.all([
      Promise.all(enrolledCourseIds.map((cid) => db.collection('courses').doc(cid).get())),
      Promise.all(enrolledEbookIds.map((eid) => db.collection('ebooks').doc(eid).get())),
    ]);
    const myCourses: Course[] = enrolledCourseDocs
      .map((snap) => (snap.exists ? (snap.data() as Course) : null))
      .filter((c): c is Course => Boolean(c))
      .map(sanitizeCourseForPublic);

    const myEbooks: Ebook[] = enrolledEbookDocs
      .map((snap) => (snap.exists ? (snap.data() as Ebook) : null))
      .filter((e): e is Ebook => Boolean(e))
      .map(sanitizeEbookForPublic);

    return res.json({ enrollments, orders, myCourses, myEbooks });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load student dashboard.' });
  }
});

app.post('/api/student/progress', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getAdminFirestore()!;
    const uid = req.authUser!.uid;
    const { courseId, lessonId, completed } = req.body as {
      courseId?: string;
      lessonId?: string;
      completed?: boolean;
    };

    if (!courseId || !lessonId) {
      return res.status(400).json({ error: 'courseId and lessonId are required.' });
    }

    const enrollmentId = `${uid}_course_${courseId}`;
    const enrRef = db.collection('enrollments').doc(enrollmentId);
    const enrSnap = await enrRef.get();

    if (!enrSnap.exists && !req.authUser!.isAdmin) {
      return res.status(403).json({ error: 'You are not enrolled in this course.' });
    }

    const now = new Date().toISOString();
    if (enrSnap.exists) {
      const current = enrSnap.data() as Enrollment;
      const set = new Set(current.completedLessonIds || []);
      if (completed === true) set.add(lessonId);
      else if (completed === false) set.delete(lessonId);

      const updatedIds = Array.from(set);
      await enrRef.update({
        completedLessonIds: updatedIds,
        lastAccessedLessonId: lessonId,
        lastAccessedAt: now,
      });
      return res.json({ completedLessonIds: updatedIds, lastAccessedLessonId: lessonId });
    }

    return res.json({ completedLessonIds: [], lastAccessedLessonId: lessonId });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update learning progress.' });
  }
});

app.get('/api/learn/:courseId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getAdminFirestore()!;
    const uid = req.authUser!.uid;
    const { courseId } = req.params;

    const enrollmentId = `${uid}_course_${courseId}`;
    const enrSnap = await db.collection('enrollments').doc(enrollmentId).get();

    if (!enrSnap.exists && !req.authUser!.isAdmin) {
      return res.status(403).json({ error: 'Purchase required to access this course.' });
    }

    const courseDoc = await db.collection('courses').doc(courseId).get();
    const course = (courseDoc.exists
      ? (courseDoc.data() as Course)
      : SEED_COURSES.find((c) => c.id === courseId)) as Course | undefined;

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Resolve short-lived signed URLs for private storage videos/resources
    const resolvedModules = await Promise.all(
      (course.modules || []).map(async (mod) => ({
        ...mod,
        lessons: await Promise.all(
          (mod.lessons || []).map(async (lesson) => ({
            ...lesson,
            videoUrl: await getSignedOrAuthorizedUrl(lesson.videoStoragePath, lesson.videoUrl),
            resourceUrl: lesson.resourceName
              ? `/api/downloads/resource/${course.id}/${lesson.id}`
              : undefined,
          }))
        ),
      }))
    );

    return res.json({
      course: { ...course, modules: resolvedModules },
      enrollment: enrSnap.exists ? enrSnap.data() : null,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load authorized course player.' });
  }
});

app.get('/api/downloads/ebook/:ebookId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getAdminFirestore()!;
    const uid = req.authUser!.uid;
    const { ebookId } = req.params;

    const enrSnap = await db.collection('enrollments').doc(`${uid}_ebook_${ebookId}`).get();
    if (!enrSnap.exists && !req.authUser!.isAdmin) {
      return res.status(403).json({ error: 'Verified purchase required to download this ebook.' });
    }

    const ebookDoc = await db.collection('ebooks').doc(ebookId).get();
    const ebook = (ebookDoc.exists
      ? (ebookDoc.data() as Ebook)
      : SEED_EBOOKS.find((e) => e.id === ebookId)) as Ebook | undefined;

    if (!ebook) {
      return res.status(404).json({ error: 'Ebook not found.' });
    }

    if (ebook.pdfStoragePath) {
      const signedUrl = await getSignedOrAuthorizedUrl(ebook.pdfStoragePath);
      if (signedUrl) {
        return res.json({ downloadUrl: signedUrl, fileName: ebook.pdfFileName || `${ebook.slug}.pdf` });
      }
    }

    const pdfBuffer = buildFallbackPdfBuffer(ebook, req.authUser!.email);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${ebook.pdfFileName || `${ebook.slug}.pdf`}"`
    );
    return res.send(pdfBuffer);
  } catch (err) {
    return res.status(500).json({ error: 'Could not authorize ebook download.' });
  }
});

app.get('/api/downloads/course-pdf/:courseId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getAdminFirestore()!;
    const uid = req.authUser!.uid;
    const { courseId } = req.params;

    const enrSnap = await db.collection('enrollments').doc(`${uid}_course_${courseId}`).get();
    if (!enrSnap.exists && !req.authUser!.isAdmin) {
      return res.status(403).json({ error: 'Verified course purchase required to download PDF material.' });
    }

    const courseDoc = await db.collection('courses').doc(courseId).get();
    const course = (courseDoc.exists
      ? (courseDoc.data() as Course)
      : SEED_COURSES.find((c) => c.id === courseId)) as Course | undefined;

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (course.pdfStoragePath) {
      const signedUrl = await getSignedOrAuthorizedUrl(course.pdfStoragePath);
      if (signedUrl) {
        return res.json({
          downloadUrl: signedUrl,
          fileName: course.pdfFileName || `${course.slug}.pdf`,
        });
      }
    }

    const pdfBuffer = buildCoursePdfBuffer(course, req.authUser!.email);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${course.pdfFileName || `${course.slug}.pdf`}"`
    );
    return res.send(pdfBuffer);
  } catch (err) {
    return res.status(500).json({ error: 'Could not authorize course PDF download.' });
  }
});

app.get('/api/downloads/resource/:courseId/:lessonId', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const db = getAdminFirestore()!;
    const uid = req.authUser!.uid;
    const { courseId, lessonId } = req.params;

    const enrSnap = await db.collection('enrollments').doc(`${uid}_course_${courseId}`).get();
    if (!enrSnap.exists && !req.authUser!.isAdmin) {
      return res.status(403).json({ error: 'Course enrollment required to download lesson resources.' });
    }

    const courseDoc = await db.collection('courses').doc(courseId).get();
    const course = (courseDoc.exists
      ? (courseDoc.data() as Course)
      : SEED_COURSES.find((c) => c.id === courseId)) as Course | undefined;

    const lesson = course?.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId);
    if (!lesson || !lesson.resourceName) {
      return res.status(404).json({ error: 'Lesson resource not found.' });
    }

    if (lesson.resourceStoragePath) {
      const signedUrl = await getSignedOrAuthorizedUrl(lesson.resourceStoragePath);
      if (signedUrl) {
        return res.json({ downloadUrl: signedUrl, fileName: lesson.resourceName });
      }
    }

    const content = [
      `TITAN CREATIVE HUB ™ — COURSE WORKBOOK RESOURCE`,
      `Course: ${course?.title}`,
      `Lesson: ${lesson.title}`,
      `Licensed Student: ${req.authUser!.email}`,
      `=================================================`,
      ``,
      lesson.description,
      ``,
      `Action Checklist:`,
      `1. Review the architectural principles covered in this lesson.`,
      `2. Apply the framework to your current studio deliverable.`,
      `3. Reach out via ${OFFICIAL_BUSINESS_EMAIL} or WhatsApp ${OFFICIAL_WHATSAPP_NUMBER} for cohort Q&A.`,
    ].join('\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${lesson.resourceName}"`);
    return res.send(content);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to authorize resource download.' });
  }
});

// ---------- Admin Dashboard Endpoints (RBAC Enforced) ----------
app.get('/api/admin/overview', requireAdmin, async (_req, res) => {
  try {
    const db = getAdminFirestore()!;
    await ensureSeedCatalogInFirestore();

    const [usersSnap, coursesSnap, ebooksSnap, ordersSnap, settingsDoc, annSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('courses').get(),
      db.collection('ebooks').get(),
      db.collection('orders').get(),
      db.collection('siteSettings').doc('main').get(),
      db.collection('announcements').get(),
    ]);

    const users = usersSnap.docs.map((d) => d.data());
    const allCourses: Course[] = coursesSnap.docs.map((d) => d.data() as Course);
    const courses: Course[] = allCourses.filter((c) => !c.archived);
    const allEbooks: Ebook[] = ebooksSnap.docs.map((d) => d.data() as Ebook);
    const ebooks: Ebook[] = allEbooks.filter((e) => !e.archived);
    const orders: Order[] = ordersSnap.docs
      .map((d) => d.data() as Order)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const announcements: Announcement[] = annSnap.docs.map((d) => d.data() as Announcement);
    const siteSettings = (settingsDoc.data() as SiteSettings) || DEFAULT_SITE_SETTINGS;

    const paidOrders = orders.filter((o) => o.status === 'PAID');
    const totalRevenueNGN = paidOrders.reduce((sum, o) => sum + (o.amountNGN || 0), 0);

    return res.json({
      stats: {
        totalUsers: users.length,
        totalCourses: courses.length,
        totalEbooks: ebooks.length,
        totalOrders: orders.length,
        paidOrdersCount: paidOrders.length,
        totalRevenueNGN,
      },
      users,
      courses,
      ebooks,
      orders,
      announcements,
      siteSettings,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load admin overview.' });
  }
});

app.post('/api/admin/catalog/sync-official', requireAdmin, async (_req, res) => {
  try {
    await syncOfficialCourseCatalogueInFirestore(true);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to sync official course catalogue.' });
  }
});

app.post('/api/admin/ebooks/sync-official', requireAdmin, async (_req, res) => {
  try {
    await syncOfficialEbookStoreInFirestore(true);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to sync official eBook Store.' });
  }
});

app.post('/api/admin/courses', requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore()!;
    const payload = req.body as Partial<Course>;
    if (!payload.title || !payload.instructorName || payload.priceNGN === undefined) {
      return res.status(400).json({ error: 'Course title, instructor, and NGN price are required.' });
    }
    const id = payload.id || `course_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();
    const modules = payload.modules || [];
    const lessonsCount = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
    const course: Course = {
      id,
      title: payload.title.trim(),
      slug: payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      subtitle: payload.subtitle || '',
      description: payload.description || '',
      thumbnailUrl: payload.thumbnailUrl || '/src/assets/images/thumb_ai_video_pro_1794826829753.jpg',
      thumbnailStoragePath: payload.thumbnailStoragePath,
      instructorName: payload.instructorName.trim(),
      instructorTitle: payload.instructorTitle || 'Lead Instructor',
      category: payload.category || 'AI Video',
      priceNGN: Number(payload.priceNGN) || 0,
      duration: payload.duration || '6h 00m',
      level: payload.level || 'Intermediate',
      formatLabel: payload.formatLabel || 'Online Course',
      isPdfCourse: Boolean(payload.isPdfCourse),
      pdfStoragePath: payload.pdfStoragePath,
      pdfFileName: payload.pdfFileName,
      enrollmentInfo: payload.enrollmentInfo || '',
      lessonsCount,
      published: Boolean(payload.published),
      archived: Boolean(payload.archived),
      featured: Boolean(payload.featured),
      outcomes: payload.outcomes || [],
      modules,
      createdAt: payload.createdAt || now,
      updatedAt: now,
    };
    await db.collection('courses').doc(id).set(course, { merge: true });
    return res.json({ course });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save course.' });
  }
});

app.delete('/api/admin/courses/:id', requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore()!;
    await db.collection('courses').doc(req.params.id).delete();
    return res.json({ deleted: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete course.' });
  }
});

app.post('/api/admin/ebooks', requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore()!;
    const payload = req.body as Partial<Ebook>;
    if (!payload.title || !payload.author || payload.priceNGN === undefined) {
      return res.status(400).json({ error: 'Ebook title, author, and NGN price are required.' });
    }
    const id = payload.id || `ebook_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();
    const availabilityStatus: EbookAvailabilityStatus =
      payload.availabilityStatus ||
      (payload.published === false ? 'unpublished' : 'available');
    const published = availabilityStatus !== 'unpublished';

    const ebook: Ebook = {
      id,
      title: payload.title.trim(),
      slug: payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      subtitle: payload.subtitle || '',
      description: payload.description || '',
      author: payload.author.trim(),
      category: payload.category || 'AI Creator Economy',
      priceNGN: Number(payload.priceNGN) || 0,
      pages: Number(payload.pages) || 100,
      format: payload.format || 'PDF Digital Edition',
      coverUrl:
        payload.coverUrl || '/src/assets/images/cover_ai_influencer_foreign_1794827923902.jpg',
      coverStoragePath: payload.coverStoragePath,
      pdfStoragePath: payload.pdfStoragePath,
      pdfFileName: payload.pdfFileName,
      previewExcerpt: payload.previewExcerpt || '',
      tableOfContents: payload.tableOfContents || [],
      availabilityStatus,
      published,
      archived: Boolean(payload.archived),
      featured: payload.featured ?? true,
      createdAt: payload.createdAt || now,
      updatedAt: now,
    };
    await db.collection('ebooks').doc(id).set(ebook, { merge: true });
    return res.json({ ebook });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save ebook.' });
  }
});

app.delete('/api/admin/ebooks/:id', requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore()!;
    await db.collection('ebooks').doc(req.params.id).delete();
    return res.json({ deleted: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete ebook.' });
  }
});

app.post('/api/admin/users/:uid/suspend', requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore()!;
    const { suspended } = req.body as { suspended?: boolean };
    await db.collection('users').doc(req.params.uid).update({
      suspended: Boolean(suspended),
      updatedAt: new Date().toISOString(),
    });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
});

app.post('/api/admin/users/:uid/grant-access', requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore()!;
    const { uid } = req.params;
    const { productType, productId } = req.body as { productType?: ProductType; productId?: string };
    if ((productType !== 'course' && productType !== 'ebook') || !productId) {
      return res.status(400).json({ error: 'Valid productType and productId are required.' });
    }
    const enrollmentId = `${uid}_${productType}_${productId}`;
    const enrollment: Enrollment = {
      id: enrollmentId,
      userId: uid,
      productType,
      productId,
      orderId: `admin_grant_${Date.now()}`,
      grantedBy: 'admin_grant',
      completedLessonIds: [],
      createdAt: new Date().toISOString(),
    };
    await db.collection('enrollments').doc(enrollmentId).set(enrollment, { merge: true });
    return res.json({ enrollment });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to grant product access.' });
  }
});

app.post('/api/admin/orders/:orderId/refund', requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore()!;
    const orderDoc = await db.collection('orders').doc(req.params.orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderDoc.data() as Order;
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return res.status(503).json({
        error: 'Paystack Secret Key is required to process automated refunds through Paystack.',
      });
    }

    const refundResp = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: order.paymentReference || order.reference,
        amount: Math.round(order.amountNGN * 100),
      }),
    });

    const refundData = (await refundResp.json()) as { status: boolean; message?: string };
    if (!refundResp.ok || !refundData.status) {
      return res.status(502).json({
        error: refundData.message || 'Paystack refund API rejected the refund request.',
      });
    }

    const now = new Date().toISOString();
    await orderDoc.ref.update({ status: 'REFUNDED', updatedAt: now });
    const enrollmentId = `${order.userId}_${order.productType}_${order.productId}`;
    await db.collection('enrollments').doc(enrollmentId).delete();

    return res.json({ refunded: true });
  } catch (err) {
    return res.status(500).json({ error: 'Refund processing failed.' });
  }
});

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore()!;
    const settings: SiteSettings = {
      ...DEFAULT_SITE_SETTINGS,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    await db.collection('siteSettings').doc('main').set(settings, { merge: true });
    return res.json({ siteSettings: settings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update site settings.' });
  }
});

app.post('/api/admin/announcements', requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore()!;
    const { title, message, active } = req.body as Partial<Announcement>;
    if (!title || !message) {
      return res.status(400).json({ error: 'Announcement title and message are required.' });
    }
    const id = `ann_${crypto.randomBytes(4).toString('hex')}`;
    const ann: Announcement = {
      id,
      title: title.trim(),
      message: message.trim(),
      active: active !== false,
      createdAt: new Date().toISOString(),
    };
    await db.collection('announcements').doc(id).set(ann);
    return res.json({ announcement: ann });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create announcement.' });
  }
});

app.delete('/api/admin/announcements/:id', requireAdmin, async (req, res) => {
  try {
    const db = getAdminFirestore()!;
    await db.collection('announcements').doc(req.params.id).delete();
    return res.json({ deleted: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete announcement.' });
  }
});

// ---------- Vite / Production Static Handler ----------
async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`TITAN CREATIVE HUB ™ running on http://0.0.0.0:${port}`);
  });
}

startServer();
