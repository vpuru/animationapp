import { track } from '@vercel/analytics/server';

export const trackEvent = {
  // Error tracking - server-side version
  errorOccurred: (error: string, context?: string, metadata?: Record<string, string | number>) => {
    track('Error Occurred', { error, ...(context && { context }), ...metadata });
  },

  // Feature usage tracking - server-side version  
  featureUsed: (feature: string, metadata?: Record<string, string | number>) => {
    track('Feature Used', { feature, ...metadata });
  },

  // Image processing events - server-side version
  imageProcessingStarted: (uuid: string) => {
    track('Image Processing Started', { uuid });
  },

  imageProcessingCompleted: (metadata?: { uuid?: string; processingTime?: number }) => {
    track('Image Processing Completed', metadata);
  },

  imageProcessingError: (error: string, uuid?: string) => {
    track('Image Processing Error', { error, ...(uuid && { uuid }) });
  }
};