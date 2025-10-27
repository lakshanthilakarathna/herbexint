import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Camera, MapPin, FileSignature, X, Check } from 'lucide-react';
import { getLocationWithFallback } from '@/lib/locationUtils';
import { 
  optimizeImage, 
  optimizeSignature, 
  validateImageFile, 
  validatePayloadSize, 
  formatBytes 
} from '@/lib/imageOptimization';

interface DeliveryConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (confirmation: {
    timestamp: string;
    location?: {
      latitude: number;
      longitude: number;
      address: string;
    };
    photo?: string;
    signature?: string;
    delivery_notes?: string;
  }) => Promise<void>;
  orderNumber?: string;
}

export const DeliveryConfirmation: React.FC<DeliveryConfirmationProps> = ({
  open,
  onClose,
  onConfirm,
  orderNumber
}) => {
  const [location, setLocation] = useState<{latitude: number; longitude: number; address: string} | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Capture GPS Location
  const handleCaptureLocation = async () => {
    setCapturingLocation(true);
    try {
      const loc = await getLocationWithFallback();
      if (loc) {
        setLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address
        });
        toast.success('Location captured!');
      } else {
        toast.error('Could not capture location');
      }
    } catch (error) {
      console.error('Location error:', error);
      toast.error('Failed to capture location');
    } finally {
      setCapturingLocation(false);
    }
  };

  // Capture Photo with comprehensive optimization
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid image file');
      return;
    }

    try {
      toast.info('Optimizing photo...', { duration: 3000 });
      
      // Use comprehensive image optimization
      const result = await optimizeImage(file, {
        maxWidth: 600,        // Smaller max width
        maxHeight: 400,       // Limit height too
        quality: 0.6,        // Lower quality for smaller size
        format: 'jpeg',      // Use JPEG for better compression
        maxSizeKB: 300       // Max 300KB per photo
      });

      setPhoto(result.dataUrl);
      
      // Show optimization results
      toast.success(
        `Photo optimized! ${formatBytes(result.originalSize)} → ${formatBytes(result.optimizedSize)} (${result.compressionRatio.toFixed(1)}% smaller)`,
        { duration: 4000 }
      );
      
    } catch (error) {
      console.error('Photo optimization error:', error);
      toast.error('Failed to optimize photo');
    }
  };

  // Signature Pad Drawing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    setHasSignature(true);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
      }
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Capture signature from canvas (optional) - use optimized compression
      const canvas = canvasRef.current;
      let signatureData = null;
      if (canvas && hasSignature) {
        signatureData = optimizeSignature(canvas, 0.7); // Use optimized signature compression
      }

      // Prepare confirmation data
      const confirmationData = {
        timestamp: new Date().toISOString(),
        location: location || undefined,
        photo: photo || undefined,
        signature: signatureData || undefined,
        delivery_notes: deliveryNotes || undefined
      };

      // Validate payload size before sending
      const payloadValidation = validatePayloadSize(confirmationData, 5000); // 5MB limit
      if (!payloadValidation.valid) {
        toast.error(`Payload too large: ${formatBytes(payloadValidation.size * 1024)}. Please reduce photo/signature size.`);
        setLoading(false);
        return;
      }

      // Log payload size for debugging
      console.log(`Delivery confirmation payload size: ${formatBytes(payloadValidation.size * 1024)}`);

      await onConfirm(confirmationData);

      // Reset form
      setLocation(null);
      setPhoto(null);
      setSignature(null);
      setDeliveryNotes('');
      setHasSignature(false);
      clearSignature();
      onClose();
    } catch (error) {
      console.error('Confirmation error:', error);
      toast.error('Failed to confirm delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setLocation(null);
    setPhoto(null);
    setSignature(null);
    setDeliveryNotes('');
    setHasSignature(false);
    clearSignature();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Delivery</DialogTitle>
          <DialogDescription>
            Record delivery confirmation for order {orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Location */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              Delivery Location
            </Label>
            {location ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Location:</strong> {location.address}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                </p>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleCaptureLocation}
                disabled={capturingLocation}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {capturingLocation ? 'Capturing Location...' : 'Capture GPS Location'}
              </Button>
            )}
          </div>

          {/* Photo */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Camera className="w-4 h-4" />
              Delivery Photo
            </Label>
            {photo ? (
              <div className="relative">
                <img src={photo} alt="Delivery" className="w-full h-48 object-cover rounded-lg border" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setPhoto(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Photo
                </Button>
              </div>
            )}
          </div>

          {/* Signature */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <FileSignature className="w-4 h-4" />
              Customer Signature (Optional) {hasSignature && <Check className="w-4 h-4 text-green-600" />}
            </Label>
            <div className="border rounded-lg bg-white">
              <canvas
                ref={canvasRef}
                width={300}
                height={80}
                className="w-full border-b cursor-crosshair"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
              {hasSignature && (
                <div className="p-2 flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={clearSignature}>
                    Clear Signature
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Customer signature is optional - have customer sign above if needed</p>
          </div>

          {/* Delivery Notes */}
          <div>
            <Label htmlFor="delivery-notes">Delivery Notes (Optional)</Label>
            <Textarea
              id="delivery-notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Any additional notes about the delivery..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? 'Confirming...' : 'Confirm Delivery'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
