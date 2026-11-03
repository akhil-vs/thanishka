import { compareSync, hashSync } from "bcryptjs";

export function hashPassword(password: string) {
  return hashSync(password, 10);
}

export function verifyPassword(passwordHash: string | null | undefined, password: string) {
  if (!passwordHash) return false;
  return compareSync(password, passwordHash);
}
