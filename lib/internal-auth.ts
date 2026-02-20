import { timingSafeEqual } from "node:crypto";

export function isValidInternalSecret(providedSecret: string | null, expectedSecret: string | undefined) {
  if (!providedSecret || !expectedSecret) {
    return false;
  }

  const provided = Buffer.from(providedSecret);
  const expected = Buffer.from(expectedSecret);

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}
