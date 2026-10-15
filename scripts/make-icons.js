// Generates the PWA / app icons (red tile with a checkered flag). Run: node scripts/make-icons.js
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let c,
    crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x / size, y / size);
      const i = y * (size * 4 + 1) + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const RED = [230, 57, 70];
const WHITE = [255, 255, 255];
const BLACK = [20, 20, 28];

// Checkered flag centered on a red background (kept inside the maskable safe zone).
function pixel(u, v) {
  const x0 = 0.25,
    x1 = 0.75,
    y0 = 0.28,
    y1 = 0.68;
  if (u >= x0 && u < x1 && v >= y0 && v < y1) {
    const cols = 6,
      rows = 4;
    const cx = Math.floor(((u - x0) / (x1 - x0)) * cols);
    const cy = Math.floor(((v - y0) / (y1 - y0)) * rows);
    return (cx + cy) % 2 === 0 ? WHITE : BLACK;
  }
  // flag pole
  if (u >= 0.22 && u < 0.25 && v >= y0 && v < 0.78) return WHITE;
  return RED;
}

const outDir = path.join(__dirname, "..", "public");
const assetsDir = path.join(__dirname, "..", "assets");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(assetsDir, { recursive: true });

fs.writeFileSync(path.join(outDir, "icon-192.png"), png(192, pixel));
fs.writeFileSync(path.join(outDir, "icon-512.png"), png(512, pixel));
fs.writeFileSync(path.join(outDir, "apple-touch-icon.png"), png(180, pixel));
fs.writeFileSync(path.join(assetsDir, "icon.png"), png(1024, pixel));
console.log("icons written");
