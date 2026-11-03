/** Normalize Indian mobile numbers to +91XXXXXXXXXX when possible. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }
  if (input.trim().startsWith("+") && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}

export function maskPhone(phone: string) {
  if (phone.length < 4) return phone;
  return `${phone.slice(0, 3)}••••${phone.slice(-2)}`;
}
