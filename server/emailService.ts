import nodemailer from 'nodemailer';
import { OFFICIAL_BUSINESS_EMAIL } from './catalogData.ts';
import type { Order } from '../src/types/index.ts';

export type EmailEventType =
  | 'NEW_ORDER'
  | 'PAYMENT_VERIFIED'
  | 'COURSE_PURCHASED'
  | 'EBOOK_PURCHASED'
  | 'PAYMENT_FAILED'
  | 'REFUND_REQUESTED';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function sendAdminOrderNotification(
  eventType: EmailEventType,
  order: Order
): Promise<'sent' | 'unconfigured' | 'failed'> {
  const transporter = getTransporter();
  if (!transporter) {
    console.info(
      `[Email Service - Unconfigured] Would notify ${OFFICIAL_BUSINESS_EMAIL} (${eventType}) for order ${order.reference}`
    );
    return 'unconfigured';
  }

  const subjectMap: Record<EmailEventType, string> = {
    NEW_ORDER: `[TITAN CREATIVE HUB] New Order Created — ${order.reference}`,
    PAYMENT_VERIFIED: `[TITAN CREATIVE HUB] Payment Verified (PAID) — ${order.reference}`,
    COURSE_PURCHASED: `[TITAN CREATIVE HUB] Course Purchased — ${order.productTitle}`,
    EBOOK_PURCHASED: `[TITAN CREATIVE HUB] Ebook Purchased — ${order.productTitle}`,
    PAYMENT_FAILED: `[TITAN CREATIVE HUB] Payment Failed — ${order.reference}`,
    REFUND_REQUESTED: `[TITAN CREATIVE HUB] Refund Requested — ${order.reference}`,
  };

  const textBody = [
    `TITAN CREATIVE HUB ™ — Order Notification (${eventType})`,
    `--------------------------------------------------`,
    `Customer Name:      ${order.customerName}`,
    `Customer Email:     ${order.customerEmail}`,
    `Product Purchased:  ${order.productTitle} (${order.productType.toUpperCase()})`,
    `Order ID:           ${order.id}`,
    `Order Reference:    ${order.reference}`,
    `Amount:             ${formatNGN(order.amountNGN)}`,
    `Payment Reference:  ${order.paymentReference || 'Pending Paystack Reference'}`,
    `Payment Status:     ${order.status}`,
    order.refundReason ? `Refund Reason:      ${order.refundReason}` : '',
    `Timestamp:          ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join('\n');

  const htmlBody = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background:#09090B; color:#F5F4F0; padding:32px; border:1px solid #27272A;">
      <p style="color:#D4AF37; font-size:12px; letter-spacing:2px; margin:0 0 8px 0;">TITAN CREATIVE HUB ™ · ORDER ALERT</p>
      <h2 style="margin:0 0 20px 0; font-weight:600; color:#F5F4F0;">${subjectMap[eventType]}</h2>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:8px 0; color:#A1A1AA;">Customer Name</td><td style="padding:8px 0; color:#F5F4F0;">${order.customerName}</td></tr>
        <tr><td style="padding:8px 0; color:#A1A1AA;">Customer Email</td><td style="padding:8px 0; color:#F5F4F0;">${order.customerEmail}</td></tr>
        <tr><td style="padding:8px 0; color:#A1A1AA;">Product Purchased</td><td style="padding:8px 0; color:#F5F4F0;">${order.productTitle} (${order.productType})</td></tr>
        <tr><td style="padding:8px 0; color:#A1A1AA;">Order ID</td><td style="padding:8px 0; font-family:monospace; color:#F5F4F0;">${order.id}</td></tr>
        <tr><td style="padding:8px 0; color:#A1A1AA;">Amount</td><td style="padding:8px 0; font-family:monospace; color:#D4AF37;">${formatNGN(order.amountNGN)}</td></tr>
        <tr><td style="padding:8px 0; color:#A1A1AA;">Payment Reference</td><td style="padding:8px 0; font-family:monospace; color:#F5F4F0;">${order.paymentReference || 'N/A'}</td></tr>
        <tr><td style="padding:8px 0; color:#A1A1AA;">Payment Status</td><td style="padding:8px 0; font-weight:600; color:#D4AF37;">${order.status}</td></tr>
        ${order.refundReason ? `<tr><td style="padding:8px 0; color:#A1A1AA;">Refund Reason</td><td style="padding:8px 0; color:#F5F4F0;">${order.refundReason}</td></tr>` : ''}
      </table>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"TITAN CREATIVE HUB ™" <${process.env.GMAIL_USER}>`,
      to: OFFICIAL_BUSINESS_EMAIL,
      subject: subjectMap[eventType],
      text: textBody,
      html: htmlBody,
    });
    return 'sent';
  } catch (err) {
    console.error('Failed to send admin notification email:', err);
    return 'failed';
  }
}

export async function sendCustomerConfirmationEmail(order: Order): Promise<'sent' | 'unconfigured' | 'failed'> {
  const transporter = getTransporter();
  if (!transporter) {
    return 'unconfigured';
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const accessUrl =
    order.productType === 'course' ? `${appUrl}/learn/${order.productId}` : `${appUrl}/dashboard`;

  const htmlBody = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; background:#09090B; color:#F5F4F0; padding:32px; border:1px solid #27272A;">
      <p style="color:#D4AF37; font-size:12px; letter-spacing:2px; margin:0 0 8px 0;">TITAN CREATIVE HUB ™</p>
      <h2 style="margin:0 0 12px 0; color:#F5F4F0;">Order Confirmed — Access Granted</h2>
      <p style="color:#A1A1AA; line-height:1.6;">Hello ${order.customerName}, thank you for your purchase. Your payment has been verified and your digital access is now active.</p>
      <table style="width:100%; border-collapse:collapse; font-size:14px; margin:20px 0;">
        <tr><td style="padding:8px 0; color:#A1A1AA;">Product</td><td style="padding:8px 0; color:#F5F4F0;">${order.productTitle}</td></tr>
        <tr><td style="padding:8px 0; color:#A1A1AA;">Order Reference</td><td style="padding:8px 0; font-family:monospace; color:#F5F4F0;">${order.reference}</td></tr>
        <tr><td style="padding:8px 0; color:#A1A1AA;">Amount Paid</td><td style="padding:8px 0; font-family:monospace; color:#D4AF37;">${formatNGN(order.amountNGN)}</td></tr>
        <tr><td style="padding:8px 0; color:#A1A1AA;">Payment Reference</td><td style="padding:8px 0; font-family:monospace; color:#F5F4F0;">${order.paymentReference || order.reference}</td></tr>
      </table>
      <a href="${accessUrl}" style="display:inline-block; background:#D4AF37; color:#09090B; padding:12px 24px; text-decoration:none; font-weight:600;">Open Student Dashboard</a>
      <p style="margin-top:24px; font-size:12px; color:#71717A;">Need help? Reply to ${OFFICIAL_BUSINESS_EMAIL} or message us on WhatsApp at +1239043130575.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"TITAN CREATIVE HUB ™" <${process.env.GMAIL_USER}>`,
      to: order.customerEmail,
      subject: `Order Confirmed: ${order.productTitle} (${order.reference})`,
      html: htmlBody,
    });
    return 'sent';
  } catch (err) {
    console.error('Failed to send customer confirmation email:', err);
    return 'failed';
  }
}
