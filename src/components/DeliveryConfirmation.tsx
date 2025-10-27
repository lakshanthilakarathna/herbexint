import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Camera, MapPin, X, Check } from 'lucide-react';
import { getLocationWithFallback } from '@/lib/locationUtils';
import { 
  optimizeImage, 
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
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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


  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Prepare confirmation data
      const confirmationData = {
        timestamp: new Date().toISOString(),
        location: location || undefined,
        photo: photo || undefined,
        delivery_notes: deliveryNotes || undefined
      };

      // Validate payload size before sending
      const payloadValidation = validatePayloadSize(confirmationData, 5000); // 5MB limit
      if (!payloadValidation.valid) {
        toast.error(`Payload too large: ${formatBytes(payloadValidation.size * 1024)}. Please reduce photo size.`);
        setLoading(false);
        return;
      }

      // Log payload size for debugging
      console.log(`Delivery confirmation payload size: ${formatBytes(payloadValidation.size * 1024)}`);

      await onConfirm(confirmationData);

      // Reset form
      setLocation(null);
      setPhoto(null);
      setDeliveryNotes('');
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
    setDeliveryNotes('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Delivery</DialogTitle>
          <DialogDescription>
            Record delivery confirmation for order {orderNumber}. The delivery location will be sent with the order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Location */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              Order Delivery Location
            </Label>
            {location ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Delivery Location:</strong> {location.address}
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
                {capturingLocation ? 'Capturing Location...' : 'Capture Delivery Location'}
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
