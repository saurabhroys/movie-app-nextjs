import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/env';

export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Detects network/transient errors that are worth retrying.
 */
export const isRetryable = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const anyErr = error as {
    code?: string;
    message?: string;
    response?: { status?: number };
  };
  const code: string | undefined = anyErr?.code;
  const message: string | undefined = anyErr?.message?.toLowerCase();
  const status: number | undefined = anyErr?.response?.status;

  return (
    code === 'ECONNRESET' ||
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    message?.includes('timeout') ||
    (typeof status === 'number' &&
      (status === 429 || (status >= 500 && status < 600)))
  );
};

export interface RetryOptions {
  maxAttempts?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
}

/**
 * Retries `fn` with exponential backoff + jitter when `isRetryable` says so.
 * Single canonical retry helper shared by every TMDB service method.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  {
    maxAttempts = 3,
    initialBackoffMs = 300,
    maxBackoffMs = 3000,
  }: RetryOptions = {},
): Promise<T> {
  let attempt = 0;
  let backoff = initialBackoffMs;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt >= maxAttempts || !isRetryable(error)) {
        throw error;
      }
      await sleep(backoff + Math.random() * 200);
      backoff = Math.min(backoff * 2, maxBackoffMs);
    }
  }
}

export const isFulfilled = <T>(
  input: PromiseSettledResult<T>,
): input is PromiseFulfilledResult<T> => input.status === 'fulfilled';

export const isRejected = (
  input: PromiseSettledResult<unknown>,
): input is PromiseRejectedResult => input.status === 'rejected';

const onRequest = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  if (config.baseURL?.includes('themoviedb')) {
    config.headers.Authorization = `Bearer ${env.NEXT_PUBLIC_TMDB_TOKEN}`;
  }
  return config;
};

const onErrorResponse = (error: AxiosError | Error): Promise<AxiosError> => {
  console.error(`error in request: ${error.message}`);
  return Promise.reject(error);
};

const getConfig = (baseUrl: string): AxiosRequestConfig => ({
  adapter: 'fetch',
  timeout: 60000,
  baseURL: baseUrl,
  responseType: 'json',
  maxContentLength: Infinity,
  validateStatus: (status: number) => status >= 200 && status < 300,
  maxRedirects: 5,
});

// Single reusable axios instance created once at import time and reused by every
// service call — avoids allocating a new instance + interceptors per request.
const http: AxiosInstance = axios.create(getConfig(TMDB_BASE_URL));
http.interceptors.request.use(onRequest, onErrorResponse);

export default http;
