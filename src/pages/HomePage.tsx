import React, { useState } from 'react';
import { ArrowRight, ChevronDown, PlayCircle, ShieldCheck, BookOpen } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { CourseCard } from '../components/CourseCard';
import { EbookCard } from '../components/EbookCard';

const SAMPLE_TESTIMONIALS = [
  {
    id: 't1',
    name: 'Damilola Balogun',
    role: 'Content Creator',
    organization: 'Studio Kora, Lagos',
    course: 'AI Video Generation (Pro)',
    quote:
      'Before enrolling, my AI clips lacked continuity and camera control. Applying the keyframe and lip-sync workflows helped me deliver commercial spots for two local brands.',
  },
  {
    id: 't2',
    name: 'Ibrahim Musa',
    role: 'Channel Strategist',
    organization: 'NorthStar Digital, Abuja',
    course: 'YouTube Automation',
    quote:
      'The niche validation matrix and retention scripting modules gave our team a clear production cadence. Our watch time and click-through rates improved within weeks.',
  },
  {
    id: 't3',
    name: 'Kemi Adebayo',
    role: 'Product Builder',
    organization: 'Vesper Labs, Port Harcourt',
    course: 'App Development with AI',
    quote:
      'Using the structured architecture prompts and backend checklist from the course, I built and launched a working client portal far faster than expected.',
  },
];

const FAQS = [
  {
    q: 'How do I access a course or ebook after purchasing?',
    a: 'Once Paystack confirms your payment on our server, your course or ebook unlocks immediately inside your Student Dashboard. Video lessons stream privately and PDF monographs download through authenticated links.',
  },
  {
    q: 'What currency are prices listed in?',
    a: 'All courses and digital monographs are priced in Nigerian Naira (NGN) and processed securely through Paystack.',
  },
  {
    q: 'Can I reach support before or after placing an order?',
    a: 'Yes. Every pending order provides an instant "CONTACT US ON WHATSAPP" button pre-filled with your order reference, and you can also reach us anytime at +1239043130575 or titancreativehub@gmail.com.',
  },
  {
    q: 'Are video lessons self-paced?',
    a: 'Yes. Every module includes lifetime on-demand playback, progress tracking, and downloadable study resources where permitted.',
  },
];

export function HomePage() {
  const { courses, ebooks, siteSettings, announcements, loadingCatalog, navigate } = useSite();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroError, setHeroError] = useState(false);

  const displayCourses = courses.slice(0, 6);
  const featuredEbooks = ebooks.filter((e) => e.featured).slice(0, 2);
  const displayEbooks = featuredEbooks.length > 0 ? featuredEbooks : ebooks.slice(0, 2);

  return (
    <div>
      {/* Slim Announcement Strip */}
      {announcements.length > 0 && (
        <div className="border-b border-[#D4AF37]/25 bg-[#111114] px-4 py-2.5 text-center text-xs text-[#E4E4E7]">
          <span className="font-semibold text-[#D4AF37]">{announcements[0].title}:</span>{' '}
          <span>{announcements[0].message}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="border-b border-white/10 bg-[#09090B]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center space-y-7 lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              {siteSettings.siteName} · {siteSettings.tagline}
            </p>
            <h1
              className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-[#F5F4F0] sm:text-5xl lg:text-[3.5rem]"
              style={{ textWrap: 'balance' }}
            >
              {siteSettings.heroHeadline}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
              {siteSettings.heroSubheadline}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="inline-flex items-center gap-2 rounded-sm bg-[#D4AF37] px-6 py-3.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#E5C158] whitespace-nowrap"
              >
                <span>Explore Courses</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/ebooks')}
                className="inline-flex items-center gap-2 rounded-sm border border-white/20 px-6 py-3.5 text-sm font-medium text-[#F5F4F0] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] whitespace-nowrap"
              >
                <span>Browse Ebook Store</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[320px] overflow-hidden rounded-sm border border-white/10 bg-[#121216]">
              {!heroError ? (
                <img
                  src="/src/assets/images/hero_titan_studio_1794566100046.jpg"
                  alt="TITAN CREATIVE HUB executive digital learning studio"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#18181D] to-[#09090B] p-12 text-center">
                  <span className="font-display text-2xl text-[#D4AF37]">TITAN CREATIVE HUB ™</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-xs text-[#E4E4E7]">
                <span>Studio-Grade Video Masterclasses & Digital Monographs</span>
                <span className="font-mono-tabular text-[#D4AF37]">NGN · Self-Paced</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
              Academy Curriculum
            </p>
            <h2 className="font-display text-3xl font-semibold text-[#F5F4F0] sm:text-4xl">
              Official Course Catalogue
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D4AF37] hover:underline whitespace-nowrap"
          >
            <span>View all courses</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {loadingCatalog ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-sm border border-white/10 bg-[#111114]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {displayCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onSelect={(c) => navigate(`/courses/${c.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured Ebooks */}
      <section className="border-y border-white/10 bg-[#0C0C0F]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
                Digital Publishing
              </p>
              <h2 className="font-display text-3xl font-semibold text-[#F5F4F0] sm:text-4xl">
                Official eBook Store
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/ebooks')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D4AF37] hover:underline whitespace-nowrap"
            >
              <span>Visit Ebook Store</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:max-w-4xl">
            {displayEbooks.map((ebook) => (
              <EbookCard
                key={ebook.id}
                ebook={ebook}
                onSelect={(eb) => navigate(`/ebooks/${eb.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits of Learning */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-12 max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            Why TITAN CREATIVE HUB ™
          </p>
          <h2 className="font-display text-3xl font-semibold text-[#F5F4F0] sm:text-4xl">
            Built for measurable creative and technical mastery
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 border-t border-white/10 pt-10 md:grid-cols-3">
          <div className="space-y-3">
            <PlayCircle className="h-6 w-6 text-[#D4AF37]" />
            <h3 className="font-display text-2xl font-semibold text-[#F5F4F0]">
              01. Structured Video Learning
            </h3>
            <p className="text-sm leading-relaxed text-[#A1A1AA]">
              Every course is organized into focused modules with step-by-step progress tracking, lesson workbooks, and protected on-demand playback.
            </p>
          </div>
          <div className="space-y-3">
            <BookOpen className="h-6 w-6 text-[#D4AF37]" />
            <h3 className="font-display text-2xl font-semibold text-[#F5F4F0]">
              02. Actionable PDF Monographs
            </h3>
            <p className="text-sm leading-relaxed text-[#A1A1AA]">
              Instant authorized PDF delivery after purchase verification—complete with chapter previews, grids, and repeatable studio checklists.
            </p>
          </div>
          <div className="space-y-3">
            <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
            <h3 className="font-display text-2xl font-semibold text-[#F5F4F0]">
              03. Verified NGN Checkout & Support
            </h3>
            <p className="text-sm leading-relaxed text-[#A1A1AA]">
              Transparent Nigerian Naira pricing verified server-side via Paystack, paired with direct WhatsApp and Gmail order support.
            </p>
          </div>
        </div>
      </section>

      {/* Student Testimonials (Clearly Labelled Sample Content) */}
      <section className="border-y border-white/10 bg-[#0C0C0F]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
                Sample Student Stories
              </p>
              <h2 className="font-display text-3xl font-semibold text-[#F5F4F0] sm:text-4xl">
                Outcomes from Our Curriculum
              </h2>
            </div>
            <p className="text-xs text-[#71717A]">
              Sample testimonials illustrating typical learner outcomes
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {SAMPLE_TESTIMONIALS.map((item) => (
              <blockquote
                key={item.id}
                className="flex flex-col justify-between rounded-sm border border-white/10 bg-[#111114] p-6"
              >
                <p className="text-sm leading-relaxed text-[#E4E4E7]">“{item.quote}”</p>
                <footer className="mt-6 border-t border-white/10 pt-4">
                  <p className="text-sm font-semibold text-[#F5F4F0]">{item.name}</p>
                  <p className="text-xs text-[#A1A1AA]">
                    {item.role} · {item.organization}
                  </p>
                  <p className="mt-1 text-xs text-[#D4AF37]">{item.course}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            Questions & Answers
          </p>
          <h2 className="font-display text-3xl font-semibold text-[#F5F4F0] sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y divide-white/10 border-y border-white/10">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={faq.q} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 text-left text-base font-medium text-[#F5F4F0] hover:text-[#D4AF37] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#D4AF37] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm leading-relaxed text-[#A1A1AA]">{faq.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
