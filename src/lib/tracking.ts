import posthog from 'posthog-js'

// Types for event properties
interface BaseEventProps {
  [key: string]: string | number | boolean | undefined | null
}

interface UserProperties {
  userId?: string
  email?: string
  name?: string
  [key: string]: string | number | boolean | undefined | null
}

interface PageViewProps extends BaseEventProps {
  page: string
  path?: string
  title?: string
  referrer?: string
}

interface UploadProps extends BaseEventProps {
  fileSize?: number
  fileType?: string
  fileExtension?: string
}

interface ProcessingProps extends BaseEventProps {
  uuid: string
  stage?: string
  processingTime?: number
}

interface PaymentProps extends BaseEventProps {
  uuid?: string
  amount?: number
  currency?: string
  paymentMethod?: string
}

interface DownloadProps extends BaseEventProps {
  uuid: string
  format?: string
}

class TrackingManager {
  private isPostHogInitialized = false
  private isMetaPixelInitialized = false
  private currentUser: UserProperties | null = null

  // Initialize PostHog
  initializePostHog(apiKey: string, options?: Record<string, unknown>) {
    try {
      if (typeof window !== 'undefined' && !this.isPostHogInitialized) {
        posthog.init(apiKey, {
          api_host: 'https://us.posthog.com',
          loaded: (posthogInstance) => {
            console.log('PostHog loaded', posthogInstance)
          },
          capture_pageview: false, // We'll handle page views manually
          ...options
        })
        this.isPostHogInitialized = true
        console.log('PostHog initialized successfully')
      }
    } catch (error) {
      console.error('Failed to initialize PostHog:', error)
    }
  }

  // Initialize Meta Pixel
  async initializeMetaPixel(pixelId: string, options?: Record<string, unknown>) {
    try {
      if (typeof window !== 'undefined' && !this.isMetaPixelInitialized) {
        const { default: ReactPixel } = await import('react-facebook-pixel')
        ReactPixel.init(pixelId, undefined, {
          autoConfig: true,
          debug: process.env.NODE_ENV === 'development',
          ...options
        })
        this.isMetaPixelInitialized = true
        console.log('Meta Pixel initialized successfully')
      }
    } catch (error) {
      console.error('Failed to initialize Meta Pixel:', error)
    }
  }

  // Identify user across both platforms
  async identify(userId: string, properties?: UserProperties) {
    this.currentUser = { userId, ...properties }
    
    try {
      if (this.isPostHogInitialized && typeof window !== 'undefined') {
        posthog.identify(userId, properties)
      }
    } catch (error) {
      console.error('PostHog identify failed:', error)
    }

    try {
      if (this.isMetaPixelInitialized && typeof window !== 'undefined') {
        // Meta Pixel doesn't have a direct identify method, but we can set user data
        const { default: ReactPixel } = await import('react-facebook-pixel')
        ReactPixel.fbq('track', 'User', properties)
      }
    } catch (error) {
      console.error('Meta Pixel user tracking failed:', error)
    }
  }

  // Reset user identification (for logout)
  reset() {
    this.currentUser = null
    
    try {
      if (this.isPostHogInitialized && typeof window !== 'undefined') {
        posthog.reset()
      }
    } catch (error) {
      console.error('PostHog reset failed:', error)
    }
  }

  // Track page views
  async trackPageView(props: PageViewProps) {
    console.log('Tracking page view:', props)
    
    try {
      if (this.isPostHogInitialized && typeof window !== 'undefined') {
        posthog.capture('$pageview', {
          $current_url: window.location.href,
          ...props
        })
      }
    } catch (error) {
      console.error('PostHog page view failed:', error)
    }

    try {
      if (this.isMetaPixelInitialized && typeof window !== 'undefined') {
        const { default: ReactPixel } = await import('react-facebook-pixel')
        ReactPixel.pageView()
        ReactPixel.track('PageView', props)
      }
    } catch (error) {
      console.error('Meta Pixel page view failed:', error)
    }
  }

  // Track upload button click
  async trackUploadButtonClick(props?: UploadProps) {
    console.log('Tracking upload button click:', props)
    
    try {
      if (this.isPostHogInitialized && typeof window !== 'undefined') {
        posthog.capture('upload_button_clicked', props)
      }
    } catch (error) {
      console.error('PostHog upload button click failed:', error)
    }

    try {
      if (this.isMetaPixelInitialized && typeof window !== 'undefined') {
        const { default: ReactPixel } = await import('react-facebook-pixel')
        ReactPixel.track('InitiateCheckout', props)
      }
    } catch (error) {
      console.error('Meta Pixel upload button click failed:', error)
    }
  }

  // Track upload success
  async trackUploadSuccess(props?: UploadProps) {
    console.log('Tracking upload success:', props)
    
    try {
      if (this.isPostHogInitialized && typeof window !== 'undefined') {
        posthog.capture('upload_success', props)
      }
    } catch (error) {
      console.error('PostHog upload success failed:', error)
    }

    try {
      if (this.isMetaPixelInitialized && typeof window !== 'undefined') {
        const { default: ReactPixel } = await import('react-facebook-pixel')
        ReactPixel.track('CompleteRegistration', props)
      }
    } catch (error) {
      console.error('Meta Pixel upload success failed:', error)
    }
  }

  // Track processing events
  async trackProcessing(eventName: string, props: ProcessingProps) {
    console.log('Tracking processing event:', eventName, props)
    
    try {
      if (this.isPostHogInitialized && typeof window !== 'undefined') {
        posthog.capture(eventName, props)
      }
    } catch (error) {
      console.error('PostHog processing event failed:', error)
    }

    try {
      if (this.isMetaPixelInitialized && typeof window !== 'undefined') {
        // Map processing events to Meta Pixel events
        const { default: ReactPixel } = await import('react-facebook-pixel')
        if (eventName === 'processing_started') {
          ReactPixel.trackCustom('ProcessingStarted', props)
        } else if (eventName === 'processing_completed') {
          ReactPixel.trackCustom('ProcessingCompleted', props)
        }
      }
    } catch (error) {
      console.error('Meta Pixel processing event failed:', error)
    }
  }

  // Track paywall views
  async trackPaywallView(props?: BaseEventProps) {
    console.log('Tracking paywall view:', props)
    
    try {
      if (this.isPostHogInitialized && typeof window !== 'undefined') {
        posthog.capture('paywall_viewed', props)
      }
    } catch (error) {
      console.error('PostHog paywall view failed:', error)
    }

    try {
      if (this.isMetaPixelInitialized && typeof window !== 'undefined') {
        const { default: ReactPixel } = await import('react-facebook-pixel')
        ReactPixel.track('ViewContent', props)
      }
    } catch (error) {
      console.error('Meta Pixel paywall view failed:', error)
    }
  }

  // Track checkout initiation
  async trackCheckoutInitiated(props?: PaymentProps) {
    console.log('Tracking checkout initiated:', props)
    
    try {
      if (this.isPostHogInitialized && typeof window !== 'undefined') {
        posthog.capture('checkout_initiated', props)
      }
    } catch (error) {
      console.error('PostHog checkout initiated failed:', error)
    }

    try {
      if (this.isMetaPixelInitialized && typeof window !== 'undefined') {
        const { default: ReactPixel } = await import('react-facebook-pixel')
        ReactPixel.track('InitiateCheckout', {
          value: props?.amount,
          currency: props?.currency || 'USD',
          ...props
        })
      }
    } catch (error) {
      console.error('Meta Pixel checkout initiated failed:', error)
    }
  }

  // Track successful purchase
  async trackPurchase(props?: PaymentProps) {
    console.log('Tracking purchase:', props)
    
    try {
      if (this.isPostHogInitialized && typeof window !== 'undefined') {
        posthog.capture('purchase_completed', props)
      }
    } catch (error) {
      console.error('PostHog purchase failed:', error)
    }

    try {
      if (this.isMetaPixelInitialized && typeof window !== 'undefined') {
        const { default: ReactPixel } = await import('react-facebook-pixel')
        ReactPixel.track('Purchase', {
          value: props?.amount,
          currency: props?.currency || 'USD',
          ...props
        })
      }
    } catch (error) {
      console.error('Meta Pixel purchase failed:', error)
    }
  }

  // Track downloads
  async trackDownload(props: DownloadProps) {
    console.log('Tracking download:', props)
    
    try {
      if (this.isPostHogInitialized && typeof window !== 'undefined') {
        posthog.capture('download_completed', props)
      }
    } catch (error) {
      console.error('PostHog download failed:', error)
    }

    try {
      if (this.isMetaPixelInitialized && typeof window !== 'undefined') {
        const { default: ReactPixel } = await import('react-facebook-pixel')
        ReactPixel.trackCustom('Download', props)
      }
    } catch (error) {
      console.error('Meta Pixel download failed:', error)
    }
  }

  // Generic custom event tracking
  async trackCustomEvent(eventName: string, props?: BaseEventProps) {
    console.log('Tracking custom event:', eventName, props)
    
    try {
      if (this.isPostHogInitialized && typeof window !== 'undefined') {
        posthog.capture(eventName, props)
      }
    } catch (error) {
      console.error('PostHog custom event failed:', error)
    }

    try {
      if (this.isMetaPixelInitialized && typeof window !== 'undefined') {
        const { default: ReactPixel } = await import('react-facebook-pixel')
        ReactPixel.trackCustom(eventName, props)
      }
    } catch (error) {
      console.error('Meta Pixel custom event failed:', error)
    }
  }

  // Get current user info
  getCurrentUser() {
    return this.currentUser
  }

  // Check if tracking is initialized
  isInitialized() {
    return {
      posthog: this.isPostHogInitialized,
      metaPixel: this.isMetaPixelInitialized
    }
  }
}

// Create singleton instance
const tracking = new TrackingManager()

export default tracking

// Export types for use in other files
export type {
  BaseEventProps,
  UserProperties,
  PageViewProps,
  UploadProps,
  ProcessingProps,
  PaymentProps,
  DownloadProps
}