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
export declare const uploadEbookBuffer: (fileBuffer: Buffer, options: EbookUploadOptions) => Promise<EbookUploadResult>;
export declare const deleteEbookFromCloudinary: (publicId: string) => Promise<void>;
export declare const generateEbookDownloadUrl: (publicId: string, format: string, ttlSeconds?: number) => EbookDownloadInfo;
//# sourceMappingURL=uploadService.d.ts.map