import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  BookText,
  CreditCard,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Plus,
  Settings,
  ShieldAlert,
  Trash2,
  Upload,
  Users,
  Video,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { formatNGN, getCustomerWhatsAppUrl, uploadFileToStorage } from '../lib/format';
import { ConfigBanner } from '../components/ConfigBanner';
import type {
  Announcement,
  Course,
  Ebook,
  EbookAvailabilityStatus,
  Order,
  SiteSettings,
  UserProfile,
} from '../types';

type AdminTab = 'overview' | 'courses' | 'ebooks' | 'videos' | 'users' | 'orders' | 'settings';

export function AdminDashboardPage() {
  const { user, idToken, isAdmin, loading: authLoading } = useAuth();
  const { refreshCatalog, navigate } = useSite();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEbooks: 0,
    totalOrders: 0,
    paidOrdersCount: 0,
    totalRevenueNGN: 0,
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [settingsForm, setSettingsForm] = useState<SiteSettings | null>(null);

  // Filters & Forms
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Course editor state
  const [courseDraft, setCourseDraft] = useState<Partial<Course>>({
    title: '',
    subtitle: '',
    description: '',
    instructorName: '',
    category: 'AI Video',
    priceNGN: 5000,
    duration: 'Self-Paced',
    level: 'Beginner',
    formatLabel: 'Online Video Course',
    isPdfCourse: false,
    enrollmentInfo: '',
    published: true,
    thumbnailUrl: '',
  });

  // Ebook editor state
  const [ebookDraft, setEbookDraft] = useState<Partial<Ebook>>({
    title: '',
    subtitle: '',
    description: '',
    author: '',
    category: 'AI Creator Economy',
    priceNGN: 8000,
    pages: 120,
    format: 'PDF Digital Edition',
    previewExcerpt: '',
    availabilityStatus: 'available',
    published: true,
    coverUrl: '',
  });

  // Video Lesson editor state
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonDuration, setLessonDuration] = useState('15:00');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonVideoPath, setLessonVideoPath] = useState('');
  const [lessonResourceName, setLessonResourceName] = useState('');
  const [lessonResourcePath, setLessonResourcePath] = useState('');

  // Announcement draft
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');

  // Grant access modal state
  const [grantUid, setGrantUid] = useState('');
  const [grantType, setGrantType] = useState<'course' | 'ebook'>('course');
  const [grantProductId, setGrantProductId] = useState('');

  const loadAdminData = useCallback(async () => {
    if (!idToken || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to load admin console.');
      setStats(data.stats);
      setUsers(data.users || []);
      setCourses(data.courses || []);
      setEbooks(data.ebooks || []);
      setOrders(data.orders || []);
      setAnnouncements(data.announcements || []);
      setSettingsForm(data.siteSettings);
      if (data.courses?.length && !selectedCourseId) {
        setSelectedCourseId(data.courses[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin load failed.');
    } finally {
      setLoading(false);
    }
  }, [idToken, isAdmin, selectedCourseId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }
    loadAdminData();
  }, [user, isAdmin, authLoading, loadAdminData]);

  const handleStorageUpload = async (
    file: File | undefined,
    pathPrefix: string,
    mimePrefixes: string[],
    maxMB: number,
    onDone: (res: { downloadUrl: string; storagePath: string; fileName: string }) => void
  ) => {
    if (!file) return;
    setUploadStatus(null);
    setUploadProgress(0);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fullPath = `${pathPrefix}/${Date.now()}_${cleanName}`;
      const result = await uploadFileToStorage(
        file,
        fullPath,
        { allowedMimePrefixes: mimePrefixes, maxSizeMB: maxMB },
        (pct) => setUploadProgress(pct)
      );
      setUploadStatus(`Uploaded ${file.name} successfully.`);
      onDone({ ...result, fileName: file.name });
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    setError(null);
    setNotice(null);
    try {
      const resp = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseDraft),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not save course.');
      setNotice('Course saved to Firestore.');
      setCourseDraft({
        title: '',
        subtitle: '',
        description: '',
        instructorName: '',
        category: 'AI Video',
        priceNGN: 5000,
        duration: 'Self-Paced',
        level: 'Beginner',
        formatLabel: 'Online Video Course',
        isPdfCourse: false,
        enrollmentInfo: '',
        published: true,
        thumbnailUrl: '',
      });
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save course failed.');
    }
  };

  const handleToggleCoursePublish = async (course: Course) => {
    if (!idToken) return;
    await fetch('/api/admin/courses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...course, published: !course.published }),
    });
    await Promise.all([loadAdminData(), refreshCatalog()]);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!idToken) return;
    await fetch(`/api/admin/courses/${courseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    await Promise.all([loadAdminData(), refreshCatalog()]);
  };

  const handleSaveEbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken) return;
    setError(null);
    setNotice(null);
    try {
      const resp = await fetch('/api/admin/ebooks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ebookDraft),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not save ebook.');
      setNotice('Ebook saved to Firestore.');
      setEbookDraft({
        title: '',
        subtitle: '',
        description: '',
        author: '',
        category: 'AI Creator Economy',
        priceNGN: 8000,
        pages: 120,
        format: 'PDF Digital Edition',
        previewExcerpt: '',
        availabilityStatus: 'available',
        published: true,
        coverUrl: '',
      });
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save ebook failed.');
    }
  };

  const handleChangeEbookStatus = async (
    ebook: Ebook,
    availabilityStatus: EbookAvailabilityStatus
  ) => {
    if (!idToken) return;
    setError(null);
    setNotice(null);
    const resp = await fetch('/api/admin/ebooks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...ebook,
        availabilityStatus,
        published: availabilityStatus !== 'unpublished',
      }),
    });
    if (resp.ok) {
      setNotice(`Updated "${ebook.title}" status to ${availabilityStatus.replace('_', ' ').toUpperCase()}.`);
    }
    await Promise.all([loadAdminData(), refreshCatalog()]);
  };

  const handleSyncOfficialEbooks = async () => {
    if (!idToken) return;
    setError(null);
    setNotice(null);
    try {
      const resp = await fetch('/api/admin/ebooks/sync-official', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!resp.ok) throw new Error('Failed to sync official eBook Store.');
      setNotice('Official eBook Store products synchronized.');
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed.');
    }
  };

  const handleDeleteEbook = async (ebookId: string) => {
    if (!idToken) return;
    await fetch(`/api/admin/ebooks/${ebookId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    await Promise.all([loadAdminData(), refreshCatalog()]);
  };

  const handleAddLessonToCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken || !selectedCourseId) return;
    const course = courses.find((c) => c.id === selectedCourseId);
    if (!course) return;

    const newLessonId = `les_${Date.now().toString(36)}`;
    const existingMods = [...(course.modules || [])];
    const targetModTitle = moduleTitle.trim() || existingMods[0]?.title || 'Module 01: Core Lessons';
    let targetMod = existingMods.find((m) => m.title.toLowerCase() === targetModTitle.toLowerCase());

    if (!targetMod) {
      targetMod = {
        id: `mod_${Date.now().toString(36)}`,
        courseId: course.id,
        title: targetModTitle,
        description: '',
        order: existingMods.length + 1,
        lessons: [],
      };
      existingMods.push(targetMod);
    }

    targetMod.lessons.push({
      id: newLessonId,
      courseId: course.id,
      moduleId: targetMod.id,
      title: lessonTitle.trim(),
      description: lessonDesc.trim(),
      duration: lessonDuration.trim() || '15:00',
      order: targetMod.lessons.length + 1,
      videoUrl: lessonVideoUrl.trim(),
      videoStoragePath: lessonVideoPath || undefined,
      resourceName: lessonResourceName || undefined,
      resourceStoragePath: lessonResourcePath || undefined,
    });

    const resp = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...course, modules: existingMods }),
    });

    if (resp.ok) {
      setNotice(`Lesson "${lessonTitle}" added to ${course.title}.`);
      setLessonTitle('');
      setLessonDesc('');
      setLessonVideoUrl('');
      setLessonVideoPath('');
      setLessonResourceName('');
      setLessonResourcePath('');
      await Promise.all([loadAdminData(), refreshCatalog()]);
    }
  };

  const handleSuspendUser = async (target: UserProfile) => {
    if (!idToken) return;
    await fetch(`/api/admin/users/${target.uid}/suspend`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ suspended: !target.suspended }),
    });
    await loadAdminData();
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken || !grantUid || !grantProductId) return;
    const resp = await fetch(`/api/admin/users/${grantUid}/grant-access`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productType: grantType, productId: grantProductId }),
    });
    if (resp.ok) {
      setNotice('Access granted successfully.');
      setGrantUid('');
    }
  };

  const handlePaystackRefund = async (orderId: string) => {
    if (!idToken) return;
    setError(null);
    const resp = await fetch(`/api/admin/orders/${orderId}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = await resp.json();
    if (!resp.ok) {
      setError(data.error || 'Paystack refund failed.');
      return;
    }
    setNotice('Paystack refund processed and access revoked.');
    await loadAdminData();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken || !settingsForm) return;
    const resp = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingsForm),
    });
    if (resp.ok) {
      setNotice('Website settings updated.');
      await refreshCatalog();
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idToken || !annTitle || !annMessage) return;
    const resp = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: annTitle, message: annMessage, active: true }),
    });
    if (resp.ok) {
      setAnnTitle('');
      setAnnMessage('');
      await Promise.all([loadAdminData(), refreshCatalog()]);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!idToken) return;
    await fetch(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    await Promise.all([loadAdminData(), refreshCatalog()]);
  };

  if (!authLoading && (!user || !isAdmin)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 space-y-6">
        <ConfigBanner title="Admin RBAC & Firebase Configuration" scope="all" />
        <div className="rounded-sm border border-white/10 bg-[#111114] p-8 text-center space-y-4">
          <ShieldAlert className="mx-auto h-10 w-10 text-[#D4AF37]" />
          <h1 className="font-display text-3xl text-[#F5F4F0]">Administrator Access Required</h1>
          <p className="text-sm leading-relaxed text-[#A1A1AA]">
            This console enforces server-side Firebase Authentication & Role-Based Access Control. Users cannot promote themselves to admin; admin privileges are assigned via the trusted <code className="text-[#D4AF37]">admins/&#123;uid&#125;</code> Firestore registry or <code className="text-[#D4AF37]">ADMIN_EMAILS</code> server environment variable with a verified email.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-sm bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#09090B]"
            >
              Sign In as Admin
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-sm border border-white/15 px-5 py-2.5 text-sm font-medium text-[#F5F4F0]"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter((o) => orderFilter === 'ALL' || o.status === orderFilter);

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'ebooks', label: 'Ebooks', icon: <BookText className="h-4 w-4" /> },
    { id: 'videos', label: 'Video Lessons', icon: <Video className="h-4 w-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
    { id: 'orders', label: 'Payments & Orders', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'settings', label: 'Website Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            Admin Console · RBAC Verified
          </p>
          <h1 className="font-display text-3xl font-semibold text-[#F5F4F0] sm:text-4xl">
            TITAN CREATIVE HUB ™ Management
          </h1>
        </div>
        <p className="text-xs text-[#A1A1AA]">Signed in as {user?.email}</p>
      </div>

      {error && (
        <div className="mb-6 rounded-sm border border-red-500/30 bg-red-950/30 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-6 rounded-sm border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-3 text-xs text-[#D4AF37]">
          {notice}
        </div>
      )}
      {uploadProgress !== null && (
        <div className="mb-6 rounded-sm border border-white/10 bg-[#111114] p-4 space-y-2">
          <div className="flex justify-between text-xs text-[#F5F4F0]">
            <span>Uploading to Firebase Storage...</span>
            <span className="font-mono-tabular">{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10">
            <div className="h-full bg-[#D4AF37]" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}
      {uploadStatus && (
        <div className="mb-6 rounded-sm border border-white/15 bg-[#111114] px-4 py-2.5 text-xs text-[#E4E4E7]">
          {uploadStatus}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <nav className="flex flex-row gap-1 overflow-x-auto rounded-sm border border-white/10 bg-[#111114] p-2 lg:flex-col">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2.5 rounded-sm px-3.5 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  tab === item.id
                    ? 'bg-[#D4AF37] text-[#09090B] font-semibold'
                    : 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-[#F5F4F0]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Viewport */}
        <main className="lg:col-span-9 space-y-8">
          {loading ? (
            <div className="h-64 animate-pulse rounded-sm border border-white/10 bg-[#111114]" />
          ) : (
            <>
              {/* A. Overview */}
              {tab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-sm border border-white/10 bg-[#111114] p-5">
                      <p className="text-xs text-[#A1A1AA]">Verified Revenue (NGN)</p>
                      <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#D4AF37]">
                        {formatNGN(stats.totalRevenueNGN)}
                      </p>
                    </div>
                    <div className="rounded-sm border border-white/10 bg-[#111114] p-5">
                      <p className="text-xs text-[#A1A1AA]">Total Orders / Paid</p>
                      <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F5F4F0]">
                        {stats.totalOrders} / {stats.paidOrdersCount}
                      </p>
                    </div>
                    <div className="rounded-sm border border-white/10 bg-[#111114] p-5">
                      <p className="text-xs text-[#A1A1AA]">Registered Users</p>
                      <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F5F4F0]">
                        {stats.totalUsers}
                      </p>
                    </div>
                    <div className="rounded-sm border border-white/10 bg-[#111114] p-5">
                      <p className="text-xs text-[#A1A1AA]">Total Courses</p>
                      <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F5F4F0]">
                        {stats.totalCourses}
                      </p>
                    </div>
                    <div className="rounded-sm border border-white/10 bg-[#111114] p-5">
                      <p className="text-xs text-[#A1A1AA]">Total Ebooks</p>
                      <p className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F5F4F0]">
                        {stats.totalEbooks}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* B. Course Management */}
              {tab === 'courses' && (
                <div className="space-y-8">
                  <form
                    onSubmit={handleSaveCourse}
                    className="rounded-sm border border-white/10 bg-[#111114] p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">
                        Create or Update Course
                      </h2>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!idToken) return;
                          const resp = await fetch('/api/admin/catalog/sync-official', {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${idToken}` },
                          });
                          if (resp.ok) {
                            setNotice('Official six-course catalogue synced cleanly.');
                            await Promise.all([loadAdminData(), refreshCatalog()]);
                          }
                        }}
                        className="rounded-sm border border-[#D4AF37]/50 px-3 py-1.5 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
                      >
                        Sync Official 6 Courses
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        required
                        placeholder="Course Title"
                        value={courseDraft.title || ''}
                        onChange={(e) => setCourseDraft({ ...courseDraft, title: e.target.value })}
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Instructor Name"
                        value={courseDraft.instructorName || ''}
                        onChange={(e) =>
                          setCourseDraft({ ...courseDraft, instructorName: e.target.value })
                        }
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <input
                        type="text"
                        placeholder="Category (e.g. AI Video)"
                        value={courseDraft.category || ''}
                        onChange={(e) => setCourseDraft({ ...courseDraft, category: e.target.value })}
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="Price (NGN)"
                        value={courseDraft.priceNGN ?? 0}
                        onChange={(e) =>
                          setCourseDraft({ ...courseDraft, priceNGN: Number(e.target.value) })
                        }
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g. 2 Weeks or 8h 30m)"
                        value={courseDraft.duration || ''}
                        onChange={(e) => setCourseDraft({ ...courseDraft, duration: e.target.value })}
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <select
                        value={courseDraft.level || 'Beginner'}
                        onChange={(e) =>
                          setCourseDraft({
                            ...courseDraft,
                            level: e.target.value as Course['level'],
                          })
                        }
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Format (e.g. Downloadable PDF/eBook, Online Video Course)"
                        value={courseDraft.formatLabel || ''}
                        onChange={(e) =>
                          setCourseDraft({ ...courseDraft, formatLabel: e.target.value })
                        }
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <label className="flex items-center gap-2.5 rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-xs text-[#F5F4F0]">
                        <input
                          type="checkbox"
                          checked={Boolean(courseDraft.isPdfCourse)}
                          onChange={(e) =>
                            setCourseDraft({ ...courseDraft, isPdfCourse: e.target.checked })
                          }
                          className="accent-[#D4AF37]"
                        />
                        <span>Includes Downloadable PDF/eBook Course Material</span>
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Course Description"
                      value={courseDraft.description || ''}
                      onChange={(e) => setCourseDraft({ ...courseDraft, description: e.target.value })}
                      className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                    />
                    <textarea
                      rows={2}
                      placeholder="Program Schedule & Enrolment Information (e.g. 2-Week Online Class schedule)"
                      value={courseDraft.enrollmentInfo || ''}
                      onChange={(e) =>
                        setCourseDraft({ ...courseDraft, enrollmentInfo: e.target.value })
                      }
                      className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-white/15 px-4 py-2 text-xs text-[#F5F4F0] hover:border-[#D4AF37]">
                          <Upload className="h-3.5 w-3.5 text-[#D4AF37]" />
                          <span>Upload Thumbnail (Image &lt; 10MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleStorageUpload(
                                e.target.files?.[0],
                                'public/courses/thumbnails',
                                ['image/'],
                                10,
                                ({ downloadUrl, storagePath }) =>
                                  setCourseDraft((prev) => ({
                                    ...prev,
                                    thumbnailUrl: downloadUrl,
                                    thumbnailStoragePath: storagePath,
                                  }))
                              )
                            }
                          />
                        </label>

                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-white/15 px-4 py-2 text-xs text-[#F5F4F0] hover:border-[#D4AF37]">
                          <Upload className="h-3.5 w-3.5 text-[#D4AF37]" />
                          <span>Upload Course PDF/eBook (&lt; 100MB)</span>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) =>
                              handleStorageUpload(
                                e.target.files?.[0],
                                `private/courses/${courseDraft.id || 'catalog'}/pdfs`,
                                ['application/pdf'],
                                100,
                                ({ storagePath, fileName }) =>
                                  setCourseDraft((prev) => ({
                                    ...prev,
                                    isPdfCourse: true,
                                    pdfStoragePath: storagePath,
                                    pdfFileName: fileName,
                                  }))
                              )
                            }
                          />
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-sm bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#09090B]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Save Course</span>
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-white/10 bg-[#111114] p-4"
                      >
                        <div>
                          <p className="font-medium text-[#F5F4F0]">{course.title}</p>
                          <p className="text-xs text-[#A1A1AA]">
                            {course.category} · {formatNGN(course.priceNGN)} ·{' '}
                            {course.published ? 'Published' : 'Draft'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => setCourseDraft(course)}
                            className="text-[#D4AF37] hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCoursePublish(course)}
                            className="text-[#E4E4E7] hover:text-[#D4AF37]"
                          >
                            {course.published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course.id)}
                            aria-label={`Delete ${course.title}`}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* C. Ebook Management */}
              {tab === 'ebooks' && (
                <div className="space-y-8">
                  <form
                    onSubmit={handleSaveEbook}
                    className="rounded-sm border border-white/10 bg-[#111114] p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">
                        {ebookDraft.id ? 'Edit eBook Product' : 'Add or Update eBook'}
                      </h2>
                      <div className="flex items-center gap-3">
                        {ebookDraft.id && (
                          <button
                            type="button"
                            onClick={() =>
                              setEbookDraft({
                                title: '',
                                subtitle: '',
                                description: '',
                                author: '',
                                category: 'AI Creator Economy',
                                priceNGN: 8000,
                                pages: 120,
                                format: 'PDF Digital Edition',
                                previewExcerpt: '',
                                availabilityStatus: 'available',
                                published: true,
                                coverUrl: '',
                              })
                            }
                            className="text-xs text-[#A1A1AA] hover:text-[#F5F4F0]"
                          >
                            Cancel Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSyncOfficialEbooks}
                          className="rounded-sm border border-[#D4AF37]/40 px-3 py-1.5 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        >
                          Sync Official eBooks
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        required
                        placeholder="eBook Title"
                        value={ebookDraft.title || ''}
                        onChange={(e) => setEbookDraft({ ...ebookDraft, title: e.target.value })}
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Author Name"
                        value={ebookDraft.author || ''}
                        onChange={(e) => setEbookDraft({ ...ebookDraft, author: e.target.value })}
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="Price (NGN)"
                        value={ebookDraft.priceNGN ?? 0}
                        onChange={(e) =>
                          setEbookDraft({ ...ebookDraft, priceNGN: Number(e.target.value) })
                        }
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <select
                        value={
                          ebookDraft.availabilityStatus ||
                          (ebookDraft.published === false ? 'unpublished' : 'available')
                        }
                        onChange={(e) => {
                          const nextStatus = e.target.value as EbookAvailabilityStatus;
                          setEbookDraft({
                            ...ebookDraft,
                            availabilityStatus: nextStatus,
                            published: nextStatus !== 'unpublished',
                          });
                        }}
                        aria-label="Product Availability"
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      >
                        <option value="available">Available (Open for Purchase)</option>
                        <option value="coming_soon">Coming Soon (Visible, No Purchases Yet)</option>
                        <option value="unpublished">Unpublished (Hidden from Store)</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Category (e.g. AI Creator Economy)"
                        value={ebookDraft.category || ''}
                        onChange={(e) =>
                          setEbookDraft({ ...ebookDraft, category: e.target.value })
                        }
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <input
                        type="number"
                        min={1}
                        placeholder="Pages"
                        value={ebookDraft.pages ?? 100}
                        onChange={(e) =>
                          setEbookDraft({ ...ebookDraft, pages: Number(e.target.value) })
                        }
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Short Subtitle"
                      value={ebookDraft.subtitle || ''}
                      onChange={(e) => setEbookDraft({ ...ebookDraft, subtitle: e.target.value })}
                      className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                    />
                    <textarea
                      rows={3}
                      placeholder="eBook Description"
                      value={ebookDraft.description || ''}
                      onChange={(e) => setEbookDraft({ ...ebookDraft, description: e.target.value })}
                      className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                    />
                    <textarea
                      rows={2}
                      placeholder="Chapter Preview Excerpt"
                      value={ebookDraft.previewExcerpt || ''}
                      onChange={(e) =>
                        setEbookDraft({ ...ebookDraft, previewExcerpt: e.target.value })
                      }
                      className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                    />

                    {(ebookDraft.coverUrl || ebookDraft.pdfFileName) && (
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#A1A1AA]">
                        {ebookDraft.coverUrl && (
                          <span className="truncate max-w-xs">
                            Cover attached: <span className="text-[#F5F4F0]">{ebookDraft.coverUrl}</span>
                          </span>
                        )}
                        {ebookDraft.pdfFileName && (
                          <span>
                            PDF attached: <span className="text-[#D4AF37]">{ebookDraft.pdfFileName}</span>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-white/15 px-4 py-2 text-xs text-[#F5F4F0] hover:border-[#D4AF37]">
                        <Upload className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>Upload / Replace Cover Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleStorageUpload(
                              e.target.files?.[0],
                              'public/ebooks/covers',
                              ['image/'],
                              10,
                              ({ downloadUrl, storagePath }) =>
                                setEbookDraft((prev) => ({
                                  ...prev,
                                  coverUrl: downloadUrl,
                                  coverStoragePath: storagePath,
                                }))
                            )
                          }
                        />
                      </label>

                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-white/15 px-4 py-2 text-xs text-[#F5F4F0] hover:border-[#D4AF37]">
                        <Upload className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>Upload / Replace PDF (&lt; 100MB)</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) =>
                            handleStorageUpload(
                              e.target.files?.[0],
                              `private/ebooks/${ebookDraft.id || 'catalog'}`,
                              ['application/pdf'],
                              100,
                              ({ storagePath, fileName }) =>
                                setEbookDraft((prev) => ({
                                  ...prev,
                                  pdfStoragePath: storagePath,
                                  pdfFileName: fileName,
                                }))
                            )
                          }
                        />
                      </label>

                      <button
                        type="submit"
                        className="ml-auto rounded-sm bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#09090B]"
                      >
                        Save eBook
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    {ebooks.map((eb) => {
                      const status: EbookAvailabilityStatus =
                        eb.availabilityStatus || (eb.published ? 'available' : 'unpublished');
                      return (
                        <div
                          key={eb.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-white/10 bg-[#111114] p-4"
                        >
                          <div className="flex items-center gap-4">
                            {eb.coverUrl && (
                              <img
                                src={eb.coverUrl}
                                alt={eb.title}
                                referrerPolicy="no-referrer"
                                className="h-14 w-11 rounded-sm border border-white/10 object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-[#F5F4F0]">{eb.title}</p>
                              <p className="text-xs text-[#A1A1AA]">
                                {eb.author} · {formatNGN(eb.priceNGN)} ·{' '}
                                <span className="font-semibold text-[#D4AF37]">
                                  {status === 'coming_soon'
                                    ? 'COMING SOON'
                                    : status === 'available'
                                    ? 'AVAILABLE'
                                    : 'UNPUBLISHED'}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <select
                              value={status}
                              onChange={(e) =>
                                handleChangeEbookStatus(
                                  eb,
                                  e.target.value as EbookAvailabilityStatus
                                )
                              }
                              aria-label={`Change availability for ${eb.title}`}
                              className="rounded-sm border border-white/15 bg-[#09090B] px-2.5 py-1.5 text-xs text-[#F5F4F0]"
                            >
                              <option value="available">Available</option>
                              <option value="coming_soon">Coming Soon</option>
                              <option value="unpublished">Unpublished</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => setEbookDraft(eb)}
                              className="text-[#D4AF37] hover:underline"
                            >
                              Edit Details / Cover / PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEbook(eb.id)}
                              aria-label={`Delete ${eb.title}`}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* D. Video Management */}
              {tab === 'videos' && (
                <form
                  onSubmit={handleAddLessonToCourse}
                  className="rounded-sm border border-white/10 bg-[#111114] p-6 space-y-4"
                >
                  <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">
                    Add Video Lesson to Course Module
                  </h2>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Module Title (existing or new)"
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                    />

                    <input
                      type="text"
                      required
                      placeholder="Lesson Title"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                    />

                    <input
                      type="text"
                      placeholder="Duration (e.g. 24:15)"
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(e.target.value)}
                      className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Lesson Description"
                    value={lessonDesc}
                    onChange={(e) => setLessonDesc(e.target.value)}
                    className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                  />

                  <input
                    type="url"
                    placeholder="Authorized Hosted Video URL (or upload MP4/WebM below)"
                    value={lessonVideoUrl}
                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                    className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-white/15 px-4 py-2 text-xs text-[#F5F4F0] hover:border-[#D4AF37]">
                      <Upload className="h-3.5 w-3.5 text-[#D4AF37]" />
                      <span>Upload Private Video (MP4/WebM &lt; 500MB)</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        className="hidden"
                        onChange={(e) =>
                          handleStorageUpload(
                            e.target.files?.[0],
                            `private/courses/${selectedCourseId}/videos`,
                            ['video/mp4', 'video/webm'],
                            500,
                            ({ storagePath }) => setLessonVideoPath(storagePath)
                          )
                        }
                      />
                    </label>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-white/15 px-4 py-2 text-xs text-[#F5F4F0] hover:border-[#D4AF37]">
                      <Upload className="h-3.5 w-3.5 text-[#D4AF37]" />
                      <span>Attach Downloadable Resource</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          handleStorageUpload(
                            e.target.files?.[0],
                            `private/courses/${selectedCourseId}/resources`,
                            ['application/pdf', 'text/', 'application/zip'],
                            50,
                            ({ storagePath, fileName }) => {
                              setLessonResourcePath(storagePath);
                              setLessonResourceName(fileName);
                            }
                          )
                        }
                      />
                    </label>

                    <button
                      type="submit"
                      className="ml-auto rounded-sm bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#09090B]"
                    >
                      Save Lesson
                    </button>
                  </div>
                </form>
              )}

              {/* E. User Management */}
              {tab === 'users' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleGrantAccess}
                    className="rounded-sm border border-white/10 bg-[#111114] p-5 flex flex-wrap items-end gap-3"
                  >
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-xs text-[#A1A1AA] mb-1">Student</label>
                      <select
                        value={grantUid}
                        onChange={(e) => setGrantUid(e.target.value)}
                        className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3 py-2 text-xs text-[#F5F4F0]"
                      >
                        <option value="">Select user...</option>
                        {users.map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.fullName} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#A1A1AA] mb-1">Type</label>
                      <select
                        value={grantType}
                        onChange={(e) => setGrantType(e.target.value as 'course' | 'ebook')}
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3 py-2 text-xs text-[#F5F4F0]"
                      >
                        <option value="course">Course</option>
                        <option value="ebook">Ebook</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-xs text-[#A1A1AA] mb-1">Product</label>
                      <select
                        value={grantProductId}
                        onChange={(e) => setGrantProductId(e.target.value)}
                        className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3 py-2 text-xs text-[#F5F4F0]"
                      >
                        <option value="">Select product...</option>
                        {(grantType === 'course' ? courses : ebooks).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="rounded-sm bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#09090B]"
                    >
                      Grant Access
                    </button>
                  </form>

                  <div className="overflow-x-auto rounded-sm border border-white/10 bg-[#111114]">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-white/10 bg-[#151519] text-[#A1A1AA]">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {users.map((u) => (
                          <tr key={u.uid}>
                            <td className="px-4 py-3 text-[#F5F4F0]">{u.fullName}</td>
                            <td className="px-4 py-3 text-[#A1A1AA]">{u.email}</td>
                            <td className="px-4 py-3 font-mono-tabular text-[#D4AF37]">{u.role}</td>
                            <td className="px-4 py-3">{u.suspended ? 'Suspended' : 'Active'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleSuspendUser(u)}
                                className="text-[#D4AF37] hover:underline"
                              >
                                {u.suspended ? 'Unsuspend' : 'Suspend'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* F. Payments & Orders Management */}
              {tab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-1 rounded-sm border border-white/10 bg-[#111114] p-1 w-fit">
                    {['ALL', 'PENDING', 'PAID', 'FAILED', 'REFUND_REQUESTED', 'REFUNDED'].map(
                      (statusKey) => (
                        <button
                          key={statusKey}
                          type="button"
                          onClick={() => setOrderFilter(statusKey)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-sm ${
                            orderFilter === statusKey
                              ? 'bg-[#D4AF37] text-[#09090B]'
                              : 'text-[#A1A1AA] hover:text-[#F5F4F0]'
                          }`}
                        >
                          {statusKey}
                        </button>
                      )
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-sm border border-white/10 bg-[#111114]">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-white/10 bg-[#151519] text-[#A1A1AA]">
                        <tr>
                          <th className="px-4 py-3">Reference</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {filteredOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-3 font-mono-tabular text-[#F5F4F0]">
                              <p>{order.reference}</p>
                              {order.paymentReference && (
                                <p className="text-[11px] text-[#71717A]">
                                  PS: {order.paymentReference}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-[#F5F4F0]">{order.customerName}</p>
                              <p className="text-[11px] text-[#A1A1AA]">{order.customerEmail}</p>
                            </td>
                            <td className="px-4 py-3 text-[#E4E4E7]">{order.productTitle}</td>
                            <td className="px-4 py-3 text-right font-mono-tabular text-[#D4AF37]">
                              {formatNGN(order.amountNGN)}
                            </td>
                            <td className="px-4 py-3 font-mono-tabular">{order.status}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-3">
                                <a
                                  href={getCustomerWhatsAppUrl(
                                    '1239043130575',
                                    `Hello ${order.customerName}, regarding your TITAN CREATIVE HUB order ${order.reference} (${order.productTitle}) — status: ${order.status}.`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open WhatsApp"
                                  className="inline-flex items-center gap-1 text-[#D4AF37] hover:underline"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  <span>WhatsApp</span>
                                </a>
                                <a
                                  href={`mailto:${order.customerEmail}?subject=${encodeURIComponent(
                                    `TITAN CREATIVE HUB Order ${order.reference}`
                                  )}`}
                                  className="inline-flex items-center gap-1 text-[#E4E4E7] hover:text-[#D4AF37]"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                  <span>Email</span>
                                </a>
                                {(order.status === 'PAID' ||
                                  order.status === 'REFUND_REQUESTED') && (
                                  <button
                                    type="button"
                                    onClick={() => handlePaystackRefund(order.id)}
                                    className="text-red-400 hover:underline"
                                  >
                                    Refund via Paystack
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* G. Website Settings */}
              {tab === 'settings' && settingsForm && (
                <div className="space-y-8">
                  <form
                    onSubmit={handleSaveSettings}
                    className="rounded-sm border border-white/10 bg-[#111114] p-6 space-y-4"
                  >
                    <h2 className="font-display text-2xl font-semibold text-[#F5F4F0]">
                      Brand Identity & Homepage Copy
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        value={settingsForm.siteName}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, siteName: e.target.value })
                        }
                        placeholder="Website Name"
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <input
                        type="text"
                        value={settingsForm.logoUrl}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, logoUrl: e.target.value })
                        }
                        placeholder="Custom Logo URL (defaults to TITAN official logo)"
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <input
                        type="text"
                        value={settingsForm.whatsappNumber}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                        }
                        placeholder="WhatsApp Number"
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                      <input
                        type="email"
                        value={settingsForm.businessEmail}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, businessEmail: e.target.value })
                        }
                        placeholder="Business Email"
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                      />
                    </div>
                    <input
                      type="text"
                      value={settingsForm.heroHeadline}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, heroHeadline: e.target.value })
                      }
                      placeholder="Hero Headline"
                      className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                    />
                    <textarea
                      rows={2}
                      value={settingsForm.heroSubheadline}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, heroSubheadline: e.target.value })
                      }
                      placeholder="Hero Subheadline"
                      className="w-full rounded-sm border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F4F0]"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-white/15 px-4 py-2 text-xs text-[#F5F4F0] hover:border-[#D4AF37]">
                        <Upload className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>Upload Brand Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleStorageUpload(
                              e.target.files?.[0],
                              'public/branding',
                              ['image/'],
                              5,
                              ({ downloadUrl }) =>
                                setSettingsForm((prev) =>
                                  prev ? { ...prev, logoUrl: downloadUrl } : prev
                                )
                            )
                          }
                        />
                      </label>

                      <button
                        type="submit"
                        className="rounded-sm bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#09090B]"
                      >
                        Save Website Settings
                      </button>
                    </div>
                  </form>

                  {/* Announcements */}
                  <div className="rounded-sm border border-white/10 bg-[#111114] p-6 space-y-4">
                    <h3 className="font-display text-xl font-semibold text-[#F5F4F0]">
                      Platform Announcements
                    </h3>
                    <form onSubmit={handleAddAnnouncement} className="flex flex-wrap gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Title"
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        className="rounded-sm border border-white/15 bg-[#09090B] px-3 py-2 text-xs text-[#F5F4F0]"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Announcement message..."
                        value={annMessage}
                        onChange={(e) => setAnnMessage(e.target.value)}
                        className="flex-1 min-w-[200px] rounded-sm border border-white/15 bg-[#09090B] px-3 py-2 text-xs text-[#F5F4F0]"
                      />
                      <button
                        type="submit"
                        className="rounded-sm bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#09090B]"
                      >
                        Publish
                      </button>
                    </form>
                    <ul className="divide-y divide-white/10 text-xs">
                      {announcements.map((a) => (
                        <li key={a.id} className="flex items-center justify-between py-3">
                          <div>
                            <span className="font-semibold text-[#D4AF37]">{a.title}: </span>
                            <span className="text-[#E4E4E7]">{a.message}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(a.id)}
                            className="text-red-400 hover:underline"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
