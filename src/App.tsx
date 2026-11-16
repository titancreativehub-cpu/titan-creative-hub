import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { SiteProvider, useSite } from './context/SiteContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import { HomePage } from './pages/HomePage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { EbooksPage } from './pages/EbooksPage';
import { EbookDetailPage } from './pages/EbookDetailPage';
import {
  ForgotPasswordPage,
  LoginPage,
  ProfilePage,
  RegisterPage,
} from './pages/AuthPages';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { VideoPlayerPage } from './pages/VideoPlayerPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PaymentCallbackPage } from './pages/PaymentCallbackPage';
import { PolicyPage } from './pages/PolicyPage';

function AppRouter() {
  const { currentPath } = useSite();
  const cleanPath = currentPath.split('?')[0].replace(/\/+$/, '') || '/';

  const renderPage = () => {
    if (cleanPath === '/') return <HomePage />;
    if (cleanPath === '/courses') return <CoursesPage />;
    if (cleanPath.startsWith('/courses/')) {
      return <CourseDetailPage courseId={cleanPath.replace('/courses/', '')} />;
    }
    if (cleanPath === '/ebooks') return <EbooksPage />;
    if (cleanPath.startsWith('/ebooks/')) {
      return <EbookDetailPage ebookId={cleanPath.replace('/ebooks/', '')} />;
    }
    if (cleanPath.startsWith('/learn/')) {
      return <VideoPlayerPage courseId={cleanPath.replace('/learn/', '')} />;
    }
    if (cleanPath === '/dashboard') return <StudentDashboardPage />;
    if (cleanPath === '/admin') return <AdminDashboardPage />;
    if (cleanPath === '/login') return <LoginPage />;
    if (cleanPath === '/register') return <RegisterPage />;
    if (cleanPath === '/forgot-password') return <ForgotPasswordPage />;
    if (cleanPath === '/profile') return <ProfilePage />;
    if (cleanPath === '/about') return <AboutPage />;
    if (cleanPath === '/contact') return <ContactPage />;
    if (cleanPath === '/payment/callback') return <PaymentCallbackPage />;
    if (cleanPath === '/policies/privacy') return <PolicyPage type="privacy" />;
    if (cleanPath === '/policies/terms') return <PolicyPage type="terms" />;
    if (cleanPath === '/policies/refund') return <PolicyPage type="refund" />;
    return <HomePage />;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#09090B] text-[#F5F4F0]">
      <Navbar />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <AppRouter />
      </SiteProvider>
    </AuthProvider>
  );
}
