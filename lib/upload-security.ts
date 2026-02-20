const MAGIC_SIGNATURES: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/jpeg": [
    [0xff, 0xd8, 0xff, 0xe0],
    [0xff, 0xd8, 0xff, 0xe1],
    [0xff, 0xd8, 0xff, 0xe8],
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF....WEBP (validated separately)
};

const MIME_TO_ALLOWED_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/webp": ["webp"],
};

function startsWithBytes(buffer: Buffer, signature: number[]) {
  if (buffer.length < signature.length) {
    return false;
  }
  for (let i = 0; i < signature.length; i += 1) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }
  return true;
}

function isLikelyWebp(buffer: Buffer) {
  if (buffer.length < 12) {
    return false;
  }
  const riff = buffer.subarray(0, 4).toString("ascii");
  const webp = buffer.subarray(8, 12).toString("ascii");
  return riff === "RIFF" && webp === "WEBP";
}

export function isAllowedExtensionForMime(mimeType: string, extension: string) {
  const allowed = MIME_TO_ALLOWED_EXTENSIONS[mimeType] || [];
  return allowed.includes(extension.toLowerCase());
}

export function validateFileSignature(mimeType: string, buffer: Buffer) {
  const signatures = MAGIC_SIGNATURES[mimeType];
  if (!signatures) {
    return false;
  }

  const baseMatch = signatures.some((signature) => startsWithBytes(buffer, signature));
  if (!baseMatch) {
    return false;
  }

  if (mimeType === "image/webp") {
    return isLikelyWebp(buffer);
  }

  return true;
}

export function isSafeUploadMime(mimeType: string) {
  return Object.hasOwn(MIME_TO_ALLOWED_EXTENSIONS, mimeType);
}

