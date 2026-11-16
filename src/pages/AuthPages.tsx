import React, { useState } from 'react';
import { LogOut, Mail, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { isFirebaseConfigured } from '../lib/firebase';
import { ConfigBanner } from '../components/ConfigBanner';

export function LoginPage() {
  const { login } = useAuth();
  const { navigate } = useSite();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <div className="rounded-sm border border-white/10 bg-[#111114] p-7 sm:p-9 space-y-6">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            Student & Faculty Access
          </p>
          <h1 className="font-display text-3xl font-semibold text-[#F5F4F0]">Sign In</h1>
          <p className="text-xs text-[#A1A1AA]">
            Access your enrolled courses, video lessons, and purchased digital monographs.
          </p>
        </div>

        {!isFirebaseConfigured && (
          <ConfigBanner title="Firebase Authentication Not Configured" scope="firebase" />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0] placeholder:text-[#52525B] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-medium text-[#A1A1AA]">
                Password
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs text-[#D4AF37] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0] placeholder:text-[#52525B] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-sm border border-red-500/30 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !isFirebaseConfigured}
            className="w-full rounded-sm bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#E5C158] disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="border-t border-white/10 pt-5 text-center text-xs text-[#A1A1AA]">
          New to TITAN CREATIVE HUB ™?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="font-semibold text-[#D4AF37] hover:underline"
          >
            Create a student account
          </button>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const { navigate } = useSite();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(fullName, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <div className="rounded-sm border border-white/10 bg-[#111114] p-7 sm:p-9 space-y-6">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            Join the Academy
          </p>
          <h1 className="font-display text-3xl font-semibold text-[#F5F4F0]">
            Create Student Account
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Register to enroll in courses, track progress, and manage digital purchases.
          </p>
        </div>

        {!isFirebaseConfigured && (
          <ConfigBanner title="Firebase Authentication Not Configured" scope="firebase" />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Chinedu Okonkwo"
              className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0] placeholder:text-[#52525B] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chinedu@example.com"
              className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0] placeholder:text-[#52525B] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-pass" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Password (minimum 8 characters)
            </label>
            <input
              id="reg-pass"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0] placeholder:text-[#52525B] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-confirm" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Confirm Password
            </label>
            <input
              id="reg-confirm"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0] placeholder:text-[#52525B] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-sm border border-red-500/30 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !isFirebaseConfigured}
            className="w-full rounded-sm bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#E5C158] disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="border-t border-white/10 pt-5 text-center text-xs text-[#A1A1AA]">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-semibold text-[#D4AF37] hover:underline"
          >
            Sign in instead
          </button>
        </p>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { navigate } = useSite();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <div className="rounded-sm border border-white/10 bg-[#111114] p-7 sm:p-9 space-y-6">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            Account Recovery
          </p>
          <h1 className="font-display text-3xl font-semibold text-[#F5F4F0]">Reset Password</h1>
          <p className="text-xs text-[#A1A1AA]">
            Enter your account email and Firebase will dispatch a secure password reset link.
          </p>
        </div>

        {!isFirebaseConfigured && (
          <ConfigBanner title="Firebase Authentication Not Configured" scope="firebase" />
        )}

        {sent ? (
          <div className="space-y-4 rounded-sm border border-[#D4AF37]/30 bg-[#09090B] p-5 text-sm">
            <div className="flex items-center gap-2 text-[#D4AF37] font-semibold">
              <Mail className="h-4 w-4" />
              <span>Password Reset Email Sent</span>
            </div>
            <p className="text-xs leading-relaxed text-[#A1A1AA]">
              Check the inbox for <span className="text-[#F5F4F0]">{email}</span> and follow the Firebase reset link to choose a new password.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-[#D4AF37] hover:underline"
            >
              Return to Sign In →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-sm border border-red-500/30 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !isFirebaseConfigured}
              className="w-full rounded-sm bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#E5C158] disabled:opacity-50"
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user, profile, updateUserProfile, logout, isAdmin } = useAuth();
  const { navigate } = useSite();
  const [fullName, setFullName] = useState(profile?.fullName || user?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 space-y-6">
        <ConfigBanner title="Sign In Required" scope="firebase" />
        <div className="rounded-sm border border-white/10 bg-[#111114] p-8 text-center">
          <h1 className="font-display text-2xl text-[#F5F4F0]">Account Profile</h1>
          <p className="mt-2 text-sm text-[#A1A1AA]">Sign in to view and manage your student profile.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-5 rounded-sm bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#09090B]"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateUserProfile({ fullName, phone, bio });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="rounded-sm border border-white/10 bg-[#111114] p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Account Settings
            </p>
            <h1 className="font-display text-3xl font-semibold text-[#F5F4F0]">Student Profile</h1>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="inline-flex items-center gap-2 rounded-sm border border-white/15 px-3.5 py-2 text-xs font-medium text-[#A1A1AA] hover:border-red-400/50 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#A1A1AA]">
          <span className="inline-flex items-center gap-1.5 text-[#E4E4E7]">
            <UserCheck className="h-4 w-4 text-[#D4AF37]" />
            {user.email}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
            Role: {isAdmin ? 'Administrator' : 'Student'}
          </span>
          <span aria-hidden="true">·</span>
          <span>Email {user.emailVerified ? 'Verified' : 'Unverified'}</span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="prof-name" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prof-phone" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Phone / WhatsApp Number (optional)
            </label>
            <input
              id="prof-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234..."
              className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prof-bio" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Creative Focus / Bio
            </label>
            <textarea
              id="prof-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-sm border border-red-500/30 bg-red-950/30 px-3.5 py-2 text-xs text-red-300">
              {error}
            </p>
          )}
          {saved && (
            <p className="rounded-sm border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3.5 py-2 text-xs text-[#D4AF37]">
              Profile saved successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-sm bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#09090B] hover:bg-[#E5C158] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
