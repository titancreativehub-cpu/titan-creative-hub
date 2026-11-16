import React from 'react';
import { Award, BookOpen, ShieldCheck } from 'lucide-react';
import { useSite } from '../context/SiteContext';

export function AboutPage() {
  const { siteSettings, navigate } = useSite();

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20 space-y-14">
      <div className="space-y-4 border-b border-white/10 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
          About Our Academy
        </p>
        <h1 className="font-display text-4xl font-semibold text-[#F5F4F0] sm:text-5xl">
          {siteSettings.siteName}
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
          Founded to bridge the gap between foundational theory and studio-grade execution, TITAN CREATIVE HUB ™ is a curated digital learning academy and publishing house serving ambitious creators, engineers, and founders.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-3 rounded-sm border border-white/10 bg-[#111114] p-6">
          <Award className="h-6 w-6 text-[#D4AF37]" />
          <h2 className="font-display text-xl font-semibold text-[#F5F4F0]">Practitioner Faculty</h2>
          <p className="text-sm leading-relaxed text-[#A1A1AA]">
            Every curriculum is authored by active directors and principal engineers sharing real production templates and systems.
          </p>
        </div>

        <div className="space-y-3 rounded-sm border border-white/10 bg-[#111114] p-6">
          <BookOpen className="h-6 w-6 text-[#D4AF37]" />
          <h2 className="font-display text-xl font-semibold text-[#F5F4F0]">Dual-Format Depth</h2>
          <p className="text-sm leading-relaxed text-[#A1A1AA]">
            Pair structured video walkthroughs with long-form PDF monographs engineered for offline study and team reference.
          </p>
        </div>

        <div className="space-y-3 rounded-sm border border-white/10 bg-[#111114] p-6">
          <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
          <h2 className="font-display text-xl font-semibold text-[#F5F4F0]">Verified Fulfillment</h2>
          <p className="text-sm leading-relaxed text-[#A1A1AA]">
            Backed by Paystack server verification, private storage delivery, and direct WhatsApp and email student concierge support.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6 rounded-sm border border-[#D4AF37]/30 bg-[#111114] p-8">
        <div className="space-y-1.5">
          <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">
            Ready to start your next discipline?
          </h2>
          <p className="text-sm text-[#A1A1AA]">
            Explore our current video masterclasses and digital monograph catalog.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="rounded-sm bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#09090B] hover:bg-[#E5C158]"
          >
            Browse Courses
          </button>
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="rounded-sm border border-white/15 px-5 py-2.5 text-sm font-medium text-[#F5F4F0] hover:border-[#D4AF37]"
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}
