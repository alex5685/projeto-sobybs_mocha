'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { authClient } from './auth-client';

type BetterAuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type MochaCompatUser = BetterAuthUser & {
  userName: string | null;
  google_sub: string | null;
  given_name: string | null;
  family_name: string | null;
  picture: string | null;
  email_verified: boolean | null;
  created_at: string | null;
  google_user_data: {
    sub: string | null;
    name: string | null;
    given_name: string | null;
    family_name: string | null;
    email: string | null;
    picture: string | null;
    email_verified: boolean | null;
  };
};

export type MochaUser = MochaCompatUser;

function splitName(name: string | null | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    givenName: parts[0] ?? null,
    familyName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  };
}

function toMochaDateString(value: string | Date | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toMochaCompatUser(user: BetterAuthUser | null | undefined) {
  if (!user) return null;
  const { givenName, familyName } = splitName(user.name);
  const createdAt = toMochaDateString(user.createdAt);
  return {
    ...user,
    userName: user.name ?? null,
    google_sub: user.id ?? null,
    given_name: givenName,
    family_name: familyName,
    picture: user.image ?? null,
    email_verified: user.emailVerified ?? null,
    created_at: createdAt,
    google_user_data: {
      sub: user.id ?? null,
      name: user.name ?? null,
      given_name: givenName,
      family_name: familyName,
      email: user.email ?? null,
      picture: user.image ?? null,
      email_verified: user.emailVerified ?? null,
    },
  } satisfies MochaCompatUser;
}

// Custom hook that calls /api/session directly — avoids better-auth/react detection issues
function useServerSession() {
  const [user, setUser] = useState<BetterAuthUser | null>(null);
  const [isPending, setIsPending] = useState(true);
  const fetchedRef = useRef(false);

  const doFetch = useCallback(async () => {
    try {
      const res = await fetch('/api/session', { credentials: 'include' });
      if (res.ok) {
        const data = (await res.json()) as { user: BetterAuthUser };
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void doFetch();
  }, [doFetch]);

  return { user, isPending, refetch: doFetch };
}

export function useAuth() {
  const { user: rawUser, isPending, refetch } = useServerSession();
  const signOut = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };
  const redirectToLogin = () => {
    if (typeof window !== 'undefined') window.location.href = '/account/signin';
  };
  return {
    user: toMochaCompatUser(rawUser),
    isPending,
    loading: isPending,
    error: null,
    signOut,
    logout: signOut,
    refetch,
    fetchUser: refetch,
    redirectToLogin,
    exchangeCodeForSessionToken: async () => {},
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
