import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { missingFirebaseVars } from '../lib/firebase';

export function ConfigBanner({
  title = 'Configuration Required',
  scope = 'firebase',
}: {
  title?: string;
  scope?: 'firebase' | 'paystack' | 'all';
}) {
  const { configStatus } = useAuth();

  const missingItems: string[] = [];
  if (scope === 'firebase' || scope === 'all') {
    if (missingFirebaseVars.length > 0) {
      missingItems.push(...missingFirebaseVars);
    }
    if (configStatus && !configStatus.firebaseAdminConfigured) {
      missingItems.push('FIREBASE_SERVICE_ACCOUNT_JSON');
    }
  }
  if ((scope === 'paystack' || scope === 'all') && configStatus && !configStatus.paystackConfigured) {
    missingItems.push('PAYSTACK_SECRET_KEY (test mode sk_test_...)');
  }
  if (scope === 'all' && configStatus && !configStatus.emailConfigured) {
    missingItems.push('GMAIL_USER & GMAIL_APP_PASSWORD');
  }

  if (missingItems.length === 0) return null;

  return (
    <div className="rounded-sm border border-[#D4AF37]/30 bg-[#121216] p-5 text-sm text-[#E4E4E7]">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />
        <div className="space-y-2">
          <p className="font-semibold text-[#F5F4F0]">{title}</p>
          <p className="text-xs leading-relaxed text-[#A1A1AA]">
            This feature requires real service credentials in your environment configuration (no mock auth or fake payments are enabled). Missing variables:
          </p>
          <ul className="space-y-1 font-mono-tabular text-xs text-[#D4AF37]">
            {missingItems.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
