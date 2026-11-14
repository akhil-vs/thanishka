import assert from "node:assert/strict";
import {
  buildInventoryCsv,
  intakeLinesToBulkText,
  parseBulkTextarea,
  parseStockCsv,
  splitCsvLine,
} from "../src/lib/admin/stock-csv";

const products = [
  { id: "4", slug: "backwater-flare-dress", name: "Backwater Flare Dress" },
  { id: "11", slug: "christmas-velvet-midi", name: "Christmas Velvet Midi" },
];

assert.deepEqual(splitCsvLine('a,"b,c",d'), ["a", "b,c", "d"]);

{
  const { lines, format } = parseStockCsv(
    "productId,size,delta\nbackwater-flare-dress,M,3\n4,S,-1\n",
    products,
  );
  assert.equal(format, "intake");
  assert.equal(lines.length, 2);
  assert.equal(lines[0].productId, "4");
  assert.equal(lines[0].delta, 3);
  assert.equal(lines[1].delta, -1);
}

{
  const { lines, format } = parseStockCsv(
    "slug,XS,S,M,L,XL,XXL\nchristmas-velvet-midi,1,2,3,4,5,6\n",
    products,
  );
  assert.equal(format, "snapshot");
  assert.equal(lines.length, 6);
  assert.equal(lines[2].size, "M");
  assert.equal(lines[2].quantity, 3);
  assert.equal(lines[2].mode, "set");
}

{
  const text = intakeLinesToBulkText([
    { productId: "4", size: "M", mode: "adjust", delta: 2, raw: "" },
  ]);
  const parsed = parseBulkTextarea(text, products);
  assert.equal(parsed[0].mode, "adjust");
  assert.equal(parsed[0].delta, 2);
}

{
  const csv = buildInventoryCsv([
    {
      id: "4",
      name: 'Dress, "special"',
      slug: "backwater-flare-dress",
      category: "Party",
      active: true,
      sizes: { XS: 1, S: 2, M: 3, L: 0, XL: 0, XXL: 0 },
      total: 6,
      status: "Healthy",
    },
  ]);
  assert.match(csv, /"Dress, ""special"""/);
}

console.log("stock-csv tests passed");
