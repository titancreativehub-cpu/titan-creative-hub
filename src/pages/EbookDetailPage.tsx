import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Clock, MessageCircle, ShieldCheck } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { formatNGN, getSupportWhatsAppUrl } from '../lib/format';
import { CheckoutModal } from '../components/CheckoutModal';

export function EbookDetailPage({ ebookId }: { ebookId: string }) {
  const { ebooks, loadingCatalog, navigate } = useSite();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const ebook = ebooks.find((e) => e.id === ebookId || e.slug === ebookId);

  if (loadingCatalog) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="h-96 animate-pulse rounded-sm border border-white/10 bg-[#111114]" />
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl text-[#F5F4F0]">eBook Not Found</h1>
        <button
          type="button"
          onClick={() => navigate('/ebooks')}
          className="mt-6 rounded-sm bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#09090B]"
        >
          Back to Ebook Store
        </button>
      </div>
    );
  }

  const isComingSoon = ebook.availabilityStatus === 'coming_soon';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <button
        type="button"
        onClick={() => navigate('/ebooks')}
        className="mb-8 inline-flex items-center gap-2 text-xs font-medium text-[#A1A1AA] hover:text-[#D4AF37]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Ebook Store</span>
      </button>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-sm border border-white/10 bg-[#111114]">
            <img
              src={ebook.coverUrl}
              alt={ebook.title}
              referrerPolicy="no-referrer"
              className="aspect-[3/4] w-full object-cover"
            />
            {isComingSoon && (
              <div className="border-t border-[#D4AF37]/40 bg-[#09090B] px-4 py-3 text-center">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>COMING SOON</span>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8 lg:col-span-7">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
              <span className="font-semibold text-[#D4AF37]">{ebook.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{ebook.pages} pages</span>
              <span aria-hidden="true">·</span>
              <span>{ebook.format}</span>
              {isComingSoon && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold uppercase tracking-widest text-[#D4AF37]">
                    COMING SOON
                  </span>
                </>
              )}
            </div>

            <h1 className="font-display text-3xl font-semibold text-[#F5F4F0] sm:text-5xl">
              {ebook.title}
            </h1>
            <p className="text-sm text-[#E4E4E7]">
              By <span className="font-semibold">{ebook.author}</span>
            </p>
            <p className="text-base leading-relaxed text-[#A1A1AA]">{ebook.description}</p>
          </div>

          {isComingSoon ? (
            <div className="space-y-4 rounded-sm border border-[#D4AF37]/40 bg-[#111114] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
                    Release Status: COMING SOON
                  </p>
                  <p className="text-sm text-[#E4E4E7]">
                    This edition is currently in final production and is not yet open for purchase.
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-sm border border-[#D4AF37]/40 bg-[#09090B] px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#D4AF37] opacity-80"
                >
                  Coming Soon
                </button>
              </div>
              <div className="border-t border-white/10 pt-4">
                <a
                  href={getSupportWhatsAppUrl(
                    `Hello TITAN CREATIVE HUB ™, please notify me when "${ebook.title}" becomes available for purchase.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#D4AF37] hover:underline"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Request Release Notification on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#A1A1AA]">Digital Edition Price</p>
                <p className="font-mono-tabular text-3xl font-semibold text-[#D4AF37]">
                  {formatNGN(ebook.priceNGN)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOpen(true)}
                className="rounded-sm bg-[#D4AF37] px-7 py-3.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#E5C158]"
              >
                Purchase eBook — {formatNGN(ebook.priceNGN)}
              </button>
            </div>
          )}

          {/* Preview Excerpt */}
          {ebook.previewExcerpt && (
            <div className="space-y-3 rounded-sm border border-white/10 bg-[#111114] p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                <BookOpen className="h-4 w-4" />
                <span>Chapter Preview Excerpt</span>
              </div>
              <p className="text-sm leading-relaxed text-[#E4E4E7] italic">
                “{ebook.previewExcerpt}”
              </p>
            </div>
          )}

          {/* Table of Contents */}
          {ebook.tableOfContents && ebook.tableOfContents.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">
                Inside This Digital Edition
              </h2>
              <ul className="divide-y divide-white/10 border-y border-white/10 text-sm text-[#A1A1AA]">
                {ebook.tableOfContents.map((chapter) => (
                  <li key={chapter} className="py-3 text-[#E4E4E7]">
                    {chapter}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-start gap-2.5 text-xs text-[#71717A]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]/70" />
            <p>
              PDF downloads are served exclusively to verified purchasers through protected download endpoints inside your Student Dashboard.
            </p>
          </div>
        </div>
      </div>

      {!isComingSoon && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          productType="ebook"
          productId={ebook.id}
          productTitle={ebook.title}
          priceNGN={ebook.priceNGN}
        />
      )}
    </div>
  );
}
