/**
 * Generates a RFC4122 v4 compliant UUID
 * @returns {string} A random UUID
 */
export function generateUUID(): string {
  // http://www.ietf.org/rfc/rfc4122.txt
  const s: string[] = [];
  const hexDigits = "0123456789abcdef";
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.charAt(Math.floor(Math.random() * 0x10));
  }
  s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.charAt((parseInt(s[19], 16) & 0x3) | 0x8); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";

  return s.join("");
}

/**
 * Generates a formatted ID for barang masuk
 * @returns {string} An ID in format BGP-IN-XXXXXX where XXXXXX is random alphanumeric
 */
export function generateNomorDO(): string {
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BGP-IN-${randomChars}`;
}
