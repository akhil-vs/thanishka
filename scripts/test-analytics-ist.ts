import assert from "node:assert/strict";
import {
  addIstDays,
  attributionAt,
  formatIstDateKey,
  parseIstDateKey,
  previousEqualRange,
  resolveAnalyticsRange,
  startOfIstDay,
} from "../src/lib/admin/analytics";

// 2024-06-15 00:30 UTC = 2024-06-15 06:00 IST
assert.equal(
  formatIstDateKey(new Date("2024-06-15T00:30:00.000Z")),
  "2024-06-15",
);

// 2024-06-14 18:29 UTC = still 2024-06-14 in IST (23:59)
assert.equal(
  formatIstDateKey(new Date("2024-06-14T18:29:00.000Z")),
  "2024-06-14",
);

// 2024-06-14 18:30 UTC = 2024-06-15 00:00 IST
assert.equal(
  formatIstDateKey(new Date("2024-06-14T18:30:00.000Z")),
  "2024-06-15",
);

const start = parseIstDateKey("2024-06-15");
assert.equal(start.toISOString(), "2024-06-14T18:30:00.000Z");
assert.equal(formatIstDateKey(start), "2024-06-15");
assert.equal(formatIstDateKey(startOfIstDay(start)), "2024-06-15");

assert.equal(addIstDays("2024-06-15", 1), "2024-06-16");
assert.equal(addIstDays("2024-06-01", -1), "2024-05-31");

const range = resolveAnalyticsRange({
  from: "2024-06-10",
  to: "2024-06-16",
});
assert.equal(range.fromKey, "2024-06-10");
assert.equal(range.toKey, "2024-06-16");
assert.equal(range.from.toISOString(), "2024-06-09T18:30:00.000Z");
assert.equal(range.to.toISOString(), "2024-06-16T18:30:00.000Z");

const prev = previousEqualRange(range);
assert.equal(prev.fromKey, "2024-06-03");
assert.equal(prev.toKey, "2024-06-09");

assert.equal(
  attributionAt({
    paidAt: new Date("2024-01-02T00:00:00.000Z"),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  }).toISOString(),
  "2024-01-02T00:00:00.000Z",
);
assert.equal(
  attributionAt({
    paidAt: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  }).toISOString(),
  "2024-01-01T00:00:00.000Z",
);

assert.throws(() => resolveAnalyticsRange({ from: "2024-06-20", to: "2024-06-10" }));

console.log("analytics ist helpers ok");
