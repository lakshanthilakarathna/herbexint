/**
 * Location utilities for GPS capture and reverse geocoding
 * Provides automatic location capture for orders and visits
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Check if the current device is mobile
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Get device-specific geolocation options
 */
export const getDeviceOptions = (options: LocationOptions = {}): LocationOptions => {
  const isMobile = isMobileDevice();
  
  return {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? (isMobile ? 15000 : 10000),
    maximumAge: options.maximumAge ?? (isMobile ? 300000 : 60000), // 5 min mobile, 1 min desktop
    ...options
  };
};

/**
 * Get address from coordinates using reverse geocoding
 */
export const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    const data = await response.json();
    
    if (data.display_name) {
      return data.display_name;
    } else {
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

/**
 * Get current location with comprehensive error handling
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
 * Get location with fallback handling - tries multiple strategies
 */
export const getLocationWithFallback = async (options: LocationOptions = {}): Promise<LocationData | null> => {
  console.log('🌍 Attempting to get location with fallback strategies...');
  
  const isMobile = isMobileDevice();
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
  
  // All strategies failed
  console.log('❌ All location strategies failed');
  return null;
};

/**
 * Analyze geolocation error and provide user-friendly message
 */
export const analyzeGeolocationError = (error: GeolocationPositionError): string => {
  const isMobile = isMobileDevice();
  
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return isMobile 
        ? 'Location access denied. Please enable Location Services in your device settings and allow location access for this website.'
        : 'Location access denied. Please click the location icon in your browser\'s address bar and select "Allow".';
    
    case error.POSITION_UNAVAILABLE:
      return 'Location information is unavailable. Please check your GPS signal and try again.';
    
    case error.TIMEOUT:
      return 'Location request timed out. Please try again or check your internet connection.';
    
    default:
      return 'An unknown error occurred while getting your location.';
  }
};
