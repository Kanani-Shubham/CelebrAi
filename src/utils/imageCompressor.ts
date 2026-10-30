/**
 * imageCompressor.ts
 * Client-side image validation, resizing, and compression utility.
 *
 * Rules:
 * - Max dimensions: 512 × 512
 * - Format: Prefer WebP, fallback to JPEG
 * - Target size: < 300 KB where practical
 * - Supported MIME types: image/jpeg, image/png, image/webp
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface CompressedImageResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB maximum upload
const MAX_DIMENSION = 512;
const TARGET_MAX_BYTES = 300 * 1024; // 300 KB

/**
 * Validates the uploaded file type and size.
 */
export function validateAvatarFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported image format. Please select a JPEG, PNG, or WebP photo.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Image file is too large. Maximum allowed size is 10 MB.',
    };
  }

  return { valid: true };
}

/**
 * Loads a File into an HTMLImageElement safely.
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image. The file may be corrupted.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Encodes canvas to Blob with format fallback.
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), format, quality);
  });
}

/**
 * Resizes and compresses an avatar image:
 * - Fits within 512 × 512 maintaining aspect ratio.
 * - Encodes as WebP if supported, otherwise JPEG.
 * - Progressively optimizes quality if size exceeds 300 KB.
 */
export async function compressAndResizeAvatar(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CompressedImageResult> {
  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file.');
  }

  onProgress?.(15);
  const img = await loadImageFromFile(file);
  onProgress?.(35);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width === 0 || height === 0) {
    throw new Error('Image dimensions could not be determined.');
  }

  // Calculate scaled dimensions (fit inside MAX_DIMENSION × MAX_DIMENSION)
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  // Render to canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create canvas rendering context.');
  }

  // Draw background white for transparent PNGs converted to JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  onProgress?.(65);

  // Try WebP first
  let mimeType = 'image/webp';
  let quality = 0.85;
  let blob = await canvasToBlob(canvas, 'image/webp', quality);

  // If WebP is not supported or failed, fallback to JPEG
  if (!blob || blob.type !== 'image/webp') {
    mimeType = 'image/jpeg';
    quality = 0.82;
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  }

  // If still over target size (300 KB), compress one step further
  if (blob && blob.size > TARGET_MAX_BYTES) {
    quality = 0.72;
    const secondPass = await canvasToBlob(canvas, mimeType, quality);
    if (secondPass && secondPass.size < blob.size) {
      blob = secondPass;
    }
  }

  onProgress?.(90);

  if (!blob) {
    throw new Error('Failed to encode compressed image.');
  }

  onProgress?.(100);

  return {
    blob,
    mimeType: blob.type || mimeType,
    width,
    height,
    originalSize: file.size,
    compressedSize: blob.size,
  };
}

