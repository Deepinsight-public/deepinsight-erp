import { useState, useRef, useEffect } from 'react';
import { Camera, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QRBarcodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  active?: boolean;
  title?: string;
}

export function QRBarcodeScanner({
  onScan,
  onError,
  active = false,
  title = 'QR/Barcode Scanner',
}: QRBarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScanning = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera if available
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
      }
    } catch (err) {
      const errorMessage = 'Failed to access camera. Please grant camera permissions.';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  // Mock scan detection (in real implementation, you'd use a library like @zxing/library)
  const handleVideoClick = () => {
    // Simulate scanning a code
    const mockBarcode = 'SKU123456789';
    onScan(mockBarcode);
    stopScanning();
  };

  useEffect(() => {
    if (active) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [active]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!scanning ? (
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Square className="h-16 w-16 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Camera not active
                </p>
              </div>
            </div>
            <Button 
              onClick={startScanning} 
              className="w-full"
              disabled={!navigator.mediaDevices}
            >
              Start Scanning
            </Button>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover cursor-pointer"
                onClick={handleVideoClick}
              />
              <div className="absolute inset-0 border-2 border-primary border-dashed rounded-lg pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg"></div>
                </div>
              </div>
            </div>
            <Button onClick={stopScanning} variant="outline" className="w-full">
              Stop Scanning
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Point camera at QR code or barcode. Click video to simulate scan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}