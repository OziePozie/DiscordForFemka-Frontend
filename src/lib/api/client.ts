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

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined && init.body !== null;
  const isFormData = hasBody && init!.body instanceof FormData;

  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
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
