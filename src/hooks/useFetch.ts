'use client';

import useSWR, { type SWRConfiguration, type KeyedMutator } from 'swr';
import type { ApiResponse } from '@/types';

/** Error thrown by the fetcher when the API returns { success: false }. */
export class FetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parse<T>(res: Response): Promise<T> {
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new FetchError(res.ok ? 'Invalid server response' : `Request failed (${res.status})`, res.status);
  }
  if (!res.ok || !body.success) {
    throw new FetchError(!body.success ? body.error : `Request failed (${res.status})`, res.status);
  }
  return body.data;
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' });
  return parse<T>(res);
}

/** Mutating request helper: returns `data` or throws with the API error message. */
export async function apiRequest<T = unknown>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parse<T>(res);
}

/**
 * SWR-backed data hook. Provides caching, deduping and revalidation on focus.
 * Pass `null` as the url to skip fetching.
 */
export function useFetch<T>(url: string | null, config?: SWRConfiguration<T, FetchError>) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T, FetchError>(url, fetcher, {
    revalidateOnFocus: true,
    keepPreviousData: true,
    ...config,
  });
  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate: mutate as KeyedMutator<T>,
  };
}

export default useFetch;
