import React from 'react';
import { useSite } from '../context/SiteContext';
import { TitanLogo } from './TitanLogo';
import { OFFICIAL_EMAIL, OFFICIAL_WHATSAPP_DISPLAY, getSupportWhatsAppUrl } from '../lib/format';

export function Footer() {
  const { siteSettings, navigate } = useSite();

  return (
    <footer className="border-t border-white/10 bg-[#070709] text-[#A1A1AA]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <TitanLogo className="w-11 h-11 shrink-0" />
              <span className="font-display text-xl font-semibold text-[#F5F4F0]">
                {siteSettings.siteName}
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[#A1A1AA]">
              {siteSettings.tagline}. Delivering studio-grade creative, engineering, and business mastery with verified digital fulfillment.
            </p>
            <div className="pt-2 space-y-1.5 text-sm">
              <p>
                WhatsApp Concierge:{' '}
                <a
                  href={getSupportWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D4AF37] hover:underline font-mono-tabular"
                >
                  {siteSettings.whatsappNumber || OFFICIAL_WHATSAPP_DISPLAY}
                </a>
              </p>
              <p>
                Official Email:{' '}
                <a
                  href={`mailto:${siteSettings.businessEmail || OFFICIAL_EMAIL}`}
                  className="text-[#F5F4F0] hover:text-[#D4AF37] transition-colors"
                >
                  {siteSettings.businessEmail || OFFICIAL_EMAIL}
                </a>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#F5F4F0]">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button type="button" onClick={() => navigate('/courses')} className="hover:text-[#D4AF37] transition-colors">
                  Video Courses
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/ebooks')} className="hover:text-[#D4AF37] transition-colors">
                  Digital Ebook Store
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/about')} className="hover:text-[#D4AF37] transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/contact')} className="hover:text-[#D4AF37] transition-colors">
                  Contact Support
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/dashboard')} className="hover:text-[#D4AF37] transition-colors">
                  Student Dashboard
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#F5F4F0]">
              Policies & Access
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button type="button" onClick={() => navigate('/policies/privacy')} className="hover:text-[#D4AF37] transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/policies/terms')} className="hover:text-[#D4AF37] transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/policies/refund')} className="hover:text-[#D4AF37] transition-colors">
                  Digital Refund Policy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/admin')} className="hover:text-[#D4AF37] transition-colors">
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#71717A] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {siteSettings.siteName}. All rights reserved.</p>
          <p>{siteSettings.address}</p>
        </div>
      </div>
    </footer>
  );
}
