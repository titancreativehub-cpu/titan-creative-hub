import React, { useState } from 'react';
import { BookText, Clock } from 'lucide-react';
import type { Ebook } from '../types';
import { formatNGN } from '../lib/format';

export function EbookCard({
  ebook,
  onSelect,
}: {
  ebook: Ebook;
  onSelect: (ebook: Ebook) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const isComingSoon = ebook.availabilityStatus === 'coming_soon';

  return (
    <article
      onClick={() => onSelect(ebook)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(ebook);
        }
      }}
      tabIndex={0}
      role="button"
      className="group flex cursor-pointer flex-col overflow-hidden rounded-sm border border-white/10 bg-[#111114] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4AF37]/50 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#18181D]">
        {!imgError && ebook.coverUrl ? (
          <img
            src={ebook.coverUrl}
            alt={ebook.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#18181D] to-[#09090B] p-6 text-center">
            <BookText className="mb-2 h-8 w-8 text-[#D4AF37]/70" />
            <span className="font-display text-sm text-[#A1A1AA]">{ebook.title}</span>
          </div>
        )}

        {isComingSoon && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-5 pb-4 pt-10">
            <div className="inline-flex items-center gap-2 border border-[#D4AF37] bg-[#09090B]/95 px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-[#D4AF37]">
              <Clock className="h-3.5 w-3.5" />
              <span>COMING SOON</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
            <span className="font-medium text-[#D4AF37]">{ebook.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{ebook.pages} pages</span>
          </div>
          <h3 className="font-display text-xl font-semibold leading-snug text-[#F5F4F0] group-hover:text-[#D4AF37] transition-colors">
            {ebook.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-[#A1A1AA]">
            {ebook.subtitle || ebook.description}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs text-[#A1A1AA]">{ebook.author}</span>
          {isComingSoon ? (
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              Coming Soon
            </span>
          ) : (
            <span className="font-mono-tabular text-base font-semibold text-[#D4AF37]">
              {formatNGN(ebook.priceNGN)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
