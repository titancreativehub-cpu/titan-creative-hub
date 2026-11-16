import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { CourseCard } from '../components/CourseCard';

export function CoursesPage() {
  const { courses, loadingCatalog, navigate } = useSite();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => c.category));
    return ['All', ...Array.from(set)];
  }, [courses]);

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      const matchesCat = selectedCategory === 'All' || course.category === selectedCategory;
      const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel;
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.instructorName.toLowerCase().includes(q);
      return matchesCat && matchesLevel && matchesQuery;
    });
  }, [courses, search, selectedCategory, selectedLevel]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-10 space-y-3 border-b border-white/10 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
          Course Marketplace
        </p>
        <h1 className="font-display text-4xl font-semibold text-[#F5F4F0] sm:text-5xl">
          Official Course Catalogue
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#A1A1AA] sm:text-base">
          Browse our six official courses priced in Nigerian Naira (₦), spanning downloadable PDF/eBook training, on-demand video lessons, AI app development, and our two-week Online Video Creation Class.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses, instructors, or skills..."
            aria-label="Search courses"
            className="w-full rounded-sm border border-white/15 bg-[#111114] py-2.5 pl-10 pr-4 text-sm text-[#F5F4F0] placeholder:text-[#71717A] focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            aria-label="Filter by skill level"
            className="rounded-sm border border-white/15 bg-[#111114] px-3 py-2 text-xs font-medium text-[#F5F4F0] focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {loadingCatalog ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 animate-pulse rounded-sm border border-white/10 bg-[#111114]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-sm border border-white/10 bg-[#111114] p-12 text-center">
          <p className="font-display text-2xl text-[#F5F4F0]">No matching courses found</p>
          <p className="mt-2 text-sm text-[#A1A1AA]">
            Try clearing your search terms or switching the selected category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setSelectedLevel('All');
            }}
            className="mt-5 rounded-sm border border-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onSelect={(c) => navigate(`/courses/${c.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
