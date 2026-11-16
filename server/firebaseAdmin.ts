import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import type { Request, Response, NextFunction } from 'express';

let adminInitialized = false;
let initError: string | null = null;

export function initFirebaseAdmin() {
  if (adminInitialized || getApps().length > 0) {
    adminInitialized = true;
    return;
  }

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET;

  if (rawServiceAccount && rawServiceAccount.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawServiceAccount);
      initializeApp({
        credential: cert(parsed),
        storageBucket: storageBucket || `${parsed.project_id}.appspot.com`,
      });
      adminInitialized = true;
      return;
    } catch (err) {
      initError = err instanceof Error ? err.message : 'Invalid FIREBASE_SERVICE_ACCOUNT_JSON';
      console.warn('[Firebase Admin] Failed to parse service account JSON:', initError);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && projectId) {
    try {
      initializeApp({
        credential: applicationDefault(),
        projectId,
        storageBucket,
      });
      adminInitialized = true;
      return;
    } catch (err) {
      initError = err instanceof Error ? err.message : 'Failed applicationDefault init';
    }
  }
}

initFirebaseAdmin();

export function isFirebaseAdminConfigured(): boolean {
  return adminInitialized && getApps().length > 0;
}

export function getAdminFirestore(): Firestore | null {
  if (!isFirebaseAdminConfigured()) return null;
  return getFirestore();
}

export function getAdminAuth(): Auth | null {
  if (!isFirebaseAdminConfigured()) return null;
  return getAuth();
}

export function getAdminStorage(): Storage | null {
  if (!isFirebaseAdminConfigured()) return null;
  return getStorage();
}

export interface AuthenticatedRequest extends Request {
  authUser?: {
    uid: string;
    email: string;
    emailVerified: boolean;
    name?: string;
    isAdmin: boolean;
  };
}

function getAllowlistedAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function verifyIsAdminUid(
  uid: string,
  email?: string,
  emailVerified?: boolean
): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;

  try {
    const adminDoc = await db.collection('admins').doc(uid).get();
    if (adminDoc.exists) return true;

    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists && userDoc.data()?.role === 'admin') return true;

    if (email && emailVerified) {
      const allowlist = getAllowlistedAdminEmails();
      if (allowlist.includes(email.toLowerCase())) {
        return true;
      }
    }
  } catch (err) {
    console.error('[Firebase Admin] Error checking admin privileges:', err);
  }
  return false;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!isFirebaseAdminConfigured()) {
    return res.status(503).json({
      error: 'Firebase Admin SDK is not configured on the server.',
      code: 'FIREBASE_ADMIN_UNCONFIGURED',
    });
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization Bearer token.' });
  }

  const token = header.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'Empty Authorization token.' });
  }

  try {
    const auth = getAdminAuth()!;
    const decoded = await auth.verifyIdToken(token);
    const db = getAdminFirestore();
    if (db) {
      const userSnap = await db.collection('users').doc(decoded.uid).get();
      if (userSnap.exists && userSnap.data()?.suspended === true) {
        return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
      }
    }

    const isAdmin = await verifyIsAdminUid(decoded.uid, decoded.email, decoded.email_verified);
    req.authUser = {
      uid: decoded.uid,
      email: decoded.email || '',
      emailVerified: Boolean(decoded.email_verified),
      name: decoded.name,
      isAdmin,
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired authentication token.',
      details: err instanceof Error ? err.message : undefined,
    });
  }
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if (!req.authUser?.isAdmin) {
      return res.status(403).json({
        error: 'Administrator privileges are required for this action.',
      });
    }
    return next();
  });
}
