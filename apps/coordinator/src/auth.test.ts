import {describe,expect,it} from "vitest";
import {hashPassword,passwordPolicy} from "./auth.js";
import {verify} from "argon2";

describe("authentication security",()=>{
  it("enforces the configured password strength policy",()=>{expect(passwordPolicy("weak-password")).toBe(false);expect(passwordPolicy("StrongPassword!42")).toBe(true);});
  it("uses Argon2id hashes that do not contain the password",async()=>{const password="StrongPassword!42",encoded=await hashPassword(password);expect(encoded).toMatch(/^\$argon2id\$/);expect(encoded).not.toContain(password);expect(await verify(encoded,password)).toBe(true);expect(await verify(encoded,"wrong")).toBe(false);});
});
