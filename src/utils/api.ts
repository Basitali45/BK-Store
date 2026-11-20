import { auth } from '../lib/firebase';

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { requireAuth?: boolean } = {}
): Promise<T> {
  const { requireAuth = false, headers = {}, ...rest } = options;
  const reqHeaders = new Headers(headers);

  if (!reqHeaders.has('Content-Type') && rest.body) {
    reqHeaders.set('Content-Type', 'application/json');
  }

  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    reqHeaders.set('Authorization', `Bearer ${token}`);
  } else if (requireAuth) {
    throw new Error('Please sign in with Google to continue.');
  }

  const response = await fetch(path, {
    ...rest,
    headers: reqHeaders,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data as T;
}

export function buildWhatsAppUrl(waNumber: string, text: string): string {
  const cleanDigits = waNumber.replace(/\D/g, '');
  const intl = cleanDigits.startsWith('0') ? `92${cleanDigits.slice(1)}` : cleanDigits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}
