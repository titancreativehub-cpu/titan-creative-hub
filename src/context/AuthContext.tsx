import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
} from '../lib/firebase';
import type { SystemConfigStatus, UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  idToken: string | null;
  isAdmin: boolean;
  loading: boolean;
  configStatus: SystemConfigStatus | null;
  refreshConfigStatus: () => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: { fullName: string; phone?: string; bio?: string }) => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configStatus, setConfigStatus] = useState<SystemConfigStatus | null>(null);

  const refreshConfigStatus = useCallback(async () => {
    try {
      const resp = await fetch('/api/config/status');
      if (resp.ok) {
        const data = (await resp.json()) as SystemConfigStatus;
        setConfigStatus(data);
      }
    } catch {
      // Ignore transient network check errors
    }
  }, []);

  useEffect(() => {
    refreshConfigStatus();
  }, [refreshConfigStatus]);

  const syncUserSession = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setUser(null);
      setProfile(null);
      setIdToken(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setUser(firebaseUser);
    try {
      const token = await firebaseUser.getIdToken();
      setIdToken(token);

      // Verify server-side role (never local-only admin permissions)
      const meResp = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meResp.ok) {
        const meData = await meResp.json();
        setIsAdmin(Boolean(meData.isAdmin));
        if (meData.profile) {
          setProfile(meData.profile as UserProfile);
          setLoading(false);
          return;
        }
      }

      if (db) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            const now = new Date().toISOString();
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              fullName: firebaseUser.displayName || 'Student',
              email: firebaseUser.email || '',
              role: 'student',
              suspended: false,
              createdAt: now,
              updatedAt: now,
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      }
    } catch (err) {
      console.error('Auth sync error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      syncUserSession(fbUser);
    });
    return () => unsub();
  }, [syncUserSession]);

  const register = async (fullName: string, email: string, password: string) => {
    if (!auth || !db) {
      throw new Error('Firebase Authentication is not configured.');
    }
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: fullName.trim() });

    const now = new Date().toISOString();
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role: 'student',
      suspended: false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${cred.user.uid}`);
    }

    try {
      await sendEmailVerification(cred.user);
    } catch {
      // Non-fatal if verification email rate-limited
    }

    setProfile(newProfile);
  };

  const login = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase Authentication is not configured.');
    }
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      throw new Error('Firebase Authentication is not configured.');
    }
    await sendPasswordResetEmail(auth, email.trim());
  };

  const updateUserProfile = async (updates: { fullName: string; phone?: string; bio?: string }) => {
    if (!auth?.currentUser || !db) {
      throw new Error('You must be signed in with Firebase configured.');
    }
    await updateProfile(auth.currentUser, { displayName: updates.fullName.trim() });
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fullName: updates.fullName.trim(),
        phone: updates.phone?.trim() || '',
        bio: updates.bio?.trim() || '',
        updatedAt: now,
      });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              fullName: updates.fullName.trim(),
              phone: updates.phone?.trim() || '',
              bio: updates.bio?.trim() || '',
              updatedAt: now,
            }
          : null
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    if (!auth?.currentUser) return null;
    const token = await auth.currentUser.getIdToken(true);
    setIdToken(token);
    return token;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        idToken,
        isAdmin,
        loading,
        configStatus,
        refreshConfigStatus,
        register,
        login,
        logout,
        resetPassword,
        updateUserProfile,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
