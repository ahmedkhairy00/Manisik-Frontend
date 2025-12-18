/**
 * Validates if the file is a valid image type
 * @param file The file to validate
 * @returns Object indicating validity and potential error message
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Accept all common image formats - they will be converted to WebP anyway
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'image/x-icon'
  ];

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please select a valid image file (JPEG, PNG, WebP, GIF, BMP, etc.)'
    };
  }

  // Check extension - accept common image extensions
  const name = file.name.toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.tif', '.svg', '.ico'];
  const hasValidExtension = validExtensions.some(ext => name.endsWith(ext));

  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'Invalid file extension. Please upload an image file.'
    };
  }

  // Max size 5MB
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File is too large. Maximum size is 5MB.' };
  }

  return { valid: true };
}

/**
 * Converts an image file to WebP format
 * @param file The input image file
 * @param quality Quality of the output WebP image (0 to 1)
 * @returns Promise resolving to the new WebP File object
 */
export function convertImageToWebP(file: File, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image to canvas
        ctx.drawImage(img, 0, 0);

        // Convert to WebP blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new File from Blob
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
