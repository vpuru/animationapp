/**
 * Dimension utilities for handling aspect ratios and OpenAI size selection
 * Provides robust algorithms for image dimension analysis and optimization
 */

import { trackEvent } from '@/lib/analytics-server';

// TypeScript interfaces for dimension handling
export interface Dimensions {
  width: number;
  height: number;
}

export interface AspectRatioInfo {
  ratio: number;
  category: 'square' | 'landscape' | 'portrait';
  isExtreme: boolean;
  confidence: number; // How confident we are in the categorization (0-1)
}

export interface OpenAISizeDecision {
  size: '1024x1024' | '1536x1024' | '1024x1536';
  reasoning: string;
  inputRatio: number;
  targetRatio: number;
  confidence: number;
}

// Constants for OpenAI's supported dimensions
export const OPENAI_SIZES = {
  SQUARE: '1024x1024' as const,
  LANDSCAPE: '1536x1024' as const,
  PORTRAIT: '1024x1536' as const,
} as const;

export const ASPECT_RATIOS = {
  SQUARE: 1.0,
  LANDSCAPE: 1536 / 1024, // 1.5
  PORTRAIT: 1024 / 1536,  // ~0.67
} as const;

// Configuration constants
const DEFAULT_TOLERANCE = 0.1; // 10% tolerance for aspect ratio matching
const EXTREME_RATIO_THRESHOLD = 2.0; // Ratios above this are considered extreme
const MIN_VALID_DIMENSION = 1;
const MAX_REASONABLE_DIMENSION = 10000;

/**
 * Validates that dimensions are valid and reasonable
 * Handles all edge cases: zero, negative, NaN, extreme sizes
 */
export const validateDimensions = (dimensions: Dimensions): void => {
  const { width, height } = dimensions;

  // Check for invalid numbers
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(`Invalid dimensions: width=${width}, height=${height}. Must be finite numbers.`);
  }

  // Check for non-positive dimensions
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid dimensions: width=${width}, height=${height}. Must be positive integers.`);
  }

  // Check for unreasonably large dimensions
  if (width > MAX_REASONABLE_DIMENSION || height > MAX_REASONABLE_DIMENSION) {
    throw new Error(`Dimensions too large: ${width}x${height}. Maximum supported: ${MAX_REASONABLE_DIMENSION}x${MAX_REASONABLE_DIMENSION}.`);
  }

  // Check for suspiciously small dimensions
  if (width < MIN_VALID_DIMENSION || height < MIN_VALID_DIMENSION) {
    throw new Error(`Dimensions too small: ${width}x${height}. Minimum supported: ${MIN_VALID_DIMENSION}x${MIN_VALID_DIMENSION}.`);
  }
};

/**
 * Calculates aspect ratio and provides detailed analysis
 * Includes confidence scoring and extreme ratio detection
 */
export const calculateAspectRatio = (dimensions: Dimensions, tolerance: number = DEFAULT_TOLERANCE): AspectRatioInfo => {
  validateDimensions(dimensions);
  
  const { width, height } = dimensions;
  const ratio = width / height;
  
  // Calculate distances to standard ratios
  const squareDistance = Math.abs(ratio - ASPECT_RATIOS.SQUARE);
  const landscapeDistance = Math.abs(ratio - ASPECT_RATIOS.LANDSCAPE);
  const portraitDistance = Math.abs(ratio - ASPECT_RATIOS.PORTRAIT);
  
  // Find the closest standard ratio
  const minDistance = Math.min(squareDistance, landscapeDistance, portraitDistance);
  let category: AspectRatioInfo['category'];
  let confidence: number;
  
  if (minDistance === squareDistance) {
    category = 'square';
    confidence = Math.max(0, 1 - (squareDistance / tolerance));
  } else if (minDistance === landscapeDistance) {
    category = 'landscape';
    confidence = Math.max(0, 1 - (landscapeDistance / tolerance));
  } else {
    category = 'portrait';
    confidence = Math.max(0, 1 - (portraitDistance / tolerance));
  }
  
  // Check for extreme ratios
  const isExtreme = ratio > EXTREME_RATIO_THRESHOLD || ratio < (1 / EXTREME_RATIO_THRESHOLD);
  
  // If it's extreme, lower confidence
  if (isExtreme) {
    confidence *= 0.7; // Reduce confidence for extreme ratios
  }
  
  return {
    ratio,
    category,
    isExtreme,
    confidence: Math.min(1, Math.max(0, confidence))
  };
};

/**
 * Handles extreme aspect ratios with special logic
 * Provides fallback strategies for panoramic, ultrawide, etc.
 */
export const handleExtremeRatios = (dimensions: Dimensions): OpenAISizeDecision => {
  const { width, height } = dimensions;
  const ratio = width / height;
  
  // Ultra-wide (panoramic landscape)
  if (ratio > 2.5) {
    return {
      size: OPENAI_SIZES.LANDSCAPE,
      reasoning: `Ultra-wide ratio ${ratio.toFixed(2)}:1 mapped to landscape. Image will be cropped/padded.`,
      inputRatio: ratio,
      targetRatio: ASPECT_RATIOS.LANDSCAPE,
      confidence: 0.6
    };
  }
  
  // Ultra-tall (vertical panoramic)
  if (ratio < 0.4) {
    return {
      size: OPENAI_SIZES.PORTRAIT,
      reasoning: `Ultra-tall ratio ${ratio.toFixed(2)}:1 mapped to portrait. Image will be cropped/padded.`,
      inputRatio: ratio,
      targetRatio: ASPECT_RATIOS.PORTRAIT,
      confidence: 0.6
    };
  }
  
  // Standard extreme ratios - choose closest
  if (ratio > 2.0) {
    return {
      size: OPENAI_SIZES.LANDSCAPE,
      reasoning: `Wide ratio ${ratio.toFixed(2)}:1 mapped to landscape as closest match.`,
      inputRatio: ratio,
      targetRatio: ASPECT_RATIOS.LANDSCAPE,
      confidence: 0.8
    };
  }
  
  if (ratio < 0.5) {
    return {
      size: OPENAI_SIZES.PORTRAIT,
      reasoning: `Tall ratio ${ratio.toFixed(2)}:1 mapped to portrait as closest match.`,
      inputRatio: ratio,
      targetRatio: ASPECT_RATIOS.PORTRAIT,
      confidence: 0.8
    };
  }
  
  // Fallback - shouldn't reach here
  return {
    size: OPENAI_SIZES.SQUARE,
    reasoning: `Extreme ratio ${ratio.toFixed(2)}:1 defaulted to square as fallback.`,
    inputRatio: ratio,
    targetRatio: ASPECT_RATIOS.SQUARE,
    confidence: 0.3
  };
};

/**
 * Main algorithm: determines optimal OpenAI size based on input dimensions
 * Handles all edge cases and provides detailed reasoning
 */
export const determineOptimalOpenAISize = (
  dimensions: Dimensions,
  tolerance: number = DEFAULT_TOLERANCE
): OpenAISizeDecision => {
  try {
    // Validate input dimensions
    validateDimensions(dimensions);
    
    // Calculate aspect ratio with analysis
    const aspectInfo = calculateAspectRatio(dimensions, tolerance);
    
    // Handle extreme ratios with special logic
    if (aspectInfo.isExtreme) {
      const extremeDecision = handleExtremeRatios(dimensions);
      logDimensionDecision(dimensions, extremeDecision, aspectInfo);
      return extremeDecision;
    }
    
    // Standard ratio handling based on category
    let decision: OpenAISizeDecision;
    
    switch (aspectInfo.category) {
      case 'square':
        decision = {
          size: OPENAI_SIZES.SQUARE,
          reasoning: `Square-like ratio ${aspectInfo.ratio.toFixed(2)}:1 (confidence: ${(aspectInfo.confidence * 100).toFixed(0)}%)`,
          inputRatio: aspectInfo.ratio,
          targetRatio: ASPECT_RATIOS.SQUARE,
          confidence: aspectInfo.confidence
        };
        break;
        
      case 'landscape':
        decision = {
          size: OPENAI_SIZES.LANDSCAPE,
          reasoning: `Landscape ratio ${aspectInfo.ratio.toFixed(2)}:1 (confidence: ${(aspectInfo.confidence * 100).toFixed(0)}%)`,
          inputRatio: aspectInfo.ratio,
          targetRatio: ASPECT_RATIOS.LANDSCAPE,
          confidence: aspectInfo.confidence
        };
        break;
        
      case 'portrait':
        decision = {
          size: OPENAI_SIZES.PORTRAIT,
          reasoning: `Portrait ratio ${aspectInfo.ratio.toFixed(2)}:1 (confidence: ${(aspectInfo.confidence * 100).toFixed(0)}%)`,
          inputRatio: aspectInfo.ratio,
          targetRatio: ASPECT_RATIOS.PORTRAIT,
          confidence: aspectInfo.confidence
        };
        break;
        
      default:
        // Fallback (should never reach here)
        decision = {
          size: OPENAI_SIZES.SQUARE,
          reasoning: `Unknown category fallback to square for ratio ${aspectInfo.ratio.toFixed(2)}:1`,
          inputRatio: aspectInfo.ratio,
          targetRatio: ASPECT_RATIOS.SQUARE,
          confidence: 0.1
        };
    }
    
    // Log the decision for debugging and analytics
    logDimensionDecision(dimensions, decision, aspectInfo);
    
    return decision;
    
  } catch (error) {
    // Error handling - return safe fallback
    const errorMessage = error instanceof Error ? error.message : 'Unknown dimension error';
    console.error('Dimension analysis error:', errorMessage);
    
    // Track error in analytics
    trackEvent.errorOccurred(`Dimension analysis failed: ${errorMessage}`, 'dimensionUtils');
    
    // Return safe fallback
    const fallbackDecision: OpenAISizeDecision = {
      size: OPENAI_SIZES.SQUARE,
      reasoning: `Error in dimension analysis, defaulting to square. Error: ${errorMessage}`,
      inputRatio: 1.0,
      targetRatio: ASPECT_RATIOS.SQUARE,
      confidence: 0.0
    };
    
    return fallbackDecision;
  }
};

/**
 * Logs dimension decisions for debugging and analytics
 * Provides detailed information about the decision-making process
 */
export const logDimensionDecision = (
  inputDimensions: Dimensions,
  decision: OpenAISizeDecision,
  aspectInfo: AspectRatioInfo
): void => {
  const logData = {
    input: `${inputDimensions.width}x${inputDimensions.height}`,
    inputRatio: decision.inputRatio.toFixed(3),
    category: aspectInfo.category,
    isExtreme: aspectInfo.isExtreme,
    confidence: (aspectInfo.confidence * 100).toFixed(1) + '%',
    selectedSize: decision.size,
    targetRatio: decision.targetRatio.toFixed(3),
    reasoning: decision.reasoning
  };
  
  console.log(`[DIMENSION] ${JSON.stringify(logData)}`);
  
  // Track in analytics for monitoring
  trackEvent.featureUsed('Dimension Analysis', {
    inputDimensions: `${inputDimensions.width}x${inputDimensions.height}`,
    selectedSize: decision.size,
    category: aspectInfo.category,
    confidence: Math.round(aspectInfo.confidence * 100),
    isExtreme: aspectInfo.isExtreme ? 'true' : 'false'
  });
};

/**
 * Utility function to get basic dimension category
 * Simplified version for quick categorization
 */
export const getDimensionCategory = (dimensions: Dimensions): 'square' | 'landscape' | 'portrait' => {
  const aspectInfo = calculateAspectRatio(dimensions);
  return aspectInfo.category;
};

/**
 * Utility function to check if dimensions represent an extreme aspect ratio
 */
export const isExtremeAspectRatio = (dimensions: Dimensions): boolean => {
  const aspectInfo = calculateAspectRatio(dimensions);
  return aspectInfo.isExtreme;
};