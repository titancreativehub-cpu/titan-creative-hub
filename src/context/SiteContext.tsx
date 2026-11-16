import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Announcement, Course, Ebook, SiteSettings } from '../types';

interface SiteContextValue {
  courses: Course[];
  ebooks: Ebook[];
  siteSettings: SiteSettings;
  announcements: Announcement[];
  loadingCatalog: boolean;
  catalogError: string | null;
  refreshCatalog: () => Promise<void>;
  currentPath: string;
  navigate: (to: string) => void;
}

const FALLBACK_SETTINGS: SiteSettings = {
  siteName: 'TITAN CREATIVE HUB ™',
  tagline: 'Executive Digital Academy & Publishing House',
  heroHeadline: 'Learn Skills. Build Knowledge. Create Your Future.',
  heroSubheadline:
    'TITAN CREATIVE HUB ™ equips ambitious creators, engineers, and founders with studio-grade video masterclasses and actionable digital monographs.',
  logoUrl: '/assets/aistudio/file_00000000a75c81f4bafa4969df26d660_4a777f1e.png',
  whatsappNumber: '+1239043130575',
  businessEmail: 'titancreativehub@gmail.com',
  address: 'Victoria Island, Lagos · Global Digital Campus',
  updatedAt: '',
};

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(FALLBACK_SETTINGS);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname + window.location.search);

  const navigate = useCallback((to: string) => {
    if (to === currentPath) return;
    window.history.pushState({}, '', to);
    setCurrentPath(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPath]);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const refreshCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError(null);
    try {
      const resp = await fetch('/api/catalog');
      if (!resp.ok) throw new Error('Unable to load TITAN CREATIVE HUB ™ catalog.');
      const data = await resp.json();
      setCourses(data.courses || []);
      setEbooks(data.ebooks || []);
      if (data.siteSettings) setSiteSettings(data.siteSettings);
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : 'Catalog load error');
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  return (
    <SiteContext.Provider
      value={{
        courses,
        ebooks,
        siteSettings,
        announcements,
        loadingCatalog,
        catalogError,
        refreshCatalog,
        currentPath,
        navigate,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside SiteProvider');
  return ctx;
}
