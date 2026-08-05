export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${addTrailingSlash(path)}`;
}

// Page routes are built as directories (e.g. /service-areas/foo/index.html),
// so links must include the trailing slash to avoid a redirect hop.
// Asset paths (favicon.ico, manifest, etc.) have a file extension and are left untouched.
function addTrailingSlash(path: string): string {
  const splitIndex = path.search(/[?#]/);
  const pathname = splitIndex === -1 ? path : path.slice(0, splitIndex);
  const suffix = splitIndex === -1 ? '' : path.slice(splitIndex);
  const lastSegment = pathname.split('/').pop() ?? '';
  if (lastSegment.includes('.') || pathname.endsWith('/')) {
    return path;
  }
  return `${pathname}/${suffix}`;
}

export function stripBase(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (base && pathname.startsWith(base)) {
    return pathname.slice(base.length) || '/';
  }
  return pathname;
}
