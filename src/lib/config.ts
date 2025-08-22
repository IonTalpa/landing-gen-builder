import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  UPLOAD_DIR: z.string().min(1),
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().positive()),
  SESSION_SECRET: z.string().min(32),
  BASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_USER: z.string().min(1),
  APP_PASS: z.string().min(8),
  AI_API_KEY: z.string().optional(),
  AI_API_ENDPOINT: z.string().url().optional(),
  AI_MODEL: z.string().default('gpt-4'),
  WP_PLAYGROUND_URL: z.string().url().default('https://playground.wordpress.net'),
  EXPORT_DIR: z.string().min(1),
  FORBIDDEN_WORDS: z.string().min(1),
  CSRF_SECRET: z.string().min(32),
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().positive()).default('100'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).pipe(z.number().positive()).default('900000'),
  PREVIEW_TOKEN_EXPIRY: z.string().transform(Number).pipe(z.number().positive()).default('172800'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Environment validation failed');
  }
}

export const env = validateEnv();

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

export const config = {
  app: {
    baseUrl: env.BASE_URL,
    user: env.APP_USER,
    pass: env.APP_PASS,
  },
  database: {
    url: env.DATABASE_URL,
  },
  uploads: {
    dir: env.UPLOAD_DIR,
    maxSize: env.MAX_FILE_SIZE,
  },
  exports: {
    dir: env.EXPORT_DIR,
    forbiddenWords: env.FORBIDDEN_WORDS.split(',').map(w => w.trim().toLowerCase()),
  },
  session: {
    secret: env.SESSION_SECRET,
    csrfSecret: env.CSRF_SECRET,
  },
  ai: {
    apiKey: env.AI_API_KEY,
    endpoint: env.AI_API_ENDPOINT,
    model: env.AI_MODEL,
    enabled: !!env.AI_API_KEY,
  },
  wordpress: {
    playgroundUrl: env.WP_PLAYGROUND_URL,
  },
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    window: env.RATE_LIMIT_WINDOW,
  },
  preview: {
    tokenExpiry: env.PREVIEW_TOKEN_EXPIRY,
  },
} as const;