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
        let userMessage = 'GPS location failed';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            userMessage = 'Location access denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            userMessage = 'Location unavailable. Please check your GPS signal and try again.';
            break;
          case error.TIMEOUT:
            userMessage = 'Location request timed out. Please try again.';
            break;
          default:
            userMessage = `GPS error: ${error.message}`;
        }
        
        reject(new Error(userMessage));
      },
      opts
    );
  });
};

/**
 * Get location - GPS ONLY, no fallback
 * This function attempts GPS location capture and throws an error if it fails
 */
export const getLocationWithFallback = async (options: LocationOptions = {}): Promise<LocationData | null> => {
  console.log('🌍 Attempting GPS location capture...');
  
  // Check if we're on HTTPS (required for GPS)
  const isSecure = window.location.protocol === 'https:' || 
                   window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';
  
  if (!isSecure) {
    throw new Error('GPS requires HTTPS. Please ensure you\'re using a secure connection (https://) or localhost.');
  }
  
  // Try GPS with high accuracy first
  try {
    console.log('📍 Attempting high accuracy GPS location...');
    const location = await getCurrentLocation({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
    console.log('✅ GPS location captured:', location);
    return location;
  } catch (error) {
    console.warn('❌ High accuracy GPS failed, trying lower accuracy...');
    
    // Try with lower accuracy as fallback
    try {
      const location = await getCurrentLocation({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      });
      console.log('✅ GPS location captured (lower accuracy):', location);
      return location;
    } catch (secondError) {
      console.error('❌ GPS location failed completely:', secondError);
      throw new Error('Failed to get GPS location. Please ensure location services are enabled and try again.');
    }
  }
};

/**
 * Test geolocation availability and permissions
 */
export const testGeolocationAvailability = (): Promise<{available: boolean, error?: string}> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ available: false, error: 'Geolocation not supported' });
      return;
    }

    // Modern browsers support geolocation over HTTP if permissions are granted
    // Only check for HTTPS if we're not in a secure context
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isSecureContext && !isLocalhost) {
      // Try anyway - modern browsers may still allow it
      console.log('⚠️ Not a secure context, but attempting geolocation anyway...');
    }

    // Try to get current position with minimal options
    navigator.geolocation.getCurrentPosition(
      () => resolve({ available: true }),
      (error) => {
        console.log('Geolocation error details:', error);
        let errorMessage = 'Unknown error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission denied - Please allow location access in browser settings';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position unavailable - Please check your GPS signal';
            break;
          case error.TIMEOUT:
            errorMessage = 'Request timeout - Please try again';
            break;
          default:
            errorMessage = `Error code ${error.code}: ${error.message}`;
        }
        resolve({ available: false, error: errorMessage });
      },
      { timeout: 5000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  });
};

/**
 * Simple test function to manually trigger geolocation
 */
export const testLocationManually = (): Promise<LocationData | null> => {
  return new Promise(async (resolve) => {
    console.log('🧪 Manual location test starting...');
    
    // Check if we're on HTTP
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      console.log('⚠️ HTTP detected in test - attempting GPS geolocation...');
      try {
        const location = await getCurrentLocation({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
        console.log('✅ GPS location captured on HTTP:', location);
        resolve(location);
        return;
      } catch (error) {
        console.log('❌ GPS failed on HTTP:', error);
        resolve(null);
        return;
      }
    }
    
    if (!navigator.geolocation) {
      console.log('❌ Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('✅ Manual test successful:', position.coords);
        try {
          const address = await getAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: address
          });
        } catch (error) {
          console.log('⚠️ Reverse geocoding failed, using coordinates');
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          });
        }
      },
      (error) => {
        console.log('❌ Manual test failed:', error);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        console.log('Full error object:', JSON.stringify(error, null, 2));
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
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
