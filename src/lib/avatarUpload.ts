const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const ALLOWED_AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif'
]);

const ALLOWED_AVATAR_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'avif',
  'heic',
  'heif'
]);

const MIME_TYPE_NORMALIZATION: Record<string, string> = {
  'image/jpg': 'image/jpeg'
};

const DEFAULT_MESSAGES = {
  invalidType: 'Invalid file type. Only JPG, PNG, GIF, WebP, AVIF, and HEIC/HEIF are allowed.',
  tooLarge: 'File too large. Maximum size is 5MB.',
  conversionFailed: 'Could not process this image. Please try a JPG or PNG.'
};

export interface AvatarUploadMessages {
  invalidType: string;
  tooLarge: string;
  conversionFailed: string;
}

export interface AvatarPreparationResult {
  ok: boolean;
  file?: File;
  converted?: boolean;
  error?: string;
}

const getFileExtension = (fileName: string): string | undefined => {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : undefined;
};

const normalizeMimeType = (type: string): string | undefined => {
  if (!type) return undefined;
  return MIME_TYPE_NORMALIZATION[type] || type;
};

const isHeicLike = (mimeType?: string, extension?: string): boolean => {
  return mimeType === 'image/heic' || mimeType === 'image/heif' || extension === 'heic' || extension === 'heif';
};

const convertToJpeg = async (file: File): Promise<File> => {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas not supported');
    }
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error('Conversion failed'));
          return;
        }
        resolve(result);
      }, 'image/jpeg', 0.9);
    });
    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'avatar';
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas not supported');
  }
  ctx.drawImage(image, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error('Conversion failed'));
        return;
      }
      resolve(result);
    }, 'image/jpeg', 0.9);
  });

  const baseName = file.name.replace(/\.[^/.]+$/, '') || 'avatar';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
};

export const prepareAvatarFile = async (
  file: File,
  messages: Partial<AvatarUploadMessages> = {}
): Promise<AvatarPreparationResult> => {
  const mergedMessages = { ...DEFAULT_MESSAGES, ...messages };
  const normalizedType = normalizeMimeType(file.type);
  const extension = getFileExtension(file.name || '');

  const isAllowedType = normalizedType ? ALLOWED_AVATAR_MIME_TYPES.has(normalizedType) : false;
  const isAllowedExtension = extension ? ALLOWED_AVATAR_EXTENSIONS.has(extension) : false;

  if (!isAllowedType && !isAllowedExtension) {
    return { ok: false, error: mergedMessages.invalidType };
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: mergedMessages.tooLarge };
  }

  if (isHeicLike(normalizedType, extension)) {
    try {
      const converted = await convertToJpeg(file);
      if (converted.size > MAX_AVATAR_BYTES) {
        return { ok: false, error: mergedMessages.tooLarge };
      }
      return { ok: true, file: converted, converted: true };
    } catch {
      return { ok: false, error: mergedMessages.conversionFailed };
    }
  }

  return { ok: true, file, converted: false };
};

export { MAX_AVATAR_BYTES };
