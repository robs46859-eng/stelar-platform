const GATEWAY = import.meta.env.VITE_GATEWAY_URL ?? '';
const ARKHAM = import.meta.env.VITE_ARKHAM_URL ?? '';

async function get<T>(base: string, path: string): Promise<T> {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function post<T>(base: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const gatewayApi = {
  get: <T>(path: string) => get<T>(GATEWAY, path),
};

export const arkhamApi = {
  get: <T>(path: string) => get<T>(ARKHAM, path),
  post: <T>(path: string, body: unknown) => post<T>(ARKHAM, path, body),
};
