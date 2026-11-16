import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const OFFICIAL_WHATSAPP_DISPLAY = '+1239043130575';
export const OFFICIAL_WHATSAPP_DIGITS = '1239043130575';
export const OFFICIAL_EMAIL = 'titancreativehub@gmail.com';

export function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getSupportWhatsAppUrl(customMessage?: string): string {
  const text =
    customMessage ||
    'Hello TITAN CREATIVE HUB, I need assistance with your products and courses.';
  return `https://wa.me/${OFFICIAL_WHATSAPP_DIGITS}?text=${encodeURIComponent(text)}`;
}

export function getCustomerWhatsAppUrl(phoneOrDigits: string, message: string): string {
  const digits = phoneOrDigits.replace(/[^0-9]/g, '');
  if (!digits) return getSupportWhatsAppUrl();
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildOrderWhatsAppUrl(params: {
  customerName: string;
  customerEmail: string;
  productTitle: string;
  reference: string;
  amountNGN: number;
  status: string;
}): string {
  const message = [
    `Hello TITAN CREATIVE HUB ™, I just initiated an order:`,
    `• Customer Name: ${params.customerName}`,
    `• Customer Email: ${params.customerEmail}`,
    `• Product/Course: ${params.productTitle}`,
    `• Order Reference: ${params.reference}`,
    `• Order Amount: ${formatNGN(params.amountNGN)} (NGN)`,
    `• Payment Status: ${params.status}`,
  ].join('\n');
  return `https://wa.me/${OFFICIAL_WHATSAPP_DIGITS}?text=${encodeURIComponent(message)}`;
}

export interface UploadValidationOptions {
  allowedMimePrefixes: string[];
  maxSizeMB: number;
}

export async function uploadFileToStorage(
  file: File,
  storagePath: string,
  options: UploadValidationOptions,
  onProgress: (percent: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  if (!storage) {
    throw new Error('Firebase Storage is not configured. Add VITE_FIREBASE_* keys to enable file uploads.');
  }

  const mimeAllowed = options.allowedMimePrefixes.some((prefix) =>
    prefix.endsWith('/') ? file.type.startsWith(prefix) : file.type === prefix
  );
  if (!mimeAllowed) {
    throw new Error(
      `Unsupported file type (${file.type || 'unknown'}). Allowed: ${options.allowedMimePrefixes.join(', ')}`
    );
  }

  const maxBytes = options.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File exceeds maximum size of ${options.maxSizeMB} MB.`);
  }

  const storageRef = ref(storage, storagePath);
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
  });

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(pct);
      },
      (error) => {
        reject(new Error(error.message || 'Upload failed. Check Firebase Storage permissions.'));
      },
      async () => {
        const downloadUrl = await getDownloadURL(task.snapshot.ref);
        resolve({ downloadUrl, storagePath });
      }
    );
  });
}
