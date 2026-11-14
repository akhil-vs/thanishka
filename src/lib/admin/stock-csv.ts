import { SIZE_KEYS, type SizeKey } from "@/lib/admin/stock";

export type IntakeCsvLine = {
  productId: string;
  size: SizeKey;
  mode: "adjust" | "set";
  delta?: number;
  quantity?: number;
  raw: string;
};

export type ProductLookup = {
  id: string;
  slug: string;
  name: string;
};

function escapeCsv(value: string | number) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

/** Split a CSV line, respecting double-quoted fields. */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildIntakeTemplateCsv(sample?: {
  productId: string;
  size?: SizeKey;
  delta?: number;
}) {
  const id = sample?.productId || "PRODUCT_ID_OR_SLUG";
  const size = sample?.size || "M";
  const delta = sample?.delta ?? 5;
  return [
    "productId,size,delta",
    `${escapeCsv(id)},${size},${delta}`,
    "# Also supported: slug,size,delta",
    "# Snapshot sync (exact quantities): productId,XS,S,M,L,XL,XXL",
  ].join("\n");
}

export function buildInventoryCsv(
  rows: Array<{
    id: string;
    name: string;
    slug: string;
    category: string;
    active: boolean;
    sizes: Record<string, number>;
    total: number;
    status: string;
  }>,
) {
  const header = [
    "productId",
    "name",
    "slug",
    "category",
    "active",
    ...SIZE_KEYS,
    "total",
    "status",
  ].join(",");

  const body = rows.map((row) =>
    [
      escapeCsv(row.id),
      escapeCsv(row.name),
      escapeCsv(row.slug),
      escapeCsv(row.category),
      row.active ? "true" : "false",
      ...SIZE_KEYS.map((size) => row.sizes[size] ?? 0),
      row.total,
      escapeCsv(row.status),
    ].join(","),
  );

  return [header, ...body].join("\n");
}

export function buildMovementsCsv(
  movements: Array<{
    id: string;
    productId: string;
    productName: string;
    size: string;
    delta: number;
    quantityAfter: number;
    note: string | null;
    source: string;
    createdAt: string;
  }>,
) {
  const header = [
    "movementId",
    "productId",
    "productName",
    "size",
    "delta",
    "quantityAfter",
    "source",
    "note",
    "createdAt",
  ].join(",");

  const body = movements.map((m) =>
    [
      escapeCsv(m.id),
      escapeCsv(m.productId),
      escapeCsv(m.productName),
      escapeCsv(m.size),
      m.delta,
      m.quantityAfter,
      escapeCsv(m.source),
      escapeCsv(m.note ?? ""),
      escapeCsv(m.createdAt),
    ].join(","),
  );

  return [header, ...body].join("\n");
}

function resolveProductId(
  token: string,
  products: ProductLookup[],
): string | null {
  const exact = products.find((p) => p.id === token);
  if (exact) return exact.id;
  const bySlug = products.find(
    (p) => p.slug.toLowerCase() === token.toLowerCase(),
  );
  if (bySlug) return bySlug.id;
  return null;
}

function isHeaderCell(value: string) {
  return /^(productid|product_id|id|slug|sku|name|size|delta|qty|quantity|xs|s|m|l|xl|xxl|total|status|category|active)$/i.test(
    value.trim(),
  );
}

/**
 * Parse intake CSV (`productId|slug,size,delta`) or snapshot CSV
 * (`productId|slug,XS,S,M,L,XL,XXL`).
 */
export function parseStockCsv(
  text: string,
  products: ProductLookup[],
): { lines: IntakeCsvLine[]; format: "intake" | "snapshot" } {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  if (rawLines.length === 0) {
    throw new Error("CSV is empty");
  }

  let start = 0;
  const firstCells = splitCsvLine(rawLines[0]).map((c) => c.toLowerCase());
  const hasHeader = firstCells.some(isHeaderCell);
  if (hasHeader) start = 1;

  const header = hasHeader ? firstCells : [];
  const looksLikeSnapshot =
    header.includes("xs") ||
    (rawLines[start] &&
      splitCsvLine(rawLines[start]).length >= 7 &&
      !header.includes("size") &&
      !header.includes("delta"));

  if (looksLikeSnapshot || header.includes("xs")) {
    const lines: IntakeCsvLine[] = [];
    const sizeIndex = Object.fromEntries(
      SIZE_KEYS.map((size) => [
        size,
        header.length
          ? header.indexOf(size.toLowerCase())
          : SIZE_KEYS.indexOf(size) + 1,
      ]),
    ) as Record<SizeKey, number>;

    const resolvedIdIndex = header.length
      ? (() => {
          for (const name of [
            "productid",
            "product_id",
            "id",
            "slug",
            "sku",
          ]) {
            const idx = header.indexOf(name);
            if (idx >= 0) return idx;
          }
          return 0;
        })()
      : 0;

    rawLines.slice(start).forEach((line, index) => {
      const cells = splitCsvLine(line);
      const token = cells[resolvedIdIndex] || cells[0];
      if (!token || isHeaderCell(token)) return;
      const productId = resolveProductId(token, products);
      if (!productId) {
        throw new Error(
          `Unknown product on row ${index + 1 + start}: ${token}`,
        );
      }

      for (const size of SIZE_KEYS) {
        const idx = sizeIndex[size];
        if (idx < 0 || idx >= cells.length) continue;
        const quantity = Number(cells[idx]);
        if (!Number.isInteger(quantity) || quantity < 0) {
          throw new Error(
            `Invalid ${size} quantity on row ${index + 1 + start}`,
          );
        }
        lines.push({
          productId,
          size,
          mode: "set",
          quantity,
          raw: line,
        });
      }
    });

    if (lines.length === 0) {
      throw new Error("No snapshot rows found in CSV");
    }
    return { lines, format: "snapshot" };
  }

  const lines: IntakeCsvLine[] = [];
  rawLines.slice(start).forEach((line, index) => {
    const cells = splitCsvLine(line);
    if (cells.length < 3) {
      throw new Error(`Invalid row ${index + 1 + start}: need productId,size,delta`);
    }
    const [token, sizeRaw, deltaRaw] = cells;
    if (isHeaderCell(token) && isHeaderCell(sizeRaw)) return;

    const size = sizeRaw.toUpperCase() as SizeKey;
    if (!SIZE_KEYS.includes(size)) {
      throw new Error(`Invalid size on row ${index + 1 + start}: ${sizeRaw}`);
    }
    const productId = resolveProductId(token, products);
    if (!productId) {
      throw new Error(`Unknown product on row ${index + 1 + start}: ${token}`);
    }
    const delta = Number(deltaRaw);
    if (!Number.isInteger(delta)) {
      throw new Error(`Invalid delta on row ${index + 1 + start}`);
    }
    lines.push({
      productId,
      size,
      mode: "adjust",
      delta,
      raw: line,
    });
  });

  if (lines.length === 0) {
    throw new Error("No intake rows found in CSV");
  }
  return { lines, format: "intake" };
}

export function intakeLinesToBulkText(lines: IntakeCsvLine[]) {
  if (lines.every((l) => l.mode === "adjust")) {
    return [
      "productId,size,delta",
      ...lines.map(
        (l) => `${l.productId},${l.size},${l.delta ?? 0}`,
      ),
    ].join("\n");
  }

  // Snapshot / mixed → emit set rows as productId,size,quantity with mode marker
  return [
    "productId,size,quantity,mode",
    ...lines.map((l) =>
      l.mode === "set"
        ? `${l.productId},${l.size},${l.quantity ?? 0},set`
        : `${l.productId},${l.size},${l.delta ?? 0},adjust`,
    ),
  ].join("\n");
}

/** Parse the editable bulk textarea (supports intake + set modes). */
export function parseBulkTextarea(
  text: string,
  products: ProductLookup[],
): IntakeCsvLine[] {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  if (rawLines.length === 0) throw new Error("Bulk payload is empty");

  let start = 0;
  const first = splitCsvLine(rawLines[0]).map((c) => c.toLowerCase());
  if (first.some(isHeaderCell)) start = 1;

  return rawLines.slice(start).map((line, index) => {
    const cells = splitCsvLine(line);
    if (cells.length < 3) {
      throw new Error(`Invalid row ${index + 1 + start}: ${line}`);
    }
    const [token, sizeRaw, valueRaw, modeRaw] = cells;
    const size = sizeRaw.toUpperCase() as SizeKey;
    if (!SIZE_KEYS.includes(size)) {
      throw new Error(`Invalid size on row ${index + 1 + start}: ${sizeRaw}`);
    }
    const productId = resolveProductId(token, products);
    if (!productId) {
      throw new Error(`Unknown product on row ${index + 1 + start}: ${token}`);
    }
    const value = Number(valueRaw);
    if (!Number.isInteger(value)) {
      throw new Error(`Invalid quantity on row ${index + 1 + start}`);
    }
    const modeToken = modeRaw?.toLowerCase();
    const mode =
      modeToken === "set"
        ? ("set" as const)
        : modeToken === "adjust"
          ? ("adjust" as const)
          : first.includes("quantity") && !first.includes("delta")
            ? ("set" as const)
            : ("adjust" as const);

    if (mode === "set") {
      if (value < 0) {
        throw new Error(`Quantity cannot be negative on row ${index + 1 + start}`);
      }
      return { productId, size, mode, quantity: value, raw: line };
    }
    return { productId, size, mode, delta: value, raw: line };
  });
}
