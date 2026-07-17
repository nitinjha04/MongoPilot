/**
 * Toast manager — thin wrapper around Sonner for consistent app-wide toasts.
 */

import { toast as sonnerToast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastOptions = {
  description?: string;
  duration?: number;
};

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    sonnerToast.success(message, options),

  error: (message: string, options?: ToastOptions) =>
    sonnerToast.error(message, options),

  info: (message: string, options?: ToastOptions) =>
    sonnerToast.info(message, options),

  warning: (message: string, options?: ToastOptions) =>
    sonnerToast.warning(message, options),

  message: (message: string, options?: ToastOptions) =>
    sonnerToast(message, options),

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};
