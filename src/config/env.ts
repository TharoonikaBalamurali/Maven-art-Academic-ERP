/**
 * Single place where `import.meta.env` is read (Day 1 step 22).
 *
 * Nothing else in the application may touch `import.meta.env` directly, so
 * that a deployment is configured purely through environment variables and
 * misconfiguration fails loudly at startup rather than silently at runtime.
 */

export type ApiMode = 'mock' | 'http';

export interface AppEnv {
  appName: string;
  appEnv: string;
  apiMode: ApiMode;
  apiBaseUrl: string;
  apiTimeoutMs: number;
  mockLatencyMs: number;
  isProduction: boolean;
}

function readString(key: string, fallback: string): string {
  const raw = import.meta.env[key];
  return typeof raw === 'string' && raw.length > 0 ? raw : fallback;
}

function readNumber(key: string, fallback: number): number {
  const raw = import.meta.env[key];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readApiMode(): ApiMode {
  const raw = readString('VITE_API_MODE', 'mock');
  if (raw !== 'mock' && raw !== 'http') {
    throw new Error(
      `Invalid VITE_API_MODE "${raw}". Expected "mock" or "http". See .env.example.`,
    );
  }
  return raw;
}

function build(): AppEnv {
  const apiMode = readApiMode();
  const apiBaseUrl = readString('VITE_API_BASE_URL', '');

  if (apiMode === 'http' && apiBaseUrl.length === 0) {
    throw new Error('VITE_API_BASE_URL is required when VITE_API_MODE="http".');
  }

  return {
    appName: readString('VITE_APP_NAME', 'Maven Art Academic ERP'),
    appEnv: readString('VITE_APP_ENV', import.meta.env.MODE ?? 'development'),
    apiMode,
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''),
    apiTimeoutMs: readNumber('VITE_API_TIMEOUT_MS', 15_000),
    mockLatencyMs: readNumber('VITE_MOCK_LATENCY_MS', 300),
    isProduction: import.meta.env.PROD === true,
  };
}

export const env: AppEnv = build();
