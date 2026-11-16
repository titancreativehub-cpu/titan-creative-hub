import React, { useState } from 'react';
import { CreditCard, MessageCircle, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { formatNGN } from '../lib/format';
import type { Order, ProductType } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  productType: ProductType;
  productId: string;
  productTitle: string;
  priceNGN: number;
}

export function CheckoutModal({
  isOpen,
  onClose,
  productType,
  productId,
  productTitle,
  priceNGN,
}: CheckoutModalProps) {
  const { user, profile, idToken, configStatus } = useAuth();
  const { navigate } = useSite();

  const [customerName, setCustomerName] = useState(profile?.fullName || user?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(profile?.email || user?.email || '');
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paystackNotice, setPaystackNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreatePendingOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPaystackNotice(null);

    if (customerName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }

      const resp = await fetch('/api/orders/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          productType,
          productId,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Could not initiate order.');
      }
      setPendingOrder(data.order as Order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithPaystack = async () => {
    if (!pendingOrder) return;
    setError(null);
    setPaystackNotice(null);
    setPaystackLoading(true);

    try {
      const resp = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: pendingOrder.reference }),
      });
      const data = await resp.json();

      if (resp.status === 503 && data.configured === false) {
        setPaystackNotice(data.error);
        return;
      }
      if (!resp.ok) {
        throw new Error(data.error || 'Paystack initialization failed.');
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach Paystack checkout.');
    } finally {
      setPaystackLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-sm border border-[#D4AF37]/30 bg-[#111114] p-6 sm:p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close checkout"
          className="absolute right-4 top-4 p-2 text-[#A1A1AA] hover:text-[#F5F4F0]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-1.5 pr-8">
          <p className="text-xs font-medium uppercase tracking-widest text-[#D4AF37]">
            {productType === 'course' ? 'Course Enrollment' : 'Digital Ebook Purchase'}
          </p>
          <h2 id="checkout-modal-title" className="font-display text-2xl font-semibold text-[#F5F4F0]">
            {productTitle}
          </h2>
          <p className="font-mono-tabular text-lg font-semibold text-[#D4AF37]">
            {formatNGN(priceNGN)}
          </p>
        </div>

        {configStatus?.firebaseAdminConfigured && !user && (
          <div className="mt-5 rounded-sm border border-white/10 bg-[#18181D] p-4 text-sm text-[#A1A1AA]">
            <p>Sign in to your student account so verified purchases unlock immediately in your dashboard.</p>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/login');
              }}
              className="mt-3 text-xs font-semibold text-[#D4AF37] hover:underline"
            >
              Sign in or Create Account →
            </button>
          </div>
        )}

        {!pendingOrder ? (
          <form onSubmit={handleCreatePendingOrder} className="mt-6 space-y-4">
            <div>
              <label htmlFor="checkout-name" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Full Name
              </label>
              <input
                id="checkout-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Adaobi Okafor"
                className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0] placeholder:text-[#52525B] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="checkout-email" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Email Address
              </label>
              <input
                id="checkout-email"
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="you@example.com"
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
              disabled={loading}
              className="w-full rounded-sm bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#E5C158] disabled:opacity-50"
            >
              {loading ? 'Creating Pending Order...' : `Initiate Order — ${formatNGN(priceNGN)}`}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="rounded-sm border border-white/10 bg-[#09090B] p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Order Reference</span>
                <span className="font-mono-tabular font-semibold text-[#F5F4F0]">{pendingOrder.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Payment Status</span>
                <span className="font-mono-tabular font-semibold text-[#D4AF37]">{pendingOrder.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Amount Due</span>
                <span className="font-mono-tabular font-semibold text-[#F5F4F0]">{formatNGN(pendingOrder.amountNGN)}</span>
              </div>
            </div>

            {error && (
              <p className="rounded-sm border border-red-500/30 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-300">
                {error}
              </p>
            )}

            {paystackNotice && (
              <div className="rounded-sm border border-[#D4AF37]/30 bg-[#18181D] p-3.5 text-xs leading-relaxed text-[#E4E4E7]">
                {paystackNotice}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handlePayWithPaystack}
                disabled={paystackLoading}
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#E5C158] disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                <span>
                  {paystackLoading
                    ? 'Connecting to Paystack...'
                    : `Pay Securely with Paystack (${configStatus?.paystackMode === 'live' ? 'Live' : 'Test Mode'})`}
                </span>
              </button>

              <a
                href={pendingOrder.whatsappPreparedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-sm border border-[#D4AF37] bg-[#121216] px-5 py-3 text-sm font-semibold text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/10"
              >
                <MessageCircle className="h-4 w-4" />
                <span>CONTACT US ON WHATSAPP</span>
              </a>
            </div>

            <div className="flex items-start gap-2 text-xs text-[#71717A]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]/70" />
              <p>
                Access is granted exclusively after server-side Paystack verification. WhatsApp messages assist with support and concierge follow-up and do not substitute for payment verification.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
