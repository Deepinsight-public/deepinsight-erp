import { supabase } from '@/integrations/supabase/client';

export interface UploadOptions {
  bucket: string;
  folder: string;
  file: File;
  fileName?: string;
}

export interface SignedUrlResult {
  url: string;
  path: string;
  expiresIn: number;
}

/**
 * Upload file to Supabase Storage with server-side upload
 */
export async function uploadFile({ bucket, folder, file, fileName }: UploadOptions): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const finalFileName = fileName || `${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${finalFileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    return data.path;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Get signed URL for file access (7 days expiration)
 */
export async function getSignedUrl(bucket: string, path: string): Promise<SignedUrlResult> {
  try {
    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      throw error;
    }

    return {
      url: data.signedUrl,
      path,
      expiresIn
    };
  } catch (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }
}

/**
 * Upload multiple files and return signed URLs
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: string,
  folder: string
): Promise<SignedUrlResult[]> {
  try {
    const uploadPromises = files.map(file => 
      uploadFile({ bucket, folder, file })
    );

    const paths = await Promise.all(uploadPromises);

    const signedUrlPromises = paths.map(path => 
      getSignedUrl(bucket, path)
    );

    return await Promise.all(signedUrlPromises);
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Storage bucket constants
 */
export const STORAGE_BUCKETS = {
  SCRAP_PHOTOS: 'scrap-photos',
  DELIVERY_PROOFS: 'delivery-proofs',
  REPAIR_DOCS: 'repair-docs'
} as const;

/**
 * Upload scrap photos
 */
export async function uploadScrapPhotos(files: File[], scrapId: string): Promise<string[]> {
  const results = await uploadMultipleFiles(files, STORAGE_BUCKETS.SCRAP_PHOTOS, scrapId);
  return results.map(result => result.url);
}

/**
 * Upload delivery proof
 */
export async function uploadDeliveryProof(file: File, orderId: string): Promise<string> {
  const path = await uploadFile({
    bucket: STORAGE_BUCKETS.DELIVERY_PROOFS,
    folder: orderId,
    file
  });
  
  const result = await getSignedUrl(STORAGE_BUCKETS.DELIVERY_PROOFS, path);
  return result.url;
}

/**
 * Upload repair document
 */
export async function uploadRepairDocument(file: File, repairId: string): Promise<string> {
  const path = await uploadFile({
    bucket: STORAGE_BUCKETS.REPAIR_DOCS,
    folder: repairId,
    file
  });
  
  const result = await getSignedUrl(STORAGE_BUCKETS.REPAIR_DOCS, path);
  return result.url;
}