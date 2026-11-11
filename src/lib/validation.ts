import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), 'Enter a full link that starts with http:// or https://');

export const projectSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, 'Add a title').max(120),
  description: z.string().trim().min(10, 'Add a short description').max(1200),
  techStack: z.array(z.string().trim().min(1).max(40)).max(20),
  liveUrl: optionalUrl,
  githubUrl: optionalUrl,
  imageUrl: z.string().max(1000).optional().nullable(),
  imageKey: z.string().max(300).optional().nullable(),
  imageSource: z.enum(['og', 'screenshot', 'upload']).optional().nullable(),
  iconUrl: z.string().max(1000).optional().nullable(),
  iconKey: z.string().max(300).optional().nullable(),
  iconSource: z.enum(['site', 'service', 'upload']).optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
});
export type ProjectInput = z.input<typeof projectSchema>;

export const certificateSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, 'Add a title').max(160),
  issuer: z.string().trim().min(2, 'Add the issuer').max(120),
  categoryId: z.string().min(1, 'Choose a category'),
  fileUrl: z.string().min(1, 'Upload the certificate file').max(1000),
  fileKey: z.string().max(300).optional().nullable(),
  fileType: z.enum(['pdf', 'image']),
  credentialId: z.string().trim().max(120).optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
});
export type CertificateInput = z.input<typeof certificateSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email: z.string().trim().email('Enter a valid email address').max(160),
  whatsapp: z
    .string()
    .trim()
    .max(24)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^\+?[0-9 ()-]{7,20}$/.test(v), 'Enter a valid WhatsApp number, for example +62 812-3456-7890'),
  service: z.string().trim().min(1, 'Choose a service').max(80),
  customService: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, 'Tell me a little more, at least 10 characters').max(4000),
  company: z.string().max(0).optional(), // honeypot: real people leave it empty
});

export const feedbackSchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().max(80).optional(),
  company: z.string().trim().max(80).optional(),
  message: z.string().trim().min(5).max(1500),
  rating: z.number().int().min(1).max(5),
  project: z.string().trim().max(120).optional(),
  /** Optional public https URL of the client photo. Empty string counts as none. */
  avatar_url: z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z
      .string()
      .trim()
      .max(500)
      .refine((v) => {
        try {
          const u = new URL(v);
          return u.protocol === 'https:' && !u.username && !u.password;
        } catch {
          return false;
        }
      }, 'Must be a public https URL')
      .optional(),
  ),
  /** Optional. Sending the same key twice returns the first result instead of a duplicate. */
  idempotency_key: z.string().trim().min(1).max(80).optional(),
});

/** Turns a zod error into { field: message } for form display. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
