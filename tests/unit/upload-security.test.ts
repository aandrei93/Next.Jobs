import { describe, expect, it } from "vitest";
import { isAllowedExtensionForMime, isSafeUploadMime, validateFileSignature } from "@/lib/upload-security";

describe("upload security", () => {
  it("accepts known mime types", () => {
    expect(isSafeUploadMime("application/pdf")).toBe(true);
    expect(isSafeUploadMime("image/png")).toBe(true);
    expect(isSafeUploadMime("application/x-msdownload")).toBe(false);
  });

  it("validates extension for mime", () => {
    expect(isAllowedExtensionForMime("image/jpeg", "jpg")).toBe(true);
    expect(isAllowedExtensionForMime("image/jpeg", "jpeg")).toBe(true);
    expect(isAllowedExtensionForMime("image/jpeg", "png")).toBe(false);
  });

  it("validates PDF signature", () => {
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);
    const fakeBuffer = Buffer.from([0x00, 0x11, 0x22, 0x33]);
    expect(validateFileSignature("application/pdf", pdfBuffer)).toBe(true);
    expect(validateFileSignature("application/pdf", fakeBuffer)).toBe(false);
  });

  it("validates WEBP signature with RIFF+WEBP markers", () => {
    const webpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x24, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50, // WEBP
      0x56, 0x50, 0x38, 0x20,
    ]);
    const wrongWebpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46,
      0x24, 0x00, 0x00, 0x00,
      0x50, 0x4e, 0x47, 0x20, // PNG
      0x00, 0x00, 0x00, 0x00,
    ]);

    expect(validateFileSignature("image/webp", webpBuffer)).toBe(true);
    expect(validateFileSignature("image/webp", wrongWebpBuffer)).toBe(false);
  });
});
