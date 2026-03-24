"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ebookUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const MAX_EBOOK_FILE_SIZE = Number(process.env.EBOOK_MAX_FILE_SIZE || 50 * 1024 * 1024); // 50MB default
const ebookStorage = multer_1.default.memoryStorage();
const allowedEbookMimeTypes = ['application/pdf', 'application/epub+zip'];
const ebookFileFilter = (_req, file, cb) => {
    if (!allowedEbookMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Chỉ hỗ trợ file PDF hoặc EPUB.'));
    }
    cb(null, true);
};
exports.ebookUpload = (0, multer_1.default)({
    storage: ebookStorage,
    limits: {
        fileSize: MAX_EBOOK_FILE_SIZE,
    },
    fileFilter: ebookFileFilter,
});
//# sourceMappingURL=upload.js.map