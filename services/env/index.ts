import { z } from "zod";

const envSchema = z.object({
  SPREADSHEET_ID: z.string().min(1),
  POST_ALL_NEWS_URL: z.string().url(),
  POST_RECENT_NEWS_URL: z.string().url(),
  POST_NEWS_PASSWORD: z.string().min(1),
  SHORT_URL_GENERATOR_URL: z.string().url(),
  SHORT_URL_PASSWORD: z.string().min(1),
  ZOHO_USERNAME: z.string().min(1),
  ZOHO_PASSWORD: z.string().min(1),
  IMAGE_GENERATOR_AUTH_1: z.string().min(1),
  IMAGE_GENERATOR_AUTH_2: z.string().min(1),
  IMAGE_GENERATOR_AUTH_3: z.string().min(1),
  IMAGE_GENERATOR_AUTH_4: z.string().min(1),
  IMAGE_GENERATOR_AUTH_5: z.string().min(1),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export const getEnv = (): AppEnv => {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration. ${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
};
