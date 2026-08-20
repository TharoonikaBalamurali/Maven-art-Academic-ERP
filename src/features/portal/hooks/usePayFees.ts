import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUiStore } from '@/app/state/ui.store';
import { portalService } from '../api/portal.service';
import { portalKeys } from './usePortal';
import { loadRazorpayScript, openRazorpayCheckout } from '../payments/razorpay';
import type { PortalPaymentChannel, PortalPayResult } from '../types';

export interface PayFeesInput {
  amount: number;
  method: PortalPaymentChannel;
  studentName: string;
  email?: string;
}

/**
 * Online fee payment (§ online fee payment).
 *
 * Orchestrates the Razorpay flow: the backend creates the order, Checkout
 * collects the payment (Card / UPI / Netbanking), and the backend verifies the
 * signature and records it — returning the updated balance, which the client
 * displays verbatim (it never marks a payment "done" or recomputes the balance).
 *
 * When no gateway key is configured (this build), it runs the same shape against
 * the mock backend so the flow is fully demonstrable without a real charge.
 */
export function usePayFees() {
  const queryClient = useQueryClient();
  const child = useUiStore((s) => s.selectedStudentId);

  return useMutation<PortalPayResult, Error, PayFeesInput>({
    mutationFn: async ({ amount, method, studentName, email }) => {
      const order = await portalService.createPayOrder(amount, child);

      let razorpayPaymentId: string;
      let razorpaySignature: string;

      if (order.keyId) {
        // Real gateway: open Checkout and wait for the shopper.
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error('Could not reach the payment gateway. Please try again.');
        const resp = await openRazorpayCheckout(order, { channel: method, studentName, email });
        razorpayPaymentId = resp.razorpay_payment_id;
        razorpaySignature = resp.razorpay_signature;
      } else {
        // Sandbox: no real charge; the backend records a demonstration payment.
        razorpayPaymentId = `pay_sandbox_${Date.now()}`;
        razorpaySignature = 'sandbox';
      }

      return portalService.verifyPayment({
        orderId: order.orderId,
        amount,
        method,
        razorpayPaymentId,
        razorpaySignature,
        student: child ?? undefined,
      });
    },
    onSuccess: () => {
      // The balance changed — refresh the fee views and the dashboard summary.
      void queryClient.invalidateQueries({ queryKey: portalKeys.all });
    },
  });
}

/** True when a real Razorpay key is configured; the UI can flag sandbox mode. */
export const RAZORPAY_CONFIGURED = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);
