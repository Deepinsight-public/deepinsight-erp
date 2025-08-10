import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadFile, validateFile, FILE_TYPES, type UploadOptions } from '@/lib/storage';
import { toast } from 'sonner';

interface FileUploadProps {
  bucket: 'scrap-photos' | 'delivery-proofs' | 'repair-docs';
  folder: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onUploadComplete?: (urls: string[]) => void;
  children?: React.ReactNode;
}

export function FileUpload({
  bucket,
  folder,
  accept = 'image/*',
  multiple = false,
  maxSize = 10,
  onUploadComplete,
  children
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const successUrls: string[] = [];

    try {
      for (const file of files) {
        // Validate file
        let allowedTypes: string[] = [];
        if (accept === 'image/*') {
          allowedTypes = FILE_TYPES.IMAGES;
        } else if (accept === '.pdf,application/pdf') {
          allowedTypes = FILE_TYPES.DOCUMENTS;
        }

        const validation = validateFile(file, maxSize, allowedTypes);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`);
          continue;
        }

        // Upload file
        const uploadOptions: UploadOptions = {
          bucket,
          folder,
          fileName: file.name,
          file
        };

        const result = await uploadFile(uploadOptions);
        if (result.success && result.signedUrl) {
          successUrls.push(result.signedUrl);
          toast.success(`${file.name} uploaded successfully`);
        } else {
          toast.error(`Failed to upload ${file.name}: ${result.error}`);
        }
      }

      if (successUrls.length > 0) {
        const newUrls = [...uploadedUrls, ...successUrls];
        setUploadedUrls(newUrls);
        onUploadComplete?.(newUrls);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={uploading}
          className="flex-1"
        />
        {children}
      </div>

      {uploading && (
        <div className="text-sm text-muted-foreground">
          Uploading files...
        </div>
      )}

      {uploadedUrls.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files:</h4>
          <div className="grid gap-2">
            {uploadedUrls.map((url, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  File {index + 1}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}