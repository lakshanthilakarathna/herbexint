/**
 * Location capture utilities for HERB application
 * Provides robust geolocation handling with proper error management
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

const DEFAULT_OPTIONS: LocationOptions = {
  enableHighAccuracy: true,
  timeout: 15000, // 15 seconds
  maximumAge: 300000 // 5 minutes
};

/**
 * Get current location with comprehensive error handling
 */
export const getCurrentLocation = (options: LocationOptions = {}): Promise<LocationData> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser'));
      return;
    }

    console.log('🌍 Attempting to get current location...');
    
    // Try to get location directly
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('✅ Location obtained successfully:', position.coords);
        const { latitude, longitude } = position.coords;
        
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
        console.log('❌ Geolocation failed, analyzing error...');
        
        // Analyze the error and provide specific guidance
        const errorInfo = analyzeGeolocationError(error);
        console.log('🔍 Error analysis:', errorInfo);
        
        reject(new Error(errorInfo.message));
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
 */
function analyzeGeolocationError(error: GeolocationPositionError): { 
  code: number; 
  message: string; 
  suggestion: string 
} {
  const baseMessage = 'Unable to get your location';
  let suggestion = 'Please check your browser settings and try again.';
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        code: error.code,
        message: 'Location access denied. Please enable location permissions in your browser settings.',
        suggestion: 'Click the location icon in your browser\'s address bar and allow location access, then refresh the page.'
      };
      
    case error.POSITION_UNAVAILABLE:
      return {
        code: error.code,
        message: 'Location information is unavailable. Please check your GPS/network connection.',
        suggestion: 'Make sure you have a stable internet connection and GPS is enabled on your device.'
      };
      
    case error.TIMEOUT:
      return {
        code: error.code,
        message: 'Location request timed out. Please try again.',
        suggestion: 'The location request took too long. Please try again in a moment.'
      };
      
    default:
      return {
        code: error.code,
        message: 'An unknown error occurred while getting your location.',
        suggestion: 'Please refresh the page and try again. If the problem persists, contact support.'
      };
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
 * Get location with fallback handling
 */
export const getLocationWithFallback = async (options: LocationOptions = {}): Promise<LocationData | null> => {
  try {
    return await getCurrentLocation(options);
  } catch (error) {
    console.warn('Location capture failed:', error);
    
    // Check permissions to provide better error message
    const permissionState = await checkLocationPermissions();
    
    if (permissionState === 'denied') {
      throw new Error('Location access denied. Please enable location permissions in your browser settings and refresh the page.');
    }
    
    // Re-throw the original error
    throw error;
  }
};
