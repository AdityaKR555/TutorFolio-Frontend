// Only repair legacy URLs for this project's configured bucket. Signed URLs and
// unrelated hosts are left untouched; never rewrite arbitrary user links.
export function normalizeMediaUrls(value, publicBase, storageBase) {
  if (!publicBase || !storageBase) return value;
  if (typeof value === 'string') {
    try {
      const source = new URL(value);
      const legacy = new URL(storageBase.replace(/\/+$/, '') + '/');
      const target = new URL(publicBase.replace(/\/+$/, '') + '/');
      if (source.origin !== legacy.origin || !source.pathname.startsWith(legacy.pathname) || source.search || target.protocol !== 'https:') return value;
      return new URL(source.pathname.slice(legacy.pathname.length), target).href;
    } catch { return value; }
  }
  if (Array.isArray(value)) return value.map(item => normalizeMediaUrls(item, publicBase, storageBase));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => [key, normalizeMediaUrls(item, publicBase, storageBase)]));
  return value;
}
