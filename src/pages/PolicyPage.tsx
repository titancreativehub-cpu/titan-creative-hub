import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { OFFICIAL_EMAIL, OFFICIAL_WHATSAPP_DISPLAY } from '../lib/format';

export function PolicyPage({ type }: { type: 'privacy' | 'terms' | 'refund' }) {
  const { navigate } = useSite();

  const content = {
    privacy: {
      title: 'Privacy Policy',
      updated: 'November 2026',
      sections: [
        {
          heading: '1. Information We Collect',
          body: 'When you register on TITAN CREATIVE HUB ™ or initiate an order, we collect your name, email address, and verified order references. We never store plaintext passwords or payment card details on our servers.',
        },
        {
          heading: '2. Payment & Verification Security',
          body: 'All online payments are processed by Paystack. Order fulfillment and access grants occur strictly after server-side transaction verification.',
        },
        {
          heading: '3. Data Protection & Contact',
          body: `Your account profile and enrollment data are protected by strict access control. For data deletion or privacy requests, email ${OFFICIAL_EMAIL} or message ${OFFICIAL_WHATSAPP_DISPLAY}.`,
        },
      ],
    },
    terms: {
      title: 'Terms of Service',
      updated: 'November 2026',
      sections: [
        {
          heading: '1. Digital License & Usage',
          body: 'Purchased courses and PDF ebooks grant a single-user, non-transferable license for personal and professional study. Redistribution or public re-hosting of protected storage files is strictly prohibited.',
        },
        {
          heading: '2. Account Integrity',
          body: 'Students are responsible for maintaining the confidentiality of their Firebase Authentication credentials. Accounts found sharing paid credentials may be suspended.',
        },
        {
          heading: '3. Pricing in NGN',
          body: 'All catalog prices are denominated in Nigerian Naira (NGN). Access is unlocked only upon confirmed server-side payment verification.',
        },
      ],
    },
    refund: {
      title: 'Digital Refund Policy',
      updated: 'November 2026',
      sections: [
        {
          heading: '1. Eligibility Window',
          body: 'Refund requests on verified PAID orders may be submitted within 7 days of purchase directly from your Student Dashboard, provided less than 20% of course video content has been completed and PDF files have not been bulk-downloaded.',
        },
        {
          heading: '2. Processing Through Paystack',
          body: 'Approved refunds are executed exclusively through the Paystack Refund API back to the original payment method, upon which course or ebook access is revoked.',
        },
        {
          heading: '3. Assistance',
          body: `For billing questions, contact ${OFFICIAL_EMAIL} or WhatsApp ${OFFICIAL_WHATSAPP_DISPLAY} with your order reference.`,
        },
      ],
    },
  }[type];

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20 space-y-8">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-medium text-[#A1A1AA] hover:text-[#D4AF37]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </button>

      <div className="border-b border-white/10 pb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
          Platform Governance · Updated {content.updated}
        </p>
        <h1 className="font-display text-4xl font-semibold text-[#F5F4F0]">{content.title}</h1>
      </div>

      <div className="space-y-8">
        {content.sections.map((sec) => (
          <section key={sec.heading} className="space-y-2">
            <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">{sec.heading}</h2>
            <p className="text-sm leading-relaxed text-[#A1A1AA]">{sec.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
