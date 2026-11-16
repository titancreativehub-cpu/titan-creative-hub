import React, { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext';

export const DEFAULT_APP_LOGO =
  '/assets/aistudio/file_00000000a75c81f4bafa4969df26d660_4a777f1e.png';

export function TitanLogo({ className = 'w-9 h-9' }: { className?: string }) {
  const { siteSettings } = useSite();
  const logoSrc = siteSettings.logoUrl?.trim() || DEFAULT_APP_LOGO;
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [logoSrc]);

  if (!imgFailed && logoSrc) {
    return (
      <img
        src={logoSrc}
        alt={`${siteSettings.siteName} logo`}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${className} rounded-sm border border-[#D4AF37]/30 bg-black object-contain`}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="36" height="36" rx="2" stroke="#D4AF37" strokeWidth="1.5" />
      <path d="M10 13H30M20 13V29" stroke="#D4AF37" strokeWidth="2" strokeLinecap="square" />
      <path d="M13 21H27" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity="0.65" />
    </svg>
  );
}
