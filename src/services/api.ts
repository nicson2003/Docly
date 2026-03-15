import { DoctorAvailabilityRaw } from '../types';

const API_URL =
  'https://raw.githubusercontent.com/suyogshiftcare/jsontest/main/available.json';

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

async function fetchWithRetry(
  url: string,
  retries: number
): Promise<DoctorAvailabilityRaw[]> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);

      // Defensive check: ensure response has ok/status
      if (!response || typeof response.ok !== 'boolean') {
        throw new ApiError('Invalid fetch response');
      }

      if (!response.ok) {
        throw new ApiError(
          `Server returned ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      const text = await response.text();

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new ApiError('Invalid JSON response', response.status);
      }

      if (!Array.isArray(parsed)) {
        throw new ApiError('Expected an array from the API', response.status);
      }

      return parsed as DoctorAvailabilityRaw[];
    } catch (err) {
      if (err instanceof ApiError && err.statusCode) {
        // Don’t retry on HTTP errors (4xx, 5xx)
        throw err;
      }

      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < retries) {
        // Exponential backoff: 500ms, 1000ms
        await new Promise((res) => setTimeout(res, 500 * Math.pow(2, attempt)));
      }
    }
  }

  const isNetwork =
    lastError.name === 'AbortError' ||
    lastError.message.includes('Network') ||
    lastError.message.includes('fetch');

  throw new ApiError(
    isNetwork
      ? 'Network error. Please check your connection and try again.'
      : lastError.message,
    undefined,
    isNetwork
  );
}

export const doctorService = {
  async fetchAvailability(): Promise<DoctorAvailabilityRaw[]> {
    return fetchWithRetry(API_URL, MAX_RETRIES);
  },
};

export { ApiError };
