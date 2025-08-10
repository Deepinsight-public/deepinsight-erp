import { supabase } from '@/integrations/supabase/client';

export interface UploadResult {
  success: boolean;
  url?: string;
  signedUrl?: string;
  path?: string;
  error?: string;
}

export interface UploadOptions {
  bucket: 'scrap-photos' | 'delivery-proofs' | 'repair-docs';
  folder: string; // e.g., scrap ID, repair ID, etc.
  fileName: string;
  file: File;
}

/**
 * Upload file to Supabase storage with 7-day signed URL
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  try {
    const { bucket, folder, fileName, file } = options;
    
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${timestamp}_${fileName}`;
    const filePath = `${folder}/${uniqueFileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Generate 7-day signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 7 * 24 * 60 * 60); // 7 days in seconds

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      return { success: false, error: signedUrlError.message };
    }

    return {
      success: true,
      url: data.path,
      signedUrl: signedUrlData.signedUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Upload multiple files and return array of results
 */
export async function uploadMultipleFiles(files: UploadOptions[]): Promise<UploadResult[]> {
  const results = await Promise.all(files.map(uploadFile));
  return results;
}

/**
 * Get signed URL for existing file (7-day expiry)
 */
export async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 7 * 24 * 60 * 60); // 7 days

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Helper function to extract file path from signed URL
 */
export function extractFilePathFromUrl(signedUrl: string): string | null {
  try {
    const url = new URL(signedUrl);
    const pathParts = url.pathname.split('/');
    // Remove '/storage/v1/object/sign/' and bucket name
    const bucketIndex = pathParts.findIndex(part => part === 'sign');
    if (bucketIndex >= 0 && bucketIndex + 2 < pathParts.length) {
      return pathParts.slice(bucketIndex + 2).join('/');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate file type and size
 */
export function validateFile(file: File, maxSizeMB: number = 10, allowedTypes: string[] = []): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  // Check file type if specified
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Common file type presets
 */
export const FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALL: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};