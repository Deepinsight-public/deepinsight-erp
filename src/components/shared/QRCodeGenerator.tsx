import { useState, useEffect, useRef } from 'react';
import { Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QRCodeGeneratorProps {
  value?: string;
  size?: number;
  title?: string;
  onGenerate?: (value: string) => void;
}

export function QRCodeGenerator({
  value = '',
  size = 200,
  title = 'QR Code Generator',
  onGenerate,
}: QRCodeGeneratorProps) {
  const [inputValue, setInputValue] = useState(value);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock QR code generation (in real implementation, you'd use a library like qrcode)
  const generateQRCode = (text: string) => {
    if (!text.trim()) {
      setQrCodeDataUrl(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);

    // Draw mock QR code pattern
    ctx.fillStyle = 'black';
    const cellSize = size / 25; // 25x25 grid

    // Draw mock QR pattern
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        // Create a pseudo-random pattern based on the text and position
        const hash = text.charCodeAt(0) || 1;
        const shouldFill = ((i + j + hash) * 7) % 3 === 0;
        
        if (shouldFill) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    setQrCodeDataUrl(dataUrl);
  };

  const handleGenerate = () => {
    generateQRCode(inputValue);
    onGenerate?.(inputValue);
  };

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (value) {
      setInputValue(value);
      generateQRCode(value);
    }
  }, [value, size]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="qr-text">Text or URL</Label>
          <Input
            id="qr-text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter text or URL to generate QR code"
          />
        </div>

        <Button onClick={handleGenerate} className="w-full">
          Generate QR Code
        </Button>

        {qrCodeDataUrl ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="border rounded-lg p-4 bg-white">
                <img
                  src={qrCodeDataUrl}
                  alt="Generated QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        ) : (
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Enter text above to generate QR code
              </p>
            </div>
          </div>
        )}

        {/* Hidden canvas for QR code generation */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />
      </CardContent>
    </Card>
  );
}