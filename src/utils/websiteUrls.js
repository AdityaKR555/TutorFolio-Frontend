export const USERNAME_PATTERN = /^(?!xn--)[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/i;
let domainConfig = { platformDomains: [], reservedSubdomains: [] };
export function setWebsiteDomains(config) { domainConfig = config; }
export function isLocalHost(hostname) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname) || hostname.endsWith('.localhost');
}
export function resolveWebsiteHost(hostname, config = domainConfig) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  const bases = [...config.platformDomains].sort((a, b) => b.length - a.length);
  if (bases.includes(host) || ['localhost', '127.0.0.1', '[::1]'].includes(host)) return { kind: 'platform', baseDomain: host };
  if (host.endsWith('.localhost')) bases.push('localhost');
  const base = bases.find((domain) => host.endsWith(`.${domain}`));
  if (!base) return { kind: 'unknown' };
  const username = host.slice(0, -base.length - 1);
  if (config.reservedSubdomains.includes(username)) return { kind: 'protected' };
  if (!USERNAME_PATTERN.test(username)) return { kind: 'unknown' };
  return { kind: 'tutor', username, baseDomain: base };
}
export function getTutorWebsiteUrl(username, location = globalThis.window?.location, config = domainConfig) {
  const name = String(username || '').trim().toLowerCase();
  if (!USERNAME_PATTERN.test(name) || config.reservedSubdomains.includes(name)) return '';
  if (!location) return `/tutor/${encodeURIComponent(name)}`;
  const host = resolveWebsiteHost(location.hostname, config);
  // Local development uses real subdomains too; IP origins map to localhost.
  if (isLocalHost(location.hostname)) {
    const port = location.port ?? (location.origin ? new URL(location.origin).port : "");
    return `${location.protocol || "http:"}//${name}.localhost${port ? `:${port}` : ""}`;
  }
  if (!['platform', 'tutor'].includes(host.kind)) return '';
  return `${location.protocol}//${name}.${host.baseDomain}${location.port ? `:${location.port}` : ''}`;
}
export function getTutorNavigationBase(username) {
  const location = globalThis.window?.location;
  if (location && resolveWebsiteHost(location.hostname).kind === 'tutor') return location.origin;
  return `/tutor/${encodeURIComponent(username)}`;
}
