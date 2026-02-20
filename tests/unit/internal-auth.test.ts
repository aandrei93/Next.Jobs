import { describe, expect, it } from "vitest";
import { isValidInternalSecret } from "@/lib/internal-auth";

describe("isValidInternalSecret", () => {
  it("returns true for identical secrets", () => {
    expect(isValidInternalSecret("abc123", "abc123")).toBe(true);
  });

  it("returns false for different secrets", () => {
    expect(isValidInternalSecret("abc123", "abc124")).toBe(false);
  });

  it("returns false for missing values", () => {
    expect(isValidInternalSecret(null, "abc123")).toBe(false);
    expect(isValidInternalSecret("abc123", undefined)).toBe(false);
  });

  it("returns false for length mismatch", () => {
    expect(isValidInternalSecret("short", "longer-secret")).toBe(false);
  });
});
