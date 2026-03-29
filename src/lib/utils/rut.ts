/**
 * Chilean RUT (Rol Unico Tributario) validation and formatting utilities.
 * Format: XX.XXX.XXX-V where V is the verification digit.
 */

export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function calculateVerificationDigit(rutBody: string): string {
  const digits = rutBody.split("").reverse().map(Number);
  let sum = 0;
  let multiplier = 2;

  for (const digit of digits) {
    sum += digit * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return remainder.toString();
}

export function isValidRut(rut: string): boolean {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  if (!/^\d+$/.test(body)) return false;
  if (parseInt(body) < 1000000) return false;

  return calculateVerificationDigit(body) === dv;
}

export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return rut;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted}-${dv}`;
}

export function maskRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 5) return "***";

  const lastThree = cleaned.slice(-4, -1);
  const dv = cleaned.slice(-1);
  return `***.***. ${lastThree}-${dv}`;
}
