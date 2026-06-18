let envStore: Record<string, string> = {};

export function setEnv(env: Record<string, unknown>) {
  envStore = env as Record<string, string>;
}

export function getEnv(key: string): string {
  return envStore[key] || "";
}
