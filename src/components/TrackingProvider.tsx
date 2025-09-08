"use client";

import { useEffect } from 'react';
import tracking from '@/lib/tracking';

interface TrackingProviderProps {
  children: React.ReactNode;
}

export default function TrackingProvider({ children }: TrackingProviderProps) {
  useEffect(() => {
    const initializeTracking = async () => {
      // Initialize PostHog
      const postHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (postHogKey) {
        tracking.initializePostHog(postHogKey, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
          debug: process.env.NODE_ENV === 'development',
          capture_pageview: false, // We handle page views manually
          autocapture: true, // Enable automatic event capture
        });
      } else {
        console.warn('PostHog key not found. Please set NEXT_PUBLIC_POSTHOG_KEY environment variable.');
      }

      // Initialize Meta Pixel
      const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
      if (metaPixelId) {
        await tracking.initializeMetaPixel(metaPixelId, {
          debug: process.env.NODE_ENV === 'development',
        });
      } else {
        console.warn('Meta Pixel ID not found. Please set NEXT_PUBLIC_META_PIXEL_ID environment variable.');
      }

      // Track initial page load
      const currentPath = window.location.pathname;
      const pageName = getPageName(currentPath);
      
      await tracking.trackPageView({
        page: pageName,
        path: currentPath,
        title: document.title,
        referrer: document.referrer,
      });
    };

    initializeTracking().catch(console.error);
  }, []);

  // Helper function to get readable page names
  const getPageName = (path: string): string => {
    if (path === '/') return 'Landing Page';
    if (path.startsWith('/loading/')) return 'Loading Page';
    if (path.startsWith('/paywall/')) return 'Paywall Page';
    if (path.startsWith('/download/')) return 'Download Page';
    if (path === '/gallery') return 'Gallery Page';
    if (path.startsWith('/auth/')) return 'Auth Page';
    return path.replace('/', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return <>{children}</>;
}