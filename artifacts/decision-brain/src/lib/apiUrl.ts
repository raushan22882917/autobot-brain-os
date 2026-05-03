const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${basePath}/api${path.startsWith("/") ? path : `/${path}`}`;
}