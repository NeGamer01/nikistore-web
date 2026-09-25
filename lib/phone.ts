export function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function normalizeWhatsAppTargets(value: string) {
  return value
    .split(",")
    .map((target) => normalizeWhatsAppNumber(target))
    .filter(Boolean)
    .join(",");
}

export function isValidWhatsAppNumber(value: string) {
  return /^62\d{8,15}$/.test(normalizeWhatsAppNumber(value));
}
