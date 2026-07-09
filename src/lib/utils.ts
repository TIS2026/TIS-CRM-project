export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  // Strip all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  // Standardize by taking the last 10 digits (assumes 10-digit standard like US/India, ignoring +91, 0 prefixes)
  if (cleaned.length >= 10) {
    cleaned = cleaned.slice(-10);
  }
  return cleaned;
}

export function normalizeName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Collapse multiple spaces into single
}

export function generateDedupKey(parentContact: string, studentName: string | null | undefined): string {
  return `${normalizePhoneNumber(parentContact)}|${normalizeName(studentName)}`;
}
