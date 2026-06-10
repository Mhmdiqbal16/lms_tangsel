function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3001';

  if (typeof window === 'undefined') {
    return configuredUrl.replace(/\/$/, '');
  }

  const url = new URL(configuredUrl, window.location.origin);
  const pageHost = window.location.hostname;
  const configuredHost = url.hostname;
  const loopbackHosts = new Set(['localhost', '127.0.0.1']);

  if (loopbackHosts.has(pageHost) && loopbackHosts.has(configuredHost)) {
    url.hostname = pageHost;
  }

  return url.toString().replace(/\/$/, '');
}

const API_BASE_URL = resolveApiBaseUrl();

type ApiEnvelope<T> = {
  data: T;
};

type ApiErrorBody = {
  message?: string;
};

function parseApiBody<T>(rawBody: string) {
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as ApiEnvelope<T> | ApiErrorBody;
  } catch {
    return {
      message: rawBody.trim() || undefined,
    } satisfies ApiErrorBody;
  }
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const rawBody = await response.text();
  const body = parseApiBody<T>(rawBody);

  if (!response.ok) {
    throw new ApiError(
      (body as ApiErrorBody | null)?.message ?? `Permintaan ke server gagal (${response.status}).`,
      response.status,
    );
  }

  return (body as ApiEnvelope<T>).data;
}
