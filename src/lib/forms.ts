/**
 * Form definitions shared by the page markup, the browser validator and the Worker,
 * so client and server always agree on what a valid submission is.
 */

export type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'radio' | 'select';

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  maxLength: number;
  autocomplete?: string;
  options?: readonly string[];
  /** Grid span on wider screens. */
  half?: boolean;
}

export interface FormDef {
  id: 'contact';
  endpoint: string;
  subject: string;
  fields: readonly Field[];
}

/** Hidden field that only bots fill in. */
export const HONEYPOT = 'website';
export const TURNSTILE_FIELD = 'cf-turnstile-response';

/** TODO: confirm the service list. Drawn from the services page; also drives the email. */
export const serviceOptions = [
  'Branding and identity',
  'Video production',
  'Photography',
  'Social media management',
  'SEO and local search',
  'Paid ads (Google and Meta)',
  'Web design',
  'Not sure yet',
] as const;

export const contactForm: FormDef = {
  id: 'contact',
  endpoint: '/api/contact',
  subject: 'New website inquiry',
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 200, autocomplete: 'name' },
    { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 254, autocomplete: 'email', half: true },
    { name: 'phone', label: 'Phone', type: 'tel', maxLength: 30, autocomplete: 'tel', half: true },
    { name: 'service', label: 'Service interest', type: 'select', required: true, options: serviceOptions, maxLength: 100 },
    { name: 'message', label: 'Message', type: 'textarea', required: true, maxLength: 5000 },
  ],
};

export const forms = { contact: contactForm } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateField(field: Field, raw: unknown): string | null {
  const value = typeof raw === 'string' ? raw.trim() : '';
  const label = field.label.toLowerCase();

  if (!value) {
    if (!field.required) return null;
    if (field.type === 'radio' || field.type === 'select') return `Please choose an option for ${label}.`;
    return `Please enter your ${label}.`;
  }
  if (field.options && !field.options.includes(value)) return `Please choose an option for ${label}.`;
  if (value.length > field.maxLength) return `Please keep ${label} under ${field.maxLength} characters.`;

  switch (field.type) {
    case 'email':
      if (!EMAIL_RE.test(value)) return 'Please enter a valid email address.';
      break;
    case 'tel': {
      const digits = value.replace(/\D/g, '').length;
      if (digits < 10 || digits > 15 || !/^[\d\s().+-]+$/.test(value)) return 'Please enter a valid phone number.';
      break;
    }
  }
  return null;
}

export function validateForm(form: FormDef, data: Record<string, unknown>) {
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};
  for (const field of form.fields) {
    const error = validateField(field, data[field.name]);
    if (error) errors[field.name] = error;
    else values[field.name] = typeof data[field.name] === 'string' ? (data[field.name] as string).trim() : '';
  }
  return { values, errors, ok: Object.keys(errors).length === 0 };
}
