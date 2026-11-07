import { NextResponse } from 'next/server';
import { getServerSession, type Session } from 'next-auth';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { authOptions } from './auth';
import type { Role } from '@/types';

/** Error with an HTTP status code, thrown inside route handlers. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Success envelope: { success: true, data } */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Error envelope: { success: false, error } */
export function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

/** Convert any thrown value into a consistent JSON error response. */
export function handleError(error: unknown) {
  if (error instanceof ApiError) return fail(error.message, error.status);

  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path.join('.');
    return fail(field ? `${field}: ${issue.message}` : issue?.message ?? 'Invalid input', 422);
  }

  if (error instanceof mongoose.Error.CastError) return fail('Invalid id', 400);
  if (error instanceof mongoose.Error.ValidationError) {
    const first = Object.values(error.errors)[0];
    return fail(first?.message ?? 'Validation failed', 422);
  }
  if (typeof error === 'object' && error && 'code' in error && (error as { code: number }).code === 11000) {
    return fail('A record with these details already exists', 409);
  }
  if (error instanceof SyntaxError) return fail('Malformed JSON body', 400);

  console.error('[API]', error);
  return fail('Something went wrong. Please try again.', 500);
}

export type AuthedSession = Session & { user: { id: string; role: Role; name: string; email: string } };

/**
 * Require an authenticated session (optionally with a specific role).
 * Throws ApiError(401/403) otherwise.
 */
export async function requireAuth(role?: Role): Promise<AuthedSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new ApiError('You must be signed in', 401);
  if (role && session.user.role !== role) throw new ApiError('You do not have permission', 403);
  return session as AuthedSession;
}

/** Ensure the caller is an admin or the owner of the resource. */
export function assertSelfOrAdmin(session: AuthedSession, ownerId: string) {
  if (session.user.role !== 'admin' && session.user.id !== ownerId) {
    throw new ApiError('You do not have permission', 403);
  }
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError('Malformed JSON body', 400);
  }
}

/**
 * Basic input sanitisation: strip keys starting with "$" or containing "."
 * to prevent MongoDB operator injection through JSON bodies.
 */
export function sanitize<T>(value: T): T {
  if (Array.isArray(value)) return value.map(sanitize) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = sanitize(v);
    }
    return out as T;
  }
  return value;
}
