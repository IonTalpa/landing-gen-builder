import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import sharp from 'sharp';
import { config } from './config';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

export interface UploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  stripExif?: boolean;
}

export interface UploadResult {
  path: string;
  url: string;
  size: number;
  originalName: string;
  mimeType: string;
}

export class FileUploadError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FileUploadError';
  }
}

export async function ensureUploadDirectory(projectSlug: string): Promise<string> {
  const uploadDir = path.join(config.uploads.dir, projectSlug);
  
  try {
    await access(uploadDir);
  } catch {
    await mkdir(uploadDir, { recursive: true });
  }
  
  return uploadDir;
}

export function generateFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `${name}-${timestamp}-${random}${ext}`.toLowerCase();
}

export function validateFile(file: File, options: UploadOptions = {}): void {
  const {
    maxSize = config.uploads.maxSize,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  } = options;

  if (file.size > maxSize) {
    throw new FileUploadError(
      `File size ${formatFileSize(file.size)} exceeds maximum allowed size ${formatFileSize(maxSize)}`,
      'FILE_TOO_LARGE'
    );
  }

  if (!allowedTypes.includes(file.type)) {
    throw new FileUploadError(
      `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      'INVALID_FILE_TYPE'
    );
  }
}

export async function stripExifData(buffer: Buffer, mimeType: string): Promise<Buffer> {
  // Skip EXIF stripping for SVG files
  if (mimeType === 'image/svg+xml') {
    return buffer;
  }

  try {
    // Use sharp to process the image and remove EXIF data
    const processedBuffer = await sharp(buffer)
      .withoutEnlargement()
      .rotate() // This applies any EXIF rotation and removes the EXIF data
      .toBuffer();
    
    return processedBuffer;
  } catch (error) {
    console.warn('Failed to strip EXIF data, using original buffer:', error);
    return buffer;
  }
}

export async function saveUploadedFile(
  file: File,
  projectSlug: string,
  type: 'logo' | 'hero' | 'gallery',
  options: UploadOptions = {}
): Promise<UploadResult> {
  validateFile(file, options);

  const uploadDir = await ensureUploadDirectory(projectSlug);
  const fileName = generateFileName(file.name);
  const filePath = path.join(uploadDir, fileName);
  const relativePath = path.join(projectSlug, fileName);

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  // Strip EXIF data if required
  if (options.stripExif !== false) {
    buffer = await stripExifData(buffer, file.type);
  }

  // Save file to disk
  await writeFile(filePath, buffer);

  return {
    path: relativePath,
    url: `/uploads/${relativePath}`,
    size: buffer.length,
    originalName: file.name,
    mimeType: file.type,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isSVGFile(mimeType: string): boolean {
  return mimeType === 'image/svg+xml';
}

// Helper to clean up old files
export async function deleteFile(relativePath: string): Promise<void> {
  try {
    const fullPath = path.join(config.uploads.dir, relativePath);
    await fs.promises.unlink(fullPath);
  } catch (error) {
    console.warn('Failed to delete file:', error);
  }
}