import multer from 'multer';
import type { Request } from 'express';

const MAX_EBOOK_FILE_SIZE = Number(process.env.EBOOK_MAX_FILE_SIZE || 50 * 1024 * 1024); // 50MB default
const MAX_COVER_FILE_SIZE = Number(process.env.COVER_MAX_FILE_SIZE || 5 * 1024 * 1024); // 5MB default

const ebookStorage = multer.memoryStorage();
const coverStorage = multer.memoryStorage();

const allowedEbookMimeTypes = ['application/pdf', 'application/epub+zip'];
const allowedCoverMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const ebookFileFilter: multer.Options['fileFilter'] = (_req: Request, file, cb) => {
  if (!allowedEbookMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Chỉ hỗ trợ file PDF hoặc EPUB.'));
  }
  cb(null, true);
};

const coverFileFilter: multer.Options['fileFilter'] = (_req: Request, file, cb) => {
  if (!allowedCoverMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP cho ảnh bìa.'));
  }
  cb(null, true);
};

export const ebookUpload = multer({
  storage: ebookStorage,
  limits: {
    fileSize: MAX_EBOOK_FILE_SIZE,
  },
  fileFilter: ebookFileFilter,
});

export const coverUpload = multer({
  storage: coverStorage,
  limits: {
    fileSize: MAX_COVER_FILE_SIZE,
  },
  fileFilter: coverFileFilter,
});
