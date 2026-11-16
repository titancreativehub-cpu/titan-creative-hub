import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Lock, Play, PlayCircle } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { formatNGN } from '../lib/format';
import { CheckoutModal } from '../components/CheckoutModal';

export function CourseDetailPage({ courseId }: { courseId: string }) {
  const { courses, loadingCatalog, navigate } = useSite();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const course = courses.find((c) => c.id === courseId || c.slug === courseId);

  if (loadingCatalog) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="h-96 animate-pulse rounded-sm border border-white/10 bg-[#111114]" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl text-[#F5F4F0]">Course Not Found</h1>
        <p className="mt-2 text-sm text-[#A1A1AA]">This course may have been unpublished or moved.</p>
        <button
          type="button"
          onClick={() => navigate('/courses')}
          className="mt-6 rounded-sm bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#09090B]"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <button
        type="button"
        onClick={() => navigate('/courses')}
        className="mb-8 inline-flex items-center gap-2 text-xs font-medium text-[#A1A1AA] hover:text-[#D4AF37]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>All Courses</span>
      </button>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left Details & Curriculum */}
        <div className="space-y-10 lg:col-span-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
              <span className="font-semibold text-[#D4AF37]">{course.category}</span>
              <span aria-hidden="true">·</span>
              <span>{course.level}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{course.duration}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{course.lessonsCount} lessons</span>
            </div>

            <h1 className="font-display text-3xl font-semibold leading-tight text-[#F5F4F0] sm:text-5xl">
              {course.title}
            </h1>

            <p className="text-base leading-relaxed text-[#A1A1AA] sm:text-lg">
              {course.description}
            </p>

            <p className="text-sm text-[#E4E4E7]">
              Instructor: <span className="font-semibold text-[#F5F4F0]">{course.instructorName}</span>
              {course.instructorTitle ? ` — ${course.instructorTitle}` : ''}
              {course.formatLabel ? ` · ${course.formatLabel}` : ''}
            </p>
          </div>

          {course.enrollmentInfo && (
            <div className="rounded-sm border border-[#D4AF37]/35 bg-[#121216] p-5 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                Program Schedule & Enrolment Information
              </p>
              <p className="text-sm leading-relaxed text-[#E4E4E7]">{course.enrollmentInfo}</p>
            </div>
          )}

          {previewVideoUrl && (
            <div className="space-y-2 rounded-sm border border-[#D4AF37]/40 bg-[#111114] p-4">
              <div className="flex items-center justify-between text-xs text-[#D4AF37]">
                <span>Free Lesson Preview</span>
                <button
                  type="button"
                  onClick={() => setPreviewVideoUrl(null)}
                  className="text-[#A1A1AA] hover:text-[#F5F4F0]"
                >
                  Close Preview
                </button>
              </div>
              <video
                src={previewVideoUrl}
                controls
                controlsList="nodownload"
                className="aspect-video w-full rounded-sm bg-black"
              />
            </div>
          )}

          {course.outcomes && course.outcomes.length > 0 && (
            <div className="rounded-sm border border-white/10 bg-[#111114] p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">
                What You Will Master
              </h2>
              <ul className="mt-4 space-y-3">
                {course.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-3 text-sm text-[#E4E4E7]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Curriculum */}
          <div className="space-y-5">
            <h2 className="font-display text-2xl font-semibold text-[#F5F4F0] sm:text-3xl">
              Course Curriculum
            </h2>
            <div className="space-y-4">
              {course.modules.map((mod) => (
                <div
                  key={mod.id}
                  className="overflow-hidden rounded-sm border border-white/10 bg-[#111114]"
                >
                  <div className="border-b border-white/10 bg-[#151519] px-6 py-4">
                    <h3 className="font-semibold text-[#F5F4F0]">{mod.title}</h3>
                    {mod.description && (
                      <p className="mt-1 text-xs text-[#A1A1AA]">{mod.description}</p>
                    )}
                  </div>
                  <ul className="divide-y divide-white/10">
                    {mod.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-4 px-6 py-4 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          {lesson.isPreview && lesson.videoUrl ? (
                            <PlayCircle className="h-4 w-4 shrink-0 text-[#D4AF37]" />
                          ) : (
                            <Lock className="h-4 w-4 shrink-0 text-[#71717A]" />
                          )}
                          <div>
                            <p className="font-medium text-[#F5F4F0]">{lesson.title}</p>
                            <p className="text-xs text-[#A1A1AA]">{lesson.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {lesson.isPreview && lesson.videoUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewVideoUrl(lesson.videoUrl)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:underline"
                            >
                              <Play className="h-3 w-3" />
                              <span>Preview</span>
                            </button>
                          )}
                          <span className="font-mono-tabular text-xs text-[#71717A]">
                            {lesson.duration}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Purchase Module */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 overflow-hidden rounded-sm border border-[#D4AF37]/30 bg-[#111114]">
            <div className="aspect-[4/3] w-full overflow-hidden bg-[#18181D]">
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-widest text-[#A1A1AA]">Tuition</span>
                <span className="font-mono-tabular text-2xl font-semibold text-[#D4AF37]">
                  {formatNGN(course.priceNGN)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCheckoutOpen(true)}
                className="w-full rounded-sm bg-[#D4AF37] px-5 py-3.5 text-sm font-semibold text-[#09090B] transition-colors hover:bg-[#E5C158]"
              >
                Enroll Now — {formatNGN(course.priceNGN)}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/learn/${course.id}`)}
                className="w-full rounded-sm border border-white/15 px-5 py-3 text-xs font-medium text-[#F5F4F0] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                Already Enrolled? Open Course Player
              </button>

              <dl className="space-y-2.5 border-t border-white/10 pt-4 text-xs">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#A1A1AA]">Format</dt>
                  <dd className="text-right text-[#F5F4F0]">{course.formatLabel || 'Online Course'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#A1A1AA]">Skill Level</dt>
                  <dd className="text-[#F5F4F0]">{course.level}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#A1A1AA]">Duration</dt>
                  <dd className="font-mono-tabular text-[#F5F4F0]">{course.duration}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#A1A1AA]">Lessons</dt>
                  <dd className="font-mono-tabular text-[#F5F4F0]">{course.lessonsCount}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#A1A1AA]">Access</dt>
                  <dd className="text-right text-[#F5F4F0]">
                    {course.isPdfCourse ? 'Downloadable PDF & Resources' : 'Video Lessons & Resources'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </aside>
      </div>

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        productType="course"
        productId={course.id}
        productTitle={course.title}
        priceNGN={course.priceNGN}
      />
    </div>
  );
}
