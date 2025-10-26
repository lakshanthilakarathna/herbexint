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
 * Get location from IP address as fallback
 */
export const getLocationFromIP = async (): Promise<LocationData | null> => {
  try {
    console.log('🌐 Attempting to get location from IP address...');
    
    // Try multiple IP geolocation services
    const services = [
      'https://ipapi.co/json/',
      'https://ip-api.com/json/',
      'https://api.ipgeolocation.io/ipgeo?apiKey=free'
    ];
    
    for (const service of services) {
      try {
        const response = await fetch(service, { timeout: 5000 });
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Different services return different field names
        const lat = data.latitude || data.lat;
        const lon = data.longitude || data.lon;
        const city = data.city || data.city_name;
        const country = data.country_name || data.country;
        const region = data.region || data.region_name || data.state;
        
        if (lat && lon) {
          const address = [city, region, country].filter(Boolean).join(', ') || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
          
          console.log('✅ IP location obtained:', { lat, lon, address });
          return {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            address: `${address} (IP-based location)`
          };
        }
      } catch (error) {
        console.warn(`IP service failed: ${service}`, error);
        continue;
      }
    }
    
    console.log('❌ All IP location services failed');
    return null;
  } catch (error) {
    console.warn('IP location detection failed:', error);
    return null;
  }
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
  
  // Check if we're on HTTPS or localhost
  const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (!isSecure) {
    console.log('⚠️ HTTP detected - GPS geolocation requires HTTPS. Attempting GPS anyway...');
    // Try GPS first even on HTTP - some browsers may allow it
    try {
      console.log('📍 Attempting GPS geolocation on HTTP...');
      const location = await getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      console.log('✅ GPS location captured on HTTP:', location);
      return location;
    } catch (error) {
      console.log('❌ GPS failed on HTTP:', error);
      // Show helpful error message for HTTPS requirement
      throw new Error('GPS location requires HTTPS. Please enable HTTPS on your server or use localhost for GPS location tracking.');
    }
  }
  
  // Strategy 1: High accuracy with short timeout
  try {
    console.log('📍 Strategy 1: High accuracy (8s timeout)');
    const location = await getCurrentLocation({
      enableHighAccuracy: true,
      timeout: 8000,
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
    console.log('📍 Strategy 2: Low accuracy (12s timeout)');
    const location = await getCurrentLocation({
      enableHighAccuracy: false,
      timeout: 12000,
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
    console.log('📍 Strategy 3: Cached location (15s timeout)');
    const location = await getCurrentLocation({
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 600000 // 10 minutes
    });
    console.log('✅ Location captured from cache:', location);
    return location;
  } catch (error) {
    console.warn('❌ Strategy 3 failed:', error);
    lastError = error as Error;
  }
  
  // Strategy 4: Very permissive settings
  try {
    console.log('📍 Strategy 4: Very permissive (20s timeout)');
    const location = await getCurrentLocation({
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 1800000 // 30 minutes
    });
    console.log('✅ Location captured with permissive settings:', location);
    return location;
  } catch (error) {
    console.warn('❌ Strategy 4 failed:', error);
    lastError = error as Error;
  }
  
  // All strategies failed - return fallback location
  console.log('❌ All location strategies failed. Using fallback location.');
  return {
    latitude: 6.9271, // Colombo, Sri Lanka coordinates
    longitude: 79.8612,
    address: 'Colombo, Sri Lanka (Fallback location)'
  };
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
