/**
 * Comprehensive Image Optimization System
 * Handles compression, resizing, and format conversion for all images
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxSizeKB?: number;
}

export interface OptimizationResult {
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
}

/**
 * Optimize an image file with comprehensive compression
 */
export async function optimizeImage(
  file: File, 
  options: ImageOptimizationOptions = {}
): Promise<OptimizationResult> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.7,
    format = 'jpeg',
    maxSizeKB = 500 // 500KB max
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate optimal dimensions
        let { width, height } = img;
        const aspectRatio = width / height;

        // Resize maintaining aspect ratio
        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels if needed
        let currentQuality = quality;
        let dataUrl = canvas.toDataURL(`image/${format}`, currentQuality);
        
        // Check if size is acceptable, reduce quality if needed
        while (currentQuality > 0.3 && getDataUrlSize(dataUrl) > maxSizeKB * 1024) {
          currentQuality -= 0.1;
          dataUrl = canvas.toDataURL(`image/${format}`, currentQuality);
        }

        const originalSize = file.size;
        const optimizedSize = getDataUrlSize(dataUrl);
        const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

        resolve({
          dataUrl,
          originalSize,
          optimizedSize,
          compressionRatio,
          dimensions: { width, height }
        });

      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get the size of a data URL in bytes
 */
function getDataUrlSize(dataUrl: string): number {
  // Remove data URL prefix to get base64 data
  const base64 = dataUrl.split(',')[1];
  if (!base64) return 0;
  
  // Calculate size: base64 is ~4/3 the size of binary data
  return (base64.length * 3) / 4;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate if an image file is acceptable
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size (10MB max before optimization)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
}

/**
 * Create a thumbnail version of an image
 */
export async function createThumbnail(
  file: File,
  size: number = 150
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate thumbnail dimensions (square)
      const { width, height } = img;
      const aspectRatio = width / height;
      
      let thumbWidth = size;
      let thumbHeight = size;
      
      if (aspectRatio > 1) {
        thumbHeight = size / aspectRatio;
      } else {
        thumbWidth = size * aspectRatio;
      }

      canvas.width = thumbWidth;
      canvas.height = thumbHeight;

      ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      
      resolve(thumbnail);
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      reject(new Error('Failed to create thumbnail'));
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Optimize signature canvas data
 */
export function optimizeSignature(canvas: HTMLCanvasElement, quality: number = 0.8): string {
  // Create a smaller canvas for compression
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) return canvas.toDataURL('image/jpeg', quality);

  // Reduce size by 50% for compression
  tempCanvas.width = canvas.width * 0.5;
  tempCanvas.height = canvas.height * 0.5;
  
  tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
  
  return tempCanvas.toDataURL('image/jpeg', quality);
}

/**
 * Check if payload size is acceptable for API
 */
export function validatePayloadSize(data: any, maxSizeKB: number = 8000): { valid: boolean; size: number; error?: string } {
  const jsonString = JSON.stringify(data);
  const size = new Blob([jsonString]).size;
  const sizeKB = size / 1024;
  
  if (sizeKB > maxSizeKB) {
    return {
      valid: false,
      size: sizeKB,
      error: `Payload size ${formatBytes(size)} exceeds limit of ${formatBytes(maxSizeKB * 1024)}`
    };
  }
  
  return { valid: true, size: sizeKB };
}
