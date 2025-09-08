import { z } from 'zod';

const EnvSchema = z.object({
  GEE_SA_EMAIL: z.string().min(3),
  GEE_SA_KEY_JSON: z.string().min(10), // base64 of SA JSON
  GCP_PROJECT_ID: z.string().min(3),
  REDIS_URL: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),
});

export const env = EnvSchema.parse({
  GEE_SA_EMAIL: process.env.GEE_SA_EMAIL,
  GEE_SA_KEY_JSON: process.env.GEE_SA_KEY_JSON,
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
  REDIS_URL: process.env.REDIS_URL,
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
});

export function decodeSaJson(): Record<string, any> {
  return JSON.parse(Buffer.from(env.GEE_SA_KEY_JSON, 'base64').toString('utf8'));
}
