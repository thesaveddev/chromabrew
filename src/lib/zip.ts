/**
 * Minimal dependency-free ZIP writer using the STORE (no compression)
 * method. Produces a valid ZIP archive suitable for small text files
 * (design tokens, JSON, CSS). Bytes are returned as a Uint8Array.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUInt16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

function writeUInt32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, true);
}

const enc = new TextEncoder();

interface ZipEntry {
  name: Uint8Array;
  data: Uint8Array;
  crc: number;
  /** Data offset in the final stream (used by the central directory). */
  header: number;
}

export interface ZipSource {
  /** File path inside the archive, e.g. "tokens/design-tokens.json". */
  path: string;
  content: string;
}

export function createZip(files: ZipSource[]): Uint8Array {
  const entries: ZipEntry[] = files.map((file) => {
    const name = enc.encode(file.path);
    const data = enc.encode(file.content);
    return { name, data, crc: crc32(data), header: 0 };
  });

  // DOS date/time (frozen to avoid unbounded encoding complexity).
  const dosTime = 0;
  const dosDate = 0x21; // 1980-01-01

  // First pass: compute total size so we can allocate one buffer up front.
  let total = 0;
  for (const entry of entries) {
    total += 30 + entry.name.length + entry.data.length; // local header + payload
  }
  const centralStart = total;
  let cdSize = 0;
  for (const entry of entries) {
    cdSize += 46 + entry.name.length;
  }
  const eocdSize = 22;

  const bytes = new Uint8Array(total + cdSize + eocdSize);
  const view = new DataView(bytes.buffer);

  let cursor = 0;
  for (const entry of entries) {
    entry.header = cursor;
    // Local file header
    writeUInt32(view, cursor, 0x04034b50); cursor += 4;
    writeUInt16(view, cursor, 20); cursor += 2; // version needed
    writeUInt16(view, cursor, 0); cursor += 2; // general purpose flags
    writeUInt16(view, cursor, 0); cursor += 2; // method = STORE
    writeUInt16(view, cursor, dosTime); cursor += 2;
    writeUInt16(view, cursor, dosDate); cursor += 2;
    writeUInt32(view, cursor, entry.crc); cursor += 4;
    writeUInt32(view, cursor, entry.data.length); cursor += 4; // compressed
    writeUInt32(view, cursor, entry.data.length); cursor += 4; // uncompressed
    writeUInt16(view, cursor, entry.name.length); cursor += 2;
    writeUInt16(view, cursor, 0); cursor += 2; // extra len
    bytes.set(entry.name, cursor); cursor += entry.name.length;
    bytes.set(entry.data, cursor); cursor += entry.data.length;
  }

  // Central directory
  const centralDirStart = cursor;
  for (const entry of entries) {
    writeUInt32(view, cursor, 0x02014b50); cursor += 4; // signature
    writeUInt16(view, cursor, 20); cursor += 2; // version made by
    writeUInt16(view, cursor, 20); cursor += 2; // version needed
    writeUInt16(view, cursor, 0); cursor += 2; // flags
    writeUInt16(view, cursor, 0); cursor += 2; // method
    writeUInt16(view, cursor, dosTime); cursor += 2;
    writeUInt16(view, cursor, dosDate); cursor += 2;
    writeUInt32(view, cursor, entry.crc); cursor += 4;
    writeUInt32(view, cursor, entry.data.length); cursor += 4;
    writeUInt32(view, cursor, entry.data.length); cursor += 4;
    writeUInt16(view, cursor, entry.name.length); cursor += 2;
    writeUInt16(view, cursor, 0); cursor += 2; // extra
    writeUInt16(view, cursor, 0); cursor += 2; // comment
    writeUInt16(view, cursor, 0); cursor += 2; // disk number start
    writeUInt16(view, cursor, 0); cursor += 2; // internal attrs
    writeUInt32(view, cursor, 0); cursor += 4; // external attrs
    writeUInt32(view, cursor, entry.header); cursor += 4; // local header offset
    bytes.set(entry.name, cursor); cursor += entry.name.length;
  }

  // End of central directory
  writeUInt32(view, cursor, 0x06054b50); cursor += 4;
  writeUInt16(view, cursor, 0); cursor += 2; // disk number
  writeUInt16(view, cursor, 0); cursor += 2; // cd disk start
  writeUInt16(view, cursor, entries.length); cursor += 2; // entries on disk
  writeUInt16(view, cursor, entries.length); cursor += 2; // total entries
  writeUInt32(view, cursor, cdSize); cursor += 4; // cd size
  writeUInt32(view, cursor, centralDirStart); cursor += 4; // cd offset
  writeUInt16(view, cursor, 0); cursor += 2; // comment length

  return bytes;
}

/** Encode bytes as a base64 string (used for binary export adapters). */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
