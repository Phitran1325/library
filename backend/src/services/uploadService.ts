import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary';

export type EbookFormat = 'PDF' | 'EPUB';

export interface EbookUploadOptions {
  format: EbookFormat;
  fileName?: string;
}

export interface EbookUploadResult {
  publicId: string;
  url: string;
  size: number;
  format: string;
}

export interface EbookDownloadInfo {
  url: string;
  expiresIn: number;
  expiresAt: number;
}

export interface ImageUploadOptions {
  fileName?: string;
}

export interface ImageUploadResult {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

const EBOOK_FOLDER = process.env.CLOUDINARY_EBOOK_FOLDER || 'ebooks';
const COVER_FOLDER = process.env.CLOUDINARY_COVER_FOLDER || 'book_covers';
const DEFAULT_DOWNLOAD_TTL = Number(process.env.EBOOK_DOWNLOAD_TTL || 300); // seconds

export const uploadEbookBuffer = (
  fileBuffer: Buffer,
  options: EbookUploadOptions
): Promise<EbookUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'authenticated',
        folder: EBOOK_FOLDER,
        format: options.format.toLowerCase(),
        use_filename: true,
        unique_filename: true,
        filename_override: options.fileName,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          return reject(error);
        }

        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          size: result.bytes,
          format: result.format,
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

export const uploadCoverImageBuffer = (
  fileBuffer: Buffer,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: COVER_FOLDER,
        use_filename: true,
        unique_filename: true,
        filename_override: options.fileName,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          return reject(error);
        }

        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width || 0,
          height: result.height || 0,
          format: result.format,
          size: result.bytes,
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

export const deleteEbookFromCloudinary = async (publicId: string) => {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', type: 'authenticated' });
};

export const generateEbookDownloadUrl = (
  publicId: string,
  format: string,
  ttlSeconds: number = DEFAULT_DOWNLOAD_TTL
): EbookDownloadInfo => {
  const expiresIn = ttlSeconds > 0 ? ttlSeconds : DEFAULT_DOWNLOAD_TTL;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  const url = cloudinary.utils.private_download_url(publicId, format.toLowerCase(), {
    resource_type: 'raw',
    type: 'authenticated',
    expires_at: expiresAt,
  });

  return { url, expiresIn, expiresAt };
};
