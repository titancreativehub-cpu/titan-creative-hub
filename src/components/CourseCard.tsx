import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import type { Course } from '../types';
import { formatNGN } from '../lib/format';

export function CourseCard({
  course,
  onSelect,
}: {
  course: Course;
  onSelect: (course: Course) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <article
      onClick={() => onSelect(course)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(course);
        }
      }}
      tabIndex={0}
      role="button"
      className="group flex cursor-pointer flex-col overflow-hidden rounded-sm border border-white/10 bg-[#111114] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D4AF37]/50 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#18181D]">
        {!imgError && course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#18181D] to-[#09090B] p-6 text-center">
            <BookOpen className="mb-2 h-8 w-8 text-[#D4AF37]/70" />
            <span className="font-display text-sm text-[#A1A1AA]">{course.category}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
            <span className="font-medium text-[#D4AF37]">{course.category}</span>
            <span aria-hidden="true">·</span>
            <span>{course.level}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{course.duration}</span>
          </div>

          <h3 className="font-display text-xl font-semibold leading-snug text-[#F5F4F0] group-hover:text-[#D4AF37] transition-colors">
            {course.title}
          </h3>

          <p className="line-clamp-2 text-sm leading-relaxed text-[#A1A1AA]">
            {course.subtitle || course.description}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="text-xs text-[#A1A1AA] truncate pr-3">
            <span>{course.formatLabel || course.instructorName}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span className="font-mono-tabular">{course.lessonsCount} lessons</span>
          </div>
          <span className="font-mono-tabular text-base font-semibold text-[#D4AF37] shrink-0">
            {formatNGN(course.priceNGN)}
          </span>
        </div>
      </div>
    </article>
  );
}
