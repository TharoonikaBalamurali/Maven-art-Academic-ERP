import type { PortalPayOrder, PortalPaymentChannel } from '../types';

/**
 * Razorpay Checkout integration (§ online fee payment).
 *
 * This is the real client-side flow: load the Checkout script, open it against a
 * backend-created order, and resolve with the gateway's response for the backend
 * to verify. It runs only when the backend returned a publishable `keyId`
 * (a real gateway is configured). With no key — the default in this build — the
 * caller uses the sandbox flow instead, so nothing is ever charged here.
 *
 * TBD — BACKEND CONTRACT: order creation and signature verification are backend
 * responsibilities; the secret key never touches the frontend.
 */

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: Record<string, unknown>): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let scriptPromise: Promise<boolean> | null = null;

/** Loads the Checkout script once; resolves false if it cannot load. */
export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<boolean>((resolve) => {
    const el = document.createElement('script');
    el.src = SCRIPT_SRC;
    el.async = true;
    el.onload = () => resolve(true);
    el.onerror = () => resolve(false);
    document.body.appendChild(el);
  });
  return scriptPromise;
}

/**
 * Opens Razorpay Checkout for a backend-created order and resolves with the
 * gateway response, or rejects if the shopper dismisses it. The chosen channel
 * is passed through so the modal opens on Card / UPI / Netbanking.
 */
export function openRazorpayCheckout(
  order: PortalPayOrder,
  opts: { channel: PortalPaymentChannel; studentName: string; email?: string; contact?: string },
): Promise<RazorpayHandlerResponse> {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay is unavailable.'));
      return;
    }
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'Maven Art Academy',
      description: 'Fee payment',
      // Open on the channel the payer chose; all three stay available.
      method: { card: opts.channel === 'card', upi: opts.channel === 'upi', netbanking: opts.channel === 'netbanking' },
      prefill: { name: opts.studentName, email: opts.email, contact: opts.contact },
      theme: { color: '#4f46e5' },
      handler: (response: RazorpayHandlerResponse) => resolve(response),
      modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
    });
    rzp.open();
  });
}
