import React, { useEffect, useState } from 'react';
import { BookOpen, Download, LogOut, Play, RefreshCw, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { formatNGN } from '../lib/format';
import { ConfigBanner } from '../components/ConfigBanner';
import type { Course, Ebook, Enrollment, Order } from '../types';

export function StudentDashboardPage() {
  const { user, profile, idToken, logout, isAdmin, loading: authLoading } = useAuth();
  const { navigate } = useSite();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [myEbooks, setMyEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !idToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch('/api/student/dashboard', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Could not load student dashboard.');
        if (!cancelled) {
          setEnrollments(data.enrollments || []);
          setOrders(data.orders || []);
          setMyCourses(data.myCourses || []);
          setMyEbooks(data.myEbooks || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Dashboard load failed.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [user, idToken, authLoading]);

  const handleDownloadEbook = async (ebook: Ebook) => {
    if (!idToken) return;
    setDownloadingId(ebook.id);
    try {
      const resp = await fetch(`/api/downloads/ebook/${ebook.id}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const contentType = resp.headers.get('content-type') || '';
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || 'Download authorization failed.');
      }
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        if (data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = data.fileName || `${ebook.slug}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      } else {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = ebook.pdfFileName || `${ebook.slug}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadCoursePdf = async (course: Course) => {
    if (!idToken) return;
    setDownloadingId(course.id);
    try {
      const resp = await fetch(`/api/downloads/course-pdf/${course.id}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const contentType = resp.headers.get('content-type') || '';
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || 'Course PDF download authorization failed.');
      }
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRequestRefund = async (orderId: string) => {
    if (!idToken) return;
    try {
      const resp = await fetch(`/api/orders/${orderId}/refund-request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Requested via Student Dashboard' }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not request refund.');
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refund request failed.');
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 space-y-6">
        <ConfigBanner title="Firebase Setup Required for Student Accounts" scope="firebase" />
        <div className="rounded-sm border border-white/10 bg-[#111114] p-8 text-center space-y-4">
          <h1 className="font-display text-3xl text-[#F5F4F0]">Student Dashboard</h1>
          <p className="text-sm text-[#A1A1AA]">
            Sign in with your verified student account to access your enrolled courses, video lessons, and purchased PDF monographs.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-sm bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#09090B]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="rounded-sm border border-white/15 px-5 py-2.5 text-sm font-medium text-[#F5F4F0]"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14 space-y-10">
      {/* Header & Student Welcome */}
      <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            Student Learning Workspace
          </p>
          <h1 className="font-display text-3xl font-semibold text-[#F5F4F0] sm:text-4xl">
            Welcome back, {profile?.fullName || user?.displayName || 'Learner'}
          </h1>
          <p className="text-sm text-[#A1A1AA]">{user?.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="rounded-sm border border-[#D4AF37]/50 px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              Open Admin Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-1.5 rounded-sm border border-white/15 px-4 py-2 text-xs font-medium text-[#F5F4F0] hover:border-[#D4AF37]"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Account Settings</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 rounded-sm border border-white/15 px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <ConfigBanner title="Backend Configuration Notice" scope="all" />

      {error && (
        <div className="rounded-sm border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded-sm border border-white/10 bg-[#111114]" />
          <div className="h-48 animate-pulse rounded-sm border border-white/10 bg-[#111114]" />
        </div>
      ) : (
        <>
          {/* My Courses & Learning Progress */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">My Courses</h2>
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="text-xs font-medium text-[#D4AF37] hover:underline"
              >
                Browse Course Catalog →
              </button>
            </div>

            {myCourses.length === 0 ? (
              <div className="rounded-sm border border-white/10 bg-[#111114] p-8 text-center">
                <BookOpen className="mx-auto mb-3 h-7 w-7 text-[#D4AF37]/70" />
                <p className="font-medium text-[#F5F4F0]">No enrolled courses yet</p>
                <p className="mt-1 text-xs text-[#A1A1AA]">
                  Courses unlock here automatically once your Paystack payment is verified.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/courses')}
                  className="mt-4 rounded-sm bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#09090B]"
                >
                  Explore Courses
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {myCourses.map((course) => {
                  const enr = enrollments.find(
                    (e) => e.productType === 'course' && e.productId === course.id
                  );
                  const completed = enr?.completedLessonIds?.length || 0;
                  const total = Math.max(course.lessonsCount, 1);
                  const pct = Math.min(100, Math.round((completed / total) * 100));

                  return (
                    <div
                      key={course.id}
                      className="flex flex-col justify-between rounded-sm border border-white/10 bg-[#111114] p-6"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                          <span className="text-[#D4AF37]">{course.category}</span>
                          <span className="font-mono-tabular">
                            {completed} / {total} lessons ({pct}%)
                          </span>
                        </div>
                        <h3 className="font-display text-xl font-semibold text-[#F5F4F0]">
                          {course.title}
                        </h3>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-[#D4AF37] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
                        <span className="text-xs text-[#71717A]">
                          {course.formatLabel ||
                            (enr?.lastAccessedLessonId
                              ? 'Resume where you left off'
                              : 'Ready to begin')}
                        </span>
                        <div className="flex items-center gap-2">
                          {(course.isPdfCourse || course.pdfFileName) && (
                            <button
                              type="button"
                              onClick={() => handleDownloadCoursePdf(course)}
                              disabled={downloadingId === course.id}
                              className="inline-flex items-center gap-1.5 rounded-sm border border-[#D4AF37] px-3.5 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 disabled:opacity-50"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>
                                {downloadingId === course.id ? 'Preparing...' : 'Download PDF'}
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/learn/${course.id}`)}
                            className="inline-flex items-center gap-1.5 rounded-sm bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#E5C158]"
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span>Open Course</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Purchased Ebooks */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">
                Purchased Ebooks & Downloads
              </h2>
              <button
                type="button"
                onClick={() => navigate('/ebooks')}
                className="text-xs font-medium text-[#D4AF37] hover:underline"
              >
                Visit Ebook Store →
              </button>
            </div>

            {myEbooks.length === 0 ? (
              <div className="rounded-sm border border-white/10 bg-[#111114] p-8 text-center">
                <p className="font-medium text-[#F5F4F0]">No purchased ebooks yet</p>
                <p className="mt-1 text-xs text-[#A1A1AA]">
                  Verified ebook purchases appear here with protected PDF downloads.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {myEbooks.map((ebook) => (
                  <div
                    key={ebook.id}
                    className="flex items-center justify-between gap-4 rounded-sm border border-white/10 bg-[#111114] p-5"
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-[#D4AF37]">{ebook.author}</p>
                      <h3 className="font-display text-lg font-semibold text-[#F5F4F0]">
                        {ebook.title}
                      </h3>
                      <p className="text-xs text-[#71717A]">{ebook.format}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadEbook(ebook)}
                      disabled={downloadingId === ebook.id}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-[#D4AF37] px-4 py-2.5 text-xs font-semibold text-[#09090B] hover:bg-[#E5C158] disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{downloadingId === ebook.id ? 'Preparing...' : 'Download PDF'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Order History */}
          <section className="space-y-5">
            <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">Order History</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-[#71717A]">You have not initiated any orders yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-sm border border-white/10 bg-[#111114]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-[#151519] text-[#A1A1AA]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Reference</th>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3.5 font-mono-tabular text-[#F5F4F0]">
                          {order.reference}
                        </td>
                        <td className="px-4 py-3.5 text-[#E4E4E7]">{order.productTitle}</td>
                        <td className="px-4 py-3.5 text-right font-mono-tabular text-[#D4AF37]">
                          {formatNGN(order.amountNGN)}
                        </td>
                        <td className="px-4 py-3.5 font-mono-tabular text-[#F5F4F0]">
                          {order.status}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-3">
                          <a
                            href={order.whatsappPreparedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#D4AF37] hover:underline"
                          >
                            WhatsApp
                          </a>
                          {order.status === 'PAID' && (
                            <button
                              type="button"
                              onClick={() => handleRequestRefund(order.id)}
                              className="inline-flex items-center gap-1 text-[#A1A1AA] hover:text-[#F5F4F0]"
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span>Request Refund</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
