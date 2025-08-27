import { track } from '@vercel/analytics';

export const trackEvent = {
  // Upload flow events
  uploadPhoto: (metadata?: { fileSize?: number; fileType?: string; fileExtension?: string }) => {
    track('Photo Upload Started', metadata);
  },

  uploadSuccess: (metadata?: { processingTime?: number; fileSize?: number }) => {
    track('Photo Upload Success', metadata);
  },

  uploadError: (error: string) => {
    track('Photo Upload Error', { error });
  },

  // Image processing events
  imageProcessingStarted: (uuid: string) => {
    track('Image Processing Started', { uuid });
  },

  imageProcessingCompleted: (metadata?: { uuid?: string; processingTime?: number }) => {
    track('Image Processing Completed', metadata);
  },

  imageProcessingError: (error: string, uuid?: string) => {
    track('Image Processing Error', { error, ...(uuid && { uuid }) });
  },

  // Payment flow events
  paymentInitiated: (metadata?: { amount?: number; currency?: string; uuid?: string }) => {
    track('Payment Initiated', metadata);
  },

  paymentSuccess: (metadata?: { amount?: number; currency?: string; paymentMethod?: string; uuid?: string }) => {
    track('Payment Success', metadata);
  },

  paymentError: (error: string, uuid?: string) => {
    track('Payment Error', { error, ...(uuid && { uuid }) });
  },

  // Download events
  downloadStarted: (uuid: string, format?: string) => {
    track('Download Started', { uuid, ...(format && { format }) });
  },

  downloadCompleted: (uuid: string, format?: string) => {
    track('Download Completed', { uuid, ...(format && { format }) });
  },

  // User engagement events
  pageView: (page: string, metadata?: Record<string, string | number>) => {
    track('Page View', { page, ...metadata });
  },

  featureUsed: (feature: string, metadata?: Record<string, string | number>) => {
    track('Feature Used', { feature, ...metadata });
  },

  // Error tracking
  errorOccurred: (error: string, context?: string, metadata?: Record<string, string | number>) => {
    track('Error Occurred', { error, ...(context && { context }), ...metadata });
  }
};