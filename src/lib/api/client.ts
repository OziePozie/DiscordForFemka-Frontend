export interface FieldError {
  field: string;
  message: string;
  code: string;
}

export class ProblemDetailError extends Error {
  constructor(
    public status: number,
    public code: string,
    public title: string,
    public detail?: string,
    public errors?: FieldError[],
  ) {
    super(`${code}: ${title}`);
    this.name = 'ProblemDetailError';
  }
}

function readCookie(name: string): string | undefined {
  const m = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'),
  );
  return m ? decodeURIComponent(m[1]) : undefined;
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined && init.body !== null;
  const isFormData = hasBody && init!.body instanceof FormData;
  const method = (init?.method ?? 'GET').toUpperCase();

  // Spring Security CSRF: CookieCsrfTokenRepository.withHttpOnlyFalse() puts the
  // token into a JS-readable cookie. For state-changing methods we echo it back
  // via X-XSRF-TOKEN so CsrfFilter accepts the request.
  const csrfHeaders: Record<string, string> = {};
  if (UNSAFE_METHODS.has(method)) {
    const token = readCookie('XSRF-TOKEN');
    if (token) csrfHeaders['X-XSRF-TOKEN'] = token;
  }

  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...csrfHeaders,
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({} as Record<string, unknown>));
    const code = (body.code as string | undefined) ?? `HTTP_${res.status}`;
    const title = (body.title as string | undefined) ?? res.statusText;
    const detail = body.detail as string | undefined;
    const errors = body.errors as FieldError[] | undefined;
    throw new ProblemDetailError(res.status, code, title, detail, errors);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  return undefined as T;
}
