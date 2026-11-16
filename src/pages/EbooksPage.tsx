import React, { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { EbookCard } from '../components/EbookCard';

export function EbooksPage() {
  const { ebooks, loadingCatalog, navigate } = useSite();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'coming_soon'>('all');

  const categories = useMemo(() => {
    const set = new Set(ebooks.map((e) => e.category));
    return ['All', ...Array.from(set)];
  }, [ebooks]);

  const filtered = useMemo(() => {
    return ebooks.filter((eb) => {
      const matchesCat = selectedCategory === 'All' || eb.category === selectedCategory;
      const status = eb.availabilityStatus || 'available';
      const matchesStatus =
        availabilityFilter === 'all' || status === availabilityFilter;
      const q = search.trim().toLowerCase();
      const matchesQ =
        !q ||
        eb.title.toLowerCase().includes(q) ||
        eb.author.toLowerCase().includes(q) ||
        eb.description.toLowerCase().includes(q);
      return matchesCat && matchesStatus && matchesQuery(matchesQ);
    });
  }, [ebooks, search, selectedCategory, availabilityFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-10 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            Digital Publishing House
          </p>
          <h1 className="font-display text-4xl font-semibold text-[#F5F4F0] sm:text-5xl">
            Official eBook Store
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#A1A1AA] sm:text-base">
            Curated digital books and tactical PDF guides priced in Nigerian Naira (₦). Available editions unlock immediately for protected PDF download inside your Student Dashboard after verified payment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/courses')}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#D4AF37] hover:underline whitespace-nowrap"
        >
          <span>View 6-Course Catalogue</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search eBooks or topics..."
            aria-label="Search ebooks"
            className="w-full rounded-sm border border-white/15 bg-[#111114] py-2.5 pl-10 pr-4 text-sm text-[#F5F4F0] placeholder:text-[#71717A] focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1 rounded-sm border border-white/10 bg-[#111114] p-1">
            {[
              { id: 'all', label: 'All Editions' },
              { id: 'available', label: 'Available Now' },
              { id: 'coming_soon', label: 'Coming Soon' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setAvailabilityFilter(item.id as 'all' | 'available' | 'coming_soon')
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
                  availabilityFilter === item.id
                    ? 'bg-[#D4AF37] text-[#09090B]'
                    : 'text-[#A1A1AA] hover:text-[#F5F4F0]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-sm border border-white/10 bg-[#111114] p-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#D4AF37] text-[#09090B]'
                    : 'text-[#A1A1AA] hover:text-[#F5F4F0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loadingCatalog ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-[480px] animate-pulse rounded-sm border border-white/10 bg-[#111114]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-sm border border-white/10 bg-[#111114] p-12 text-center">
          <p className="font-display text-2xl text-[#F5F4F0]">No matching eBooks found</p>
          <p className="mt-2 text-sm text-[#A1A1AA]">
            Adjust your search terms or switch your availability filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-5xl">
          {filtered.map((eb) => (
            <EbookCard key={eb.id} ebook={eb} onSelect={(item) => navigate(`/ebooks/${item.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function matchesQuery(val: boolean) {
  return val;
}
