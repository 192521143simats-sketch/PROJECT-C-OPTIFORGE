import {describe, expect, it} from "vitest";
import {createOriginPolicy, trustedProxyPolicy, validateProductionEnvironment} from "./runtime-policy.js";

describe("runtime security policy", () => {
  it("rejects unconfigured private-LAN and malformed origins in production", () => {
    const allows = createOriginPolicy("https://grid.example", "production", "https://admin.example");
    expect(allows("https://grid.example")).toBe(true);
    expect(allows("https://admin.example")).toBe(true);
    for (const origin of ["http://192.168.1.10:5173", "https://grid.example.evil", "https://grid.example/path", "null", "not-a-url"]) expect(allows(origin)).toBe(false);
    expect(allows(undefined)).toBe(true); // Native bearer clients do not send Origin.
  });
  it("preserves LAN development but does not accept lookalike private hostnames", () => {
    const allows = createOriginPolicy("http://localhost:5173", "development");
    expect(allows("http://192.168.1.10:5173")).toBe(true);
    expect(allows("http://10.0.0.2:5173")).toBe(true);
    expect(allows("http://172.31.1.1:5173")).toBe(true);
    for (const origin of ["http://192.168.evil.example", "http://172.32.1.1", "http://10.evil.example", "http://8.8.8.8"]) expect(allows(origin)).toBe(false);
  });
  it("never trusts all forwarded addresses by default or by an accidental true value", () => {
    expect(trustedProxyPolicy(undefined)).toBe(false);
    expect(trustedProxyPolicy("false")).toBe(false);
    expect(trustedProxyPolicy("127.0.0.1,::1")).toEqual(["127.0.0.1", "::1"]);
    expect(() => trustedProxyPolicy("true")).toThrow(/explicit/);
  });
  it("fails closed on production plaintext passwords or HTTP public endpoints", () => {
    const safe = {nodeEnv:"production", publicBaseUrl:"https://grid.example", coordinatorPublicUrl:"https://api.example", adminPasswordHash:"$argon2id$v=19$m=19456,t=2,p=1$bootstrap$hash"};
    expect(() => validateProductionEnvironment(safe)).not.toThrow();
    expect(() => validateProductionEnvironment({...safe, publicBaseUrl:"http://grid.example"})).toThrow(/HTTPS/);
    expect(() => validateProductionEnvironment({...safe, adminPasswordHash:undefined, adminPassword:"unsafe"})).toThrow(/Argon2id/);
    expect(() => validateProductionEnvironment({...safe, adminPassword:"unsafe"})).toThrow(/plaintext/);
    expect(() => createOriginPolicy("https://grid.example", "production", "http://admin.example")).toThrow(/HTTPS/);
  });
});
