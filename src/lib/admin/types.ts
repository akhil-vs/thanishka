import type { Prisma } from "@prisma/client";

export type SizeMap = Record<"XS" | "S" | "M" | "L" | "XL" | "XXL", number>;

export function asStringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export function asSizeMap(value: Prisma.JsonValue): SizeMap {
  const obj =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    XS: Number(obj.XS ?? 0),
    S: Number(obj.S ?? 0),
    M: Number(obj.M ?? 0),
    L: Number(obj.L ?? 0),
    XL: Number(obj.XL ?? 0),
    XXL: Number(obj.XXL ?? 0),
  };
}
