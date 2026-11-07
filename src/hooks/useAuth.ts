'use client';

import { signOut, useSession } from 'next-auth/react';
import { useCallback } from 'react';

/** Convenience wrapper around next-auth's useSession. */
export function useAuth() {
  const { data: session, status, update } = useSession();
  const user = session?.user ?? null;

  const logout = useCallback(() => signOut({ callbackUrl: '/login' }), []);

  return {
    user,
    role: user?.role ?? null,
    isAdmin: user?.role === 'admin',
    isMember: user?.role === 'member',
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    update,
    logout,
  };
}

export default useAuth;
