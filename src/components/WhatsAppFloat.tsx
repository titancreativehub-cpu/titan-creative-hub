import React from 'react';
import { MessageCircle } from 'lucide-react';
import { getSupportWhatsAppUrl } from '../lib/format';

export function WhatsAppFloat() {
  return (
    <a
      href={getSupportWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with TITAN CREATIVE HUB on WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 rounded-sm border border-[#D4AF37]/50 bg-[#121216]/95 px-4 py-3 text-xs font-semibold tracking-wide text-[#F5F4F0] shadow-lg backdrop-blur-md transition-transform duration-150 hover:-translate-y-0.5 hover:border-[#D4AF37] hover:text-[#D4AF37] focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
    >
      <MessageCircle className="h-4 w-4 text-[#D4AF37]" />
      <span className="whitespace-nowrap">WhatsApp Support</span>
    </a>
  );
}
