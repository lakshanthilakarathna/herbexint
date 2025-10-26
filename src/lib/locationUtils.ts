/**
 * Location capture utilities for HERB application
 * Provides robust geolocation handling with proper error management
 * Optimized for both desktop and mobile browsers
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

// Mobile-specific options
const MOBILE_OPTIONS: LocationOptions = {
  enableHighAccuracy: true,
  timeout: 30000, // 30 seconds for mobile (slower GPS)
  maximumAge: 60000 // 1 minute for mobile (more frequent updates)
};

// Desktop options
const DESKTOP_OPTIONS: LocationOptions = {
  enableHighAccuracy: true,
  timeout: 15000, // 15 seconds for desktop
  maximumAge: 300000 // 5 minutes for desktop
};

/**
 * Detect if the current device is mobile
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
         window.innerWidth <= 768;
}

/**
 * Get device-appropriate options
 */
function getDeviceOptions(options: LocationOptions = {}): LocationOptions {
  const deviceOptions = isMobileDevice() ? MOBILE_OPTIONS : DESKTOP_OPTIONS;
  return { ...deviceOptions, ...options };
}

/**
 * Get current location with comprehensive error handling
 * Optimized for mobile and desktop browsers - SIMPLIFIED VERSION
 */
export const getCurrentLocation = (options: LocationOptions = {}): Promise<LocationData> => {
  const opts = getDeviceOptions(options);
  const isMobile = isMobileDevice();
  
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser'));
      return;
    }

    console.log(`🌍 Attempting to get current location... (${isMobile ? 'Mobile' : 'Desktop'})`);
    
    // Simplified approach - just try to get location without permission checks
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('✅ Location obtained successfully:', position.coords);
        const { latitude, longitude } = position.coords;
        
        // Validate coordinates
        if (latitude === 0 && longitude === 0) {
          console.warn('⚠️ Received zero coordinates, this might be a default/fallback location');
        }
        
        try {
          // Try to get address from coordinates (reverse geocoding)
          const address = await getAddressFromCoordinates(latitude, longitude);
          resolve({ latitude, longitude, address });
        } catch (error) {
          console.warn('⚠️ Reverse geocoding failed, using coordinates only:', error);
          resolve({ 
            latitude, 
            longitude, 
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
          });
        }
      },
      (error) => {
        console.log('❌ Geolocation failed:', error.message);
        reject(new Error(error.message));
      },
      opts
    );
  });
};

/**
 * Get address from coordinates using reverse geocoding
 */
async function getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
    {
      headers: {
        'User-Agent': 'HERB-Liquor-Wholesale/1.0'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Reverse geocoding failed');
  }
  
  const data = await response.json();
  return data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/**
 * Analyze geolocation error and provide specific guidance
 * Mobile-optimized error messages
 */
function analyzeGeolocationError(error: GeolocationPositionError, isMobile: boolean = false): { 
  code: number; 
  message: string; 
  suggestion: string 
} {
  const baseMessage = 'Unable to get your location';
  let suggestion = 'Please check your browser settings and try again.';
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      if (isMobile) {
        return {
          code: error.code,
          message: 'Location access denied. Please enable location permissions for this website.',
          suggestion: '1. Tap the location icon in your browser\'s address bar\n2. Select "Allow" or "Always allow"\n3. Refresh the page and try again\n\nIf you don\'t see the location icon, go to your browser settings and enable location access for this website.'
        };
      } else {
        return {
          code: error.code,
          message: 'Location access denied. Please enable location permissions in your browser settings.',
          suggestion: 'Click the location icon in your browser\'s address bar and allow location access, then refresh the page.'
        };
      }
      
    case error.POSITION_UNAVAILABLE:
      if (isMobile) {
        return {
          code: error.code,
          message: 'Location information is unavailable. Please check your device settings.',
          suggestion: '1. Make sure GPS/Location Services is enabled in your device settings\n2. Check that you have a stable internet connection\n3. Try moving to an area with better GPS signal\n4. Restart your browser and try again'
        };
      } else {
        return {
          code: error.code,
          message: 'Location information is unavailable. Please check your GPS/network connection.',
          suggestion: 'Make sure you have a stable internet connection and GPS is enabled on your device.'
        };
      }
      
    case error.TIMEOUT:
      if (isMobile) {
        return {
          code: error.code,
          message: 'Location request timed out. This is common on mobile devices.',
          suggestion: '1. Make sure you\'re in an area with good GPS signal\n2. Try moving to an open area (away from buildings)\n3. Check that Location Services is enabled\n4. Wait a moment and try again'
        };
      } else {
        return {
          code: error.code,
          message: 'Location request timed out. Please try again.',
          suggestion: 'The location request took too long. Please try again in a moment.'
        };
      }
      
    default:
      if (isMobile) {
        return {
          code: error.code,
          message: 'An unknown error occurred while getting your location.',
          suggestion: '1. Make sure Location Services is enabled in your device settings\n2. Check your internet connection\n3. Try refreshing the page\n4. If the problem persists, try using a different browser'
        };
      } else {
        return {
          code: error.code,
          message: 'An unknown error occurred while getting your location.',
          suggestion: 'Please refresh the page and try again. If the problem persists, contact support.'
        };
      }
  }
}

/**
 * Check if geolocation permissions are granted
 */
export const checkLocationPermissions = async (): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> => {
  if (!navigator.permissions) {
    return 'unknown';
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state as 'granted' | 'denied' | 'prompt';
  } catch (error) {
    console.warn('Permission API not supported:', error);
    return 'unknown';
  }
};

/**
 * Mobile-optimized location capture with retry logic
 */
export const getMobileLocation = async (options: LocationOptions = {}): Promise<LocationData | null> => {
  const isMobile = isMobileDevice();
  
  if (!isMobile) {
    // Use regular location capture for desktop
    return await getCurrentLocation(options);
  }
  
  console.log('📱 Using mobile-optimized location capture');
  
  // Try multiple times with different strategies
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📱 Mobile location attempt ${attempt}/${maxRetries}`);
      
      // Use different options for each attempt
      const attemptOptions = {
        ...getDeviceOptions(options),
        timeout: attempt === 1 ? 30000 : attempt === 2 ? 45000 : 60000, // Increasing timeout
        enableHighAccuracy: attempt <= 2 // Try high accuracy first, then fallback
      };
      
      const location = await getCurrentLocation(attemptOptions);
      
      // Validate the location
      if (location.latitude !== 0 && location.longitude !== 0) {
        console.log(`✅ Mobile location captured successfully on attempt ${attempt}`);
        return location;
      } else {
        throw new Error('Invalid location coordinates received');
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(`❌ Mobile location attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retrying
        const waitTime = attempt * 2000; // 2s, 4s, 6s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // All attempts failed
  console.error('❌ All mobile location attempts failed');
  throw lastError || new Error('Unable to get location after multiple attempts');
};

/**
 * Get location with fallback handling - MANDATORY VERSION
 * This version tries multiple strategies and throws errors if location cannot be obtained
 */
export const getLocationWithFallback = async (options: LocationOptions = {}): Promise<LocationData> => {
  console.log('🌍 Attempting to get location (mandatory approach)...');
  
  const isMobile = isMobileDevice();
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  // Strategy 1: High accuracy with short timeout
  try {
    console.log('📍 Strategy 1: High accuracy (10s timeout)');
    const location = await getCurrentLocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
    console.log('✅ Location captured with high accuracy:', location);
    return location;
  } catch (error) {
    console.warn('❌ Strategy 1 failed:', error);
    lastError = error as Error;
  }
  
  // Strategy 2: Low accuracy with medium timeout
  try {
    console.log('📍 Strategy 2: Low accuracy (15s timeout)');
    const location = await getCurrentLocation({
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 300000 // 5 minutes
    });
    console.log('✅ Location captured with low accuracy:', location);
    return location;
  } catch (error) {
    console.warn('❌ Strategy 2 failed:', error);
    lastError = error as Error;
  }
  
  // Strategy 3: Cached location with long timeout
  try {
    console.log('📍 Strategy 3: Cached location (20s timeout)');
    const location = await getCurrentLocation({
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 600000 // 10 minutes
    });
    console.log('✅ Location captured from cache:', location);
    return location;
  } catch (error) {
    console.warn('❌ Strategy 3 failed:', error);
    lastError = error as Error;
  }
  
  // All strategies failed - throw descriptive error
  console.error('❌ All location strategies failed');
  
  if (isMobile) {
    throw new Error('Location is required but could not be obtained. Please:\n1. Enable Location Services in your device settings\n2. Allow location access for this website\n3. Try refreshing the page\n4. Make sure you\'re in an area with good GPS signal');
  } else {
    throw new Error('Location is required but could not be obtained. Please:\n1. Click the location icon in your browser\'s address bar\n2. Select "Allow" for location access\n3. Refresh the page and try again\n4. Make sure your browser supports geolocation');
  }
};

/**
 * Show mobile-specific location permission instructions
 */
export const showMobileLocationInstructions = (): void => {
  const isMobile = isMobileDevice();
  
  if (!isMobile) {
    return;
  }
  
  const instructions = `
📱 Mobile Location Setup Instructions:

1. **Enable Location Services:**
   - Go to your device Settings
   - Find "Privacy & Security" or "Location Services"
   - Make sure Location Services is ON

2. **Enable Browser Location Access:**
   - In your browser, tap the location icon in the address bar
   - Select "Allow" or "Always allow"
   - If you don't see the icon, go to browser settings

3. **For Safari (iPhone/iPad):**
   - Settings > Safari > Location Services > Allow

4. **For Chrome (Android):**
   - Settings > Site Settings > Location > Allow

5. **Refresh the page** after enabling permissions

If you're still having issues, try:
- Moving to an open area with better GPS signal
- Restarting your browser
- Using a different browser
  `;
  
  console.log(instructions);
  
  // You could also show this in a modal or toast
  if (typeof window !== 'undefined' && window.alert) {
    alert(instructions);
  }
};

/**
 * Check if location is likely to work on this device
 */
export const checkLocationCompatibility = (): {
  supported: boolean;
  isMobile: boolean;
  hasGeolocation: boolean;
  hasPermissions: boolean;
  recommendations: string[];
} => {
  const isMobile = isMobileDevice();
  const hasGeolocation = !!navigator.geolocation;
  const hasPermissions = !!navigator.permissions;
  
  const recommendations: string[] = [];
  
  if (!hasGeolocation) {
    recommendations.push('This browser does not support geolocation');
  }
  
  if (isMobile && !hasPermissions) {
    recommendations.push('Permission API not available - location may still work');
  }
  
  if (isMobile) {
    recommendations.push('Make sure Location Services is enabled in device settings');
    recommendations.push('Try moving to an area with better GPS signal');
  }
  
  return {
    supported: hasGeolocation,
    isMobile,
    hasGeolocation,
    hasPermissions,
    recommendations
  };
};
