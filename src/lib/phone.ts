const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export const normalizeDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));

export const normalizeIranPhone = (value: string): string | null => {
  const digits = normalizeDigits(value).replace(/[\s()-]/g, '');
  if (/^09\d{9}$/.test(digits)) return digits;
  if (/^\+989\d{9}$/.test(digits)) return `0${digits.slice(3)}`;
  if (/^00989\d{9}$/.test(digits)) return `0${digits.slice(4)}`;
  return null;
};
