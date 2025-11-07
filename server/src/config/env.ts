import dotenv from 'dotenv';

const result = dotenv.config();

if (result.error && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.warn('Failed to load .env file. Falling back to existing environment variables.');
}

const parsePort = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort(process.env.PORT),
  spaceTradersToken: process.env.SPACETRADERS_TOKEN ?? '',
  spaceTradersApiUrl: process.env.SPACETRADERS_API_URL ?? 'https://api.spacetraders.io/v2'
};

export type AppEnvironment = typeof env;
