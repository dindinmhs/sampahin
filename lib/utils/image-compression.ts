// Utility functions for image compression and validation

export interface FileValidationResult {
  valid: boolean;
  message?: string;
  compressed?: File;
}

// Constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB - Final limit after compression
export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50MB - Initial upload limit
export const COMPRESSION_THRESHOLD = 3 * 1024 * 1024; // 3MB
export const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const COMPRESSION_QUALITY = 0.8; // 80% quality
export const MAX_WIDTH = 1920;
export const MAX_HEIGHT = 1080;

/**
 * Compress image file if it's larger than threshold
 * @param file Original image file
 * @param quality Compression quality (0-1)
 * @param maxWidth Maximum width
 * @param maxHeight Maximum height
 * @returns Promise<File> Compressed file
 */
export const compressImage = (
  file: File,
  quality: number = COMPRESSION_QUALITY,
  maxWidth: number = MAX_WIDTH,
  maxHeight: number = MAX_HEIGHT
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      // Resize if image is too large
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }

          // Create new file from blob
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, ".jpg"), // Force JPEG extension
            {
              type: "image/jpeg",
              lastModified: Date.now(),
            }
          );

          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    // Load image
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validate and optionally compress image file
 * @param file Image file to validate
 * @returns Promise<FileValidationResult>
 */
export const validateAndCompressImage = async (
  file: File
): Promise<FileValidationResult> => {
  try {
    // Check file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return {
        valid: false,
        message: "Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.",
      };
    }

    // Check if file is too large for initial upload
    if (file.size > MAX_UPLOAD_SIZE) {
      return {
        valid: false,
        message: `File terlalu besar (${(file.size / 1024 / 1024).toFixed(
          1
        )}MB). Maksimal 50MB untuk upload.`,
      };
    }

    // If file is larger than threshold, compress it
    if (file.size > COMPRESSION_THRESHOLD) {
      console.log(
        `Compressing image: ${(file.size / 1024 / 1024).toFixed(1)}MB -> ...`
      );

      const compressedFile = await compressImage(file);

      console.log(
        `Compression complete: ${(compressedFile.size / 1024 / 1024).toFixed(
          1
        )}MB`
      );

      // Check if compressed file is still too large
      if (compressedFile.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          message: `Gambar terlalu besar bahkan setelah dikompres (${(
            compressedFile.size /
            1024 /
            1024
          ).toFixed(
            1
          )}MB). Silakan gunakan gambar yang lebih kecil atau resolusi lebih rendah.`,
        };
      }

      return {
        valid: true,
        compressed: compressedFile,
        message: `Gambar dikompres dari ${(file.size / 1024 / 1024).toFixed(
          1
        )}MB ke ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`,
      };
    }

    // File is fine as-is
    return {
      valid: true,
      message: `File valid (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    };
  } catch (error) {
    console.error("Error during validation/compression:", error);
    return {
      valid: false,
      message: "Gagal memproses gambar. Silakan coba lagi.",
    };
  }
};

/**
 * Convert file to base64 string
 * @param file File to convert
 * @returns Promise<string> Base64 string (without data URL prefix)
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

/**
 * Format file size to human readable string
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
