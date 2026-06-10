import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { fail } from '@/lib/responses';
import { findUserById, getAuthSession, getUserProfile } from '@/lib/repository';
import type { User, UserRole } from '@/types/domain';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'web_smkn2_session';

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 60 * 60 * 24,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const userId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return userId ? findUserById(userId) : null;
}

export function publicUser(user: User) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function authResponse(user: User) {
  return {
    user: publicUser(user),
    session: getAuthSession(user),
    profile: await getUserProfile(user),
  };
}

export async function requireUser(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return {
      user: null,
      response: fail('Unauthenticated.', 401),
    };
  }

  return {
    user,
    response: null,
  };
}

export async function requireRole(request: NextRequest, allowedRoles: UserRole[]) {
  const result = await requireUser(request);

  if (!result.user) {
    return result;
  }

  if (!allowedRoles.includes(result.user.role)) {
    return {
      user: null,
      response: fail('Forbidden.', 403),
    };
  }

  return {
    user: result.user,
    response: null,
  };
}
