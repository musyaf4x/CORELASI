import type { AuthUser } from "@/types/auth";

let accessToken: string | null = null;
let sessionUser: AuthUser | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getSessionUser(): AuthUser | null {
  return sessionUser;
}

export function setSessionUser(user: AuthUser | null): void {
  sessionUser = user ? { ...user } : null;
}

export function clearSession(): void {
  accessToken = null;
  sessionUser = null;
}
