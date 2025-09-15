// node scripts/inspect-file.js "apps/api/tmp/1757912667804-invoice.pdf"
const fs = require("fs");
const p = process.argv[2];
if (!p) {
  console.error("pass file path");
  process.exit(1);
}
const data = fs.readFileSync(p);
console.log("bytes:", data.length);
console.log("head:");
console.log(data.slice(0, 64).toString("utf8"));
console.log("\nend (last 120 chars as utf8):");
const tail = data.slice(Math.max(0, data.length - 120));
console.log(tail.toString("utf8"));
