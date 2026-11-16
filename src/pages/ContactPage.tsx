import React from 'react';
import { Mail, MapPin, MessageCircle } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import {
  OFFICIAL_EMAIL,
  OFFICIAL_WHATSAPP_DISPLAY,
  getSupportWhatsAppUrl,
} from '../lib/format';

export function ContactPage() {
  const { siteSettings } = useSite();
  const whatsappDisplay = siteSettings.whatsappNumber || OFFICIAL_WHATSAPP_DISPLAY;
  const emailDisplay = siteSettings.businessEmail || OFFICIAL_EMAIL;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20 space-y-12">
      <div className="space-y-3 border-b border-white/10 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
          Direct Concierge & Support
        </p>
        <h1 className="font-display text-4xl font-semibold text-[#F5F4F0] sm:text-5xl">
          Contact Us
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#A1A1AA] sm:text-base">
          Need guidance choosing a course, verifying an order reference, or arranging team licenses? Reach our official support channels directly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col justify-between rounded-sm border border-[#D4AF37]/30 bg-[#111114] p-7 space-y-6">
          <div className="space-y-3">
            <MessageCircle className="h-7 w-7 text-[#D4AF37]" />
            <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">
              Official WhatsApp Concierge
            </h2>
            <p className="text-sm leading-relaxed text-[#A1A1AA]">
              Instant messaging support for course inquiries, ebook orders, and student onboarding.
            </p>
            <p className="font-mono-tabular text-lg font-semibold text-[#D4AF37]">
              {whatsappDisplay}
            </p>
          </div>
          <a
            href={getSupportWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#E5C158]"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

        <div className="flex flex-col justify-between rounded-sm border border-white/10 bg-[#111114] p-7 space-y-6">
          <div className="space-y-3">
            <Mail className="h-7 w-7 text-[#D4AF37]" />
            <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">
              Official Business Email
            </h2>
            <p className="text-sm leading-relaxed text-[#A1A1AA]">
              Send formal inquiries, partnership proposals, or order reference follow-ups directly to our inbox.
            </p>
            <p className="text-lg font-medium text-[#F5F4F0]">{emailDisplay}</p>
          </div>
          <a
            href={`mailto:${emailDisplay}`}
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/10"
          >
            <Mail className="h-4 w-4" />
            <span>Send Email</span>
          </a>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-sm border border-white/10 bg-[#111114] px-6 py-4 text-sm text-[#A1A1AA]">
        <MapPin className="h-4 w-4 shrink-0 text-[#D4AF37]" />
        <span>{siteSettings.address}</span>
      </div>
    </div>
  );
}
