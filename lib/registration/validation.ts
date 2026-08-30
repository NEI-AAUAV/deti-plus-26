import type { RegisterPayload} from "@/lib/registration/api";

export const YEARS = ['1', '2', '3', '4', '5', 'PhD', 'Other'] as const;

export const MAX_CV_BYTES = 1024 * 1024 * 5;
export const ALLOWED_CV_MIME = 'application/pdf';

export type RegistrationFields = Omit<RegisterPayload, 'website'>;
export type FieldErrors = Partial<Record<keyof RegistrationFields, string>>;

export const EMPTY_REGISTRATION: RegistrationFields = {
  name: '',
  email: '',
  mobileNumber: '',
  curse: '',
  year: '',
  hasCvConsent: false,
  hasGdprConsent: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+0-9 ()-]{6,20}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

export function validateRegistration(fields: RegistrationFields): FieldErrors {
  const errors: FieldErrors = {};

  if (fields.name.trim().length < 2) {
    errors.name = 'Provide your full name.';
  }
  if (!isValidEmail(fields.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (fields.mobileNumber.trim() && !PHONE_RE.test(fields.mobileNumber.trim())) {
    errors.mobileNumber = 'Invalid phone number.';
  }
  if (fields.curse.trim().length < 2) {
    errors.curse = 'Specify your course.';
  }
  if (!YEARS.includes(fields.year as (typeof YEARS)[number])) {
    errors.year = 'Select the academic year.';
  }
  if (!fields.hasGdprConsent) {
    errors.hasGdprConsent = 'You must accept the data policy.';
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function toPayload(fields: RegistrationFields): RegistrationFields {
  return {
    name: fields.name.trim(),
    email: fields.email.trim().toLowerCase(),
    mobileNumber: fields.mobileNumber.trim(),
    curse: fields.curse.trim(),
    year: fields.year,
    hasCvConsent: fields.hasCvConsent,
    hasGdprConsent: fields.hasGdprConsent,
  };
}

export function validateCvFile(file: File): string | null {
  if (file.type !== ALLOWED_CV_MIME) return 'The CV must be a PDF file.';
  if (file.size === 0) return 'The file is empty.';
  if (file.size > MAX_CV_BYTES) return 'The CV cannot exceed 5 MB.';
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
