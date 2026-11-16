import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Download,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import type { Course, Enrollment, Lesson } from '../types';

export function VideoPlayerPage({ courseId }: { courseId: string }) {
  const { user, idToken, loading: authLoading } = useAuth();
  const { navigate } = useSite();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !idToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function loadCoursePlayer() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`/api/learn/${courseId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.error || 'Access denied. Verified enrollment required.');
        }
        if (!cancelled) {
          const loadedCourse = data.course as Course;
          setCourse(loadedCourse);
          setEnrollment(data.enrollment as Enrollment | null);
          const allLessons = loadedCourse.modules.flatMap((m) => m.lessons);
          const resumeId = data.enrollment?.lastAccessedLessonId;
          setActiveLessonId(
            allLessons.find((l) => l.id === resumeId)?.id || allLessons[0]?.id || null
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to open video player.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCoursePlayer();
    return () => {
      cancelled = true;
    };
  }, [courseId, user, idToken, authLoading]);

  const flatLessons: Lesson[] = useMemo(() => {
    if (!course) return [];
    return course.modules.flatMap((m) => m.lessons);
  }, [course]);

  const activeIndex = flatLessons.findIndex((l) => l.id === activeLessonId);
  const activeLesson = activeIndex >= 0 ? flatLessons[activeIndex] : flatLessons[0] || null;

  const completedSet = new Set(enrollment?.completedLessonIds || []);
  const progressPct =
    flatLessons.length > 0 ? Math.round((completedSet.size / flatLessons.length) * 100) : 0;

  const toggleLessonComplete = async (lessonId: string) => {
    if (!idToken || !course) return;
    const isCompleted = completedSet.has(lessonId);
    try {
      const resp = await fetch('/api/student/progress', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          lessonId,
          completed: !isCompleted,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setEnrollment((prev) =>
          prev
            ? {
                ...prev,
                completedLessonIds: data.completedLessonIds,
                lastAccessedLessonId: data.lastAccessedLessonId,
              }
            : prev
        );
      }
    } catch {
      // Ignore transient progress save issue
    }
  };

  const handleDownloadResource = async (lesson: Lesson) => {
    if (!idToken || !course) return;
    try {
      const resp = await fetch(`/api/downloads/resource/${course.id}/${lesson.id}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!resp.ok) return;
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        if (data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = data.fileName || lesson.resourceName || 'resource';
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      } else {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = lesson.resourceName || 'lesson-resource.txt';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Non-fatal
    }
  };

  const handleDownloadCoursePdf = async () => {
    if (!idToken || !course) return;
    try {
      const resp = await fetch(`/api/downloads/course-pdf/${course.id}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!resp.ok) return;
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        if (data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = data.fileName || `${course.slug}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      } else {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = course.pdfFileName || `${course.slug}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Non-fatal
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center space-y-4">
        <Lock className="mx-auto h-10 w-10 text-[#D4AF37]" />
        <h1 className="font-display text-3xl text-[#F5F4F0]">Sign In to Watch Lessons</h1>
        <p className="text-sm text-[#A1A1AA]">
          Course videos are protected and restricted to verified enrolled students.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="rounded-sm bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#09090B]"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="h-[500px] animate-pulse rounded-sm border border-white/10 bg-[#111114]" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center space-y-4">
        <Lock className="mx-auto h-10 w-10 text-[#D4AF37]" />
        <h1 className="font-display text-3xl text-[#F5F4F0]">Enrollment Required</h1>
        <p className="text-sm text-[#A1A1AA]">{error || 'Course access is restricted.'}</p>
        <button
          type="button"
          onClick={() => navigate(`/courses/${courseId}`)}
          className="rounded-sm bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#09090B]"
        >
          View Course Details & Enroll
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#A1A1AA] hover:text-[#D4AF37]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#A1A1AA]">Course Progress</span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#D4AF37]" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="font-mono-tabular font-semibold text-[#D4AF37]">{progressPct}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Video Viewport */}
        <div className="space-y-6 lg:col-span-8">
          {(course.isPdfCourse || course.pdfFileName) && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-[#D4AF37]/40 bg-[#121216] px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                  Downloadable Course PDF/eBook
                </p>
                <p className="text-sm text-[#F5F4F0]">
                  {course.pdfFileName || `${course.title}.pdf`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadCoursePdf}
                className="inline-flex items-center gap-2 rounded-sm bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#E5C158]"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF Course</span>
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-sm border border-white/10 bg-black">
            {activeLesson?.videoUrl ? (
              <video
                key={activeLesson.id}
                src={activeLesson.videoUrl}
                controls
                controlsList="nodownload"
                className="aspect-video w-full"
              />
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-[#111114] p-6 text-center text-sm text-[#A1A1AA]">
                <p>
                  {course.isPdfCourse
                    ? 'This lesson is delivered as part of the downloadable PDF/eBook course guide and study workbook below.'
                    : 'No video source attached to this lesson yet.'}
                </p>
              </div>
            )}
          </div>

          {activeLesson && (
            <div className="space-y-5 rounded-sm border border-white/10 bg-[#111114] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-mono-tabular text-[#D4AF37]">
                    Lesson {activeIndex + 1} of {flatLessons.length} · {activeLesson.duration}
                  </p>
                  <h1 className="font-display text-2xl font-semibold text-[#F5F4F0]">
                    {activeLesson.title}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => toggleLessonComplete(activeLesson.id)}
                  className={`inline-flex items-center gap-2 rounded-sm px-4 py-2 text-xs font-semibold transition-colors ${
                    completedSet.has(activeLesson.id)
                      ? 'bg-[#D4AF37] text-[#09090B]'
                      : 'border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {completedSet.has(activeLesson.id) ? 'Completed' : 'Mark as Complete'}
                  </span>
                </button>
              </div>

              <p className="text-sm leading-relaxed text-[#A1A1AA]">{activeLesson.description}</p>

              {activeLesson.resourceName && (
                <div className="flex items-center justify-between rounded-sm border border-white/10 bg-[#09090B] px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-[#F5F4F0]">
                      Downloadable Lesson Resource
                    </p>
                    <p className="font-mono-tabular text-xs text-[#71717A]">
                      {activeLesson.resourceName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadResource(activeLesson)}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-[#D4AF37] px-3.5 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <button
                  type="button"
                  disabled={activeIndex <= 0}
                  onClick={() => setActiveLessonId(flatLessons[activeIndex - 1]?.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F5F4F0] hover:text-[#D4AF37] disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous Lesson</span>
                </button>
                <button
                  type="button"
                  disabled={activeIndex >= flatLessons.length - 1}
                  onClick={() => setActiveLessonId(flatLessons[activeIndex + 1]?.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4AF37] hover:underline disabled:opacity-30"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modules & Lessons Sidebar */}
        <aside className="lg:col-span-4">
          <div className="rounded-sm border border-white/10 bg-[#111114]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-[#F5F4F0]">
                {course.title}
              </h2>
              <p className="mt-0.5 text-xs text-[#A1A1AA]">{course.instructorName}</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto divide-y divide-white/10">
              {course.modules.map((mod) => (
                <div key={mod.id} className="py-3">
                  <p className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                    {mod.title}
                  </p>
                  <ul>
                    {mod.lessons.map((lesson) => {
                      const isActive = lesson.id === activeLesson?.id;
                      const done = completedSet.has(lesson.id);
                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            onClick={() => setActiveLessonId(lesson.id)}
                            className={`flex w-full items-start gap-3 px-5 py-3 text-left text-xs transition-colors ${
                              isActive
                                ? 'bg-[#D4AF37]/15 text-[#F5F4F0]'
                                : 'text-[#A1A1AA] hover:bg-white/[0.03] hover:text-[#F5F4F0]'
                            }`}
                          >
                            {done ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#52525B]" />
                            )}
                            <div className="flex-1 space-y-0.5">
                              <p className="font-medium leading-snug">{lesson.title}</p>
                              <p className="font-mono-tabular text-[11px] text-[#71717A]">
                                {lesson.duration}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
