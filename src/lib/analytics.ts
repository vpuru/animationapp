import { track } from '@vercel/analytics';
import tracking from './tracking';

export const trackEvent = {
  // Upload flow events
  uploadPhoto: (metadata?: { fileSize?: number; fileType?: string; fileExtension?: string }) => {
    track('Photo Upload Started', metadata);
    tracking.trackUploadButtonClick(metadata);
  },

  uploadSuccess: (metadata?: { processingTime?: number; fileSize?: number }) => {
    track('Photo Upload Success', metadata);
    tracking.trackUploadSuccess(metadata);
  },

  uploadError: (error: string) => {
    track('Photo Upload Error', { error });
    tracking.trackCustomEvent('upload_error', { error });
  },

  // Image processing events
  imageProcessingStarted: (uuid: string) => {
    track('Image Processing Started', { uuid });
    tracking.trackProcessing('processing_started', { uuid });
  },

  imageProcessingCompleted: (metadata?: { uuid?: string; processingTime?: number }) => {
    track('Image Processing Completed', metadata);
    if (metadata?.uuid) {
      tracking.trackProcessing('processing_completed', { 
        uuid: metadata.uuid, 
        processingTime: metadata.processingTime 
      });
    }
  },

  imageProcessingError: (error: string, uuid?: string) => {
    track('Image Processing Error', { error, ...(uuid && { uuid }) });
    tracking.trackCustomEvent('processing_error', { error, ...(uuid && { uuid }) });
  },

  // Payment flow events
  paymentInitiated: (metadata?: { amount?: number; currency?: string; uuid?: string; paymentMethod?: string }) => {
    track('Payment Initiated', metadata);
    // Use the new deduplication method for InitiateCheckout
    if (metadata?.uuid) {
      tracking.fireInitiateCheckoutOnce(metadata.uuid, {
        amount: metadata.amount,
        currency: metadata.currency,
        paymentMethod: metadata.paymentMethod
      });
    }
  },

  paymentSuccess: (metadata?: { amount?: number; currency?: string; paymentMethod?: string; uuid?: string }) => {
    track('Payment Success', metadata);
    // Use enhanced purchase tracking with proper parameters
    tracking.trackPurchaseEnhanced({
      amount: metadata?.amount,
      currency: metadata?.currency,
      paymentMethod: metadata?.paymentMethod,
      uuid: metadata?.uuid
    });
  },

  paymentError: (error: string, uuid?: string) => {
    track('Payment Error', { error, ...(uuid && { uuid }) });
    tracking.trackCustomEvent('payment_error', { error, ...(uuid && { uuid }) });
  },

  // Download events
  downloadStarted: (uuid: string, format?: string) => {
    track('Download Started', { uuid, ...(format && { format }) });
    tracking.trackCustomEvent('download_started', { uuid, ...(format && { format }) });
  },

  downloadCompleted: (uuid: string, format?: string) => {
    track('Download Completed', { uuid, ...(format && { format }) });
    tracking.trackDownload({ uuid, format });
  },

  // User engagement events
  pageView: (page: string, metadata?: Record<string, string | number>) => {
    track('Page View', { page, ...metadata });
    tracking.trackPageView({ page, ...metadata });
  },

  featureUsed: (feature: string, metadata?: Record<string, string | number>) => {
    track('Feature Used', { feature, ...metadata });
    tracking.trackCustomEvent('feature_used', { feature, ...metadata });
  },

  // Error tracking
  errorOccurred: (error: string, context?: string, metadata?: Record<string, string | number>) => {
    track('Error Occurred', { error, ...(context && { context }), ...metadata });
    tracking.trackCustomEvent('error_occurred', { error, ...(context && { context }), ...metadata });
  }
};