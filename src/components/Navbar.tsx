import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { useAuth } from '../context/AuthContext';
import { TitanLogo } from './TitanLogo';

export function Navbar() {
  const { siteSettings, currentPath, navigate } = useSite();
  const { user, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: 'Ebook Store', href: '/ebooks' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    const cleanPath = currentPath.split('?')[0];
    if (href === '/') return cleanPath === '/';
    return cleanPath.startsWith(href);
  };

  const handleNav = (href: string) => {
    setMobileOpen(false);
    navigate(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090B]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('/')}
          className="flex items-center gap-3 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
        >
          <TitanLogo className="w-9 h-9 shrink-0" />
          <span className="font-display text-lg font-semibold tracking-wide text-[#F5F4F0] sm:text-xl whitespace-nowrap">
            {siteSettings.siteName}
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary Navigation">
          {navLinks.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => handleNav(link.href)}
              className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b ${
                isActive(link.href)
                  ? 'text-[#D4AF37] border-[#D4AF37]'
                  : 'text-[#A1A1AA] border-transparent hover:text-[#F5F4F0]'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Auth / Dashboard Action */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {user ? (
            <>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNav('/admin')}
                  className="text-sm font-medium text-[#D4AF37] hover:text-[#E5C158] transition-colors whitespace-nowrap shrink-0"
                >
                  Admin Console
                </button>
              )}
              <button
                type="button"
                onClick={() => handleNav('/dashboard')}
                className="px-4 py-2 text-xs font-semibold tracking-wide text-[#09090B] bg-[#D4AF37] hover:bg-[#E5C158] transition-colors rounded-sm whitespace-nowrap shrink-0"
              >
                Dashboard
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNav('/login')}
                className="text-sm font-medium text-[#F5F4F0] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleNav('/register')}
                className="px-4 py-2 text-xs font-semibold tracking-wide text-[#09090B] bg-[#D4AF37] hover:bg-[#E5C158] transition-colors rounded-sm whitespace-nowrap shrink-0"
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="md:hidden p-2 text-[#F5F4F0] hover:text-[#D4AF37] min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0D0D10] px-4 py-5 space-y-4">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => handleNav(link.href)}
                className={`text-left text-base font-medium py-1.5 ${
                  isActive(link.href) ? 'text-[#D4AF37]' : 'text-[#F5F4F0]'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('/dashboard')}
                  className="w-full py-3 text-sm font-semibold text-[#09090B] bg-[#D4AF37] rounded-sm"
                >
                  Student Dashboard
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleNav('/admin')}
                    className="w-full py-3 text-sm font-semibold text-[#D4AF37] border border-[#D4AF37]/40 rounded-sm"
                  >
                    Admin Dashboard
                  </button>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleNav('/login')}
                  className="py-2.5 text-sm font-medium text-[#F5F4F0] border border-white/15 rounded-sm"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/register')}
                  className="py-2.5 text-sm font-semibold text-[#09090B] bg-[#D4AF37] rounded-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
