import { describe, expect, it } from "vitest";
import { formatSalary, slugify } from "@/lib/utils";

describe("slugify", () => {
  it("removes accents and symbols", () => {
    expect(slugify("Senior Dévelopér C++")).toBe("senior-developer-c");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  ### Product Manager ###  ")).toBe("product-manager");
  });
});

describe("formatSalary", () => {
  it("returns undisclosed label when both values are missing", () => {
    expect(formatSalary(null, null, "EUR", "en", "N/A")).toBe("N/A");
  });

  it("formats min and max in range", () => {
    expect(formatSalary(1500, 3000, "EUR", "en")).toBe("1,500 - 3,000 EUR");
  });

  it("formats single value in ro locale", () => {
    expect(formatSalary(2500, null, "RON", "ro")).toBe("2.500 RON");
  });
});
