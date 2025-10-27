import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { testGeolocationAvailability } from '@/lib/locationUtils';

interface GPSStatusProps {
  onStatusChange?: (status: 'checking' | 'available' | 'unavailable' | 'error') => void;
  showTestButton?: boolean;
}

export const GPSStatus: React.FC<GPSStatusProps> = ({ 
  onStatusChange, 
  showTestButton = false 
}) => {
  const [status, setStatus] = useState<'checking' | 'available' | 'unavailable' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const checkGPSStatus = async () => {
    setStatus('checking');
    setErrorMessage('');
    onStatusChange?.('checking');

    try {
      const result = await testGeolocationAvailability();
      
      if (result.available) {
        setStatus('available');
        onStatusChange?.('available');
      } else {
        setStatus('unavailable');
        setErrorMessage(result.error || 'GPS not available');
        onStatusChange?.('unavailable');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      onStatusChange?.('error');
    }
  };

  const handleTestGPS = async () => {
    setIsTesting(true);
    await checkGPSStatus();
    setIsTesting(false);
  };

  useEffect(() => {
    checkGPSStatus();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Clock className="w-4 h-4 animate-spin" />;
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'unavailable':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking GPS...';
      case 'available':
        return 'GPS Available';
      case 'unavailable':
        return 'GPS Unavailable';
      case 'error':
        return 'GPS Error';
      default:
        return 'GPS Status';
    }
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'available':
        return 'default';
      case 'unavailable':
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getStatusVariant()} className="flex items-center gap-1">
        {getStatusIcon()}
        {getStatusText()}
      </Badge>
      
      {showTestButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestGPS}
          disabled={isTesting}
          className="text-xs"
        >
          {isTesting ? 'Testing...' : 'Test GPS'}
        </Button>
      )}
      
      {errorMessage && (
        <div className="text-xs text-red-600 max-w-xs">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
