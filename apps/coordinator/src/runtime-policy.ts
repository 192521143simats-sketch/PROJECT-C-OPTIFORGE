import {isIP} from "node:net";

function origin(value:string):string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error("Expected an HTTP(S) origin without credentials, path or query");
  return url.origin;
}

export function createOriginPolicy(publicBaseUrl:string, nodeEnv:string, additional?:string) {
  const configured = [publicBaseUrl, ...(additional?.split(',').map(value => value.trim()).filter(Boolean) ?? [])].map(origin);
  if (nodeEnv === 'production' && configured.some(value => !value.startsWith('https://'))) throw new Error("Production allowed origins require HTTPS");
  const allowed = new Set(configured);
  return (value:string|undefined) => {
    if (value === undefined) return true; // Cookie clients additionally require Origin at WS boundaries.
    try {
      const normalized = origin(value);
      if (value !== normalized) return false;
      if (allowed.has(normalized)) return true;
      if (nodeEnv === 'production') return false;
      const url = new URL(value), host = url.hostname;
      if (url.protocol !== 'http:') return false;
      if (host === 'localhost' || host === '127.0.0.1') return true;
      if (isIP(host) !== 4) return false;
      const [a,b] = host.split('.').map(Number);
      return a === 10 || (a === 192 && b === 168) || (a === 172 && b! >= 16 && b! <= 31);
    } catch { return false; }
  };
}

export function trustedProxyPolicy(value:string|undefined):false|string[] {
  if (!value || value === 'false') return false;
  if (value === 'true') throw new Error("TRUSTED_PROXIES requires explicit proxy IPs/CIDRs, not true");
  const addresses = value.split(',').map(item => item.trim());
  if (addresses.some(item => !item || !isIP(item.split('/')[0]!))) throw new Error("TRUSTED_PROXIES requires explicit proxy IPs/CIDRs");
  return addresses;
}

export function validateProductionEnvironment(config:{nodeEnv:string;publicBaseUrl:string;coordinatorPublicUrl?:string|undefined;adminPasswordHash?:string|undefined;adminPassword?:string|undefined}) {
  if (config.nodeEnv !== 'production') return;
  if (!config.adminPasswordHash?.startsWith('$argon2id$')) throw new Error("Production requires an Argon2id ADMIN_PASSWORD_HASH");
  if (config.adminPassword) throw new Error("Remove plaintext ADMIN_PASSWORD in production");
  for (const url of [config.publicBaseUrl, config.coordinatorPublicUrl].filter((item):item is string => Boolean(item))) if (!origin(url).startsWith('https://')) throw new Error("Production public endpoints require HTTPS");
}
