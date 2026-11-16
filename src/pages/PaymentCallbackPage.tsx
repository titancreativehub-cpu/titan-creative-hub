import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageCircle, XCircle } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { formatNGN, getSupportWhatsAppUrl } from '../lib/format';
import type { Order } from '../types';

export function PaymentCallbackPage() {
  const { navigate } = useSite();
  const [status, setStatus] = useState<'verifying' | 'paid' | 'failed'>('verifying');
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState('Verifying your Paystack transaction with our server...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference was returned in the callback URL.');
      return;
    }

    async function verify() {
      try {
        const resp = await fetch('/api/payments/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });
        const data = await resp.json();
        if (resp.ok && data.verified) {
          setStatus('paid');
          setOrder(data.order);
          setMessage('Payment verified! Your digital access has been unlocked.');
        } else {
          setStatus('failed');
          if (data.order) setOrder(data.order);
          setMessage(data.error || 'Payment could not be verified.');
        }
      } catch {
        setStatus('failed');
        setMessage('Network error during server-side verification.');
      }
    }
    verify();
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <div className="rounded-sm border border-white/10 bg-[#111114] p-8 text-center space-y-6">
        {status === 'verifying' && (
          <div className="space-y-3">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
            <h1 className="font-display text-2xl text-[#F5F4F0]">Verifying Payment</h1>
            <p className="text-sm text-[#A1A1AA]">{message}</p>
          </div>
        )}

        {status === 'paid' && (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#D4AF37]" />
            <h1 className="font-display text-3xl font-semibold text-[#F5F4F0]">
              Payment Confirmed
            </h1>
            <p className="text-sm text-[#A1A1AA]">{message}</p>
            {order && (
              <div className="rounded-sm border border-white/10 bg-[#09090B] p-4 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA]">Product</span>
                  <span className="text-[#F5F4F0]">{order.productTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA]">Reference</span>
                  <span className="font-mono-tabular text-[#F5F4F0]">{order.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A1A1AA]">Amount Paid</span>
                  <span className="font-mono-tabular text-[#D4AF37]">
                    {formatNGN(order.amountNGN)}
                  </span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-sm bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#09090B] hover:bg-[#E5C158]"
            >
              Go to Student Dashboard
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-4">
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h1 className="font-display text-3xl font-semibold text-[#F5F4F0]">
              Verification Incomplete
            </h1>
            <p className="text-sm text-[#A1A1AA]">{message}</p>
            <div className="space-y-3 pt-2">
              <a
                href={order?.whatsappPreparedUrl || getSupportWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#09090B]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>CONTACT US ON WHATSAPP</span>
              </a>
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="w-full rounded-sm border border-white/15 px-5 py-3 text-sm font-medium text-[#F5F4F0]"
              >
                Return to Marketplace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
