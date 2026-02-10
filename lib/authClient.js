export const AUTH_STORAGE_KEY = 'learnify:user';

// Normalize user emails to a consistent, safe format.
export function normalizeEmail(email) {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

// Read the cached user from localStorage (client-only).
export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const email = normalizeEmail(parsed?.email);
    if (!email) return null;
    const name = typeof parsed?.name === 'string' ? parsed.name.trim() : '';
    return { email, name };
  } catch {
    return null;
  }
}

// Store a lightweight user record so the UI can boot fast.
export function setStoredUser(user) {
  if (typeof window === 'undefined') return;
  const email = normalizeEmail(user?.email);
  if (!email) return;
  const name = typeof user?.name === 'string' ? user.name.trim() : '';
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ email, name }));
}

// Remove the cached user when signing out.
export function clearStoredUser() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}