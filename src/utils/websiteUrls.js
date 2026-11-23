export const USERNAME_PATTERN = /^(?!xn--)[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/i;

export function getTutorWebsiteUrl(username, location = globalThis.window?.location) {
  const name = String(username || '').trim().toLowerCase();
  if (!name || name.length > 30 || !/^[a-z0-9_.-]+$/i.test(name) || ['.', '..'].includes(name)) return '';
  const path = getTutorNavigationBase(name);
  if (!location) return path;
  const origin = location.origin || `${location.protocol}//${location.hostname}${location.port ? `:${location.port}` : ''}`;
  return `${origin}${path}`;
}

export function getTutorNavigationBase(username) {
  return `/t/${encodeURIComponent(username)}`;
}
