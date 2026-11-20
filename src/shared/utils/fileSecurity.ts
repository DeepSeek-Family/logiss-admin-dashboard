/**
 * Client-side upload check (first line of defence — the server checks again).
 *
 * Rejects a file before it is uploaded when:
 *  - the extension / size is not allowed,
 *  - the real content doesn't match the extension (e.g. an .exe renamed .png),
 *  - it is an executable or script,
 *  - it contains embedded code (<script>, <?php, onerror=, javascript: …).
 *
 * Usage:  const error = await checkUploadFile(file, "image");
 *         if (error) { toast.error(error); return; }
 */

export type UploadKind = "image" | "geojson";

const RULES: Record<UploadKind, { extensions: string[]; maxBytes: number; label: string }> = {
  // Must match the backend (fileUploaderHandlar.ts): JPG/PNG, 20 MB
  image: { extensions: [".jpg", ".jpeg", ".png"], maxBytes: 20 * 1024 * 1024, label: "JPG or PNG" },
  geojson: { extensions: [".json", ".geojson"], maxBytes: 50 * 1024 * 1024, label: ".json / .geojson" },
};

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  bytes.length >= signature.length && signature.every((b, i) => bytes[i] === b);

const IMAGE_SIGNATURES = [
  [0xff, 0xd8, 0xff], // JPEG
  [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
];

const EXECUTABLE_SIGNATURES = [
  [0x4d, 0x5a], // Windows .exe / .dll (MZ)
  [0x7f, 0x45, 0x4c, 0x46], // Linux ELF
  [0xfe, 0xed, 0xfa, 0xce],
  [0xfe, 0xed, 0xfa, 0xcf],
  [0xce, 0xfa, 0xed, 0xfe],
  [0xcf, 0xfa, 0xed, 0xfe], // macOS Mach-O
  [0xca, 0xfe, 0xba, 0xbe], // Java class / fat binary
  [0x23, 0x21], // #! script
];

const EMBEDDED_CODE = [
  /<\?php/i,
  /<script[\s>/]/i,
  /<iframe[\s>/]/i,
  /<object[\s>/]/i,
  /<embed[\s>/]/i,
  /<html[\s>]/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /\son(?:error|load|click|mouseover|focus)\s*=/i,
];

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
};

const readBytes = async (file: Blob, max?: number) =>
  new Uint8Array(await (max ? file.slice(0, max) : file).arrayBuffer());

// latin1-style decode so binary data can be searched for text patterns
const bytesToText = (bytes: Uint8Array) => {
  let text = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    text += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return text;
};

/** Returns an error message, or null when the file looks safe. */
export async function checkUploadFile(file: File, kind: UploadKind): Promise<string | null> {
  const rule = RULES[kind];
  const ext = extensionOf(file.name);

  if (!rule.extensions.includes(ext)) {
    return `${file.name}: only ${rule.label} files are allowed.`;
  }
  if (file.size === 0) return `${file.name}: file is empty.`;
  if (file.size > rule.maxBytes) {
    return `${file.name}: file is too large (max ${Math.round(rule.maxBytes / 1024 / 1024)} MB).`;
  }

  const bytes = await readBytes(file);

  if (EXECUTABLE_SIGNATURES.some((sig) => startsWith(bytes, sig))) {
    return `${file.name}: executable or script files are blocked.`;
  }

  if (kind === "image" && !IMAGE_SIGNATURES.some((sig) => startsWith(bytes, sig))) {
    return `${file.name}: this is not a real ${rule.label} image.`;
  }

  if (kind === "geojson" && bytes.subarray(0, 64 * 1024).includes(0)) {
    return `${file.name}: this is not a text/JSON file.`;
  }

  const text = bytesToText(bytes);
  if (EMBEDDED_CODE.some((pattern) => pattern.test(text))) {
    return `${file.name}: file contains hidden script/code and was blocked.`;
  }

  return null;
}

/** Checks many files; returns the safe ones and the error messages. */
export async function filterSafeUploadFiles(
  files: File[],
  kind: UploadKind,
): Promise<{ safe: File[]; errors: string[] }> {
  const safe: File[] = [];
  const errors: string[] = [];
  for (const file of files) {
    const error = await checkUploadFile(file, kind);
    if (error) errors.push(error);
    else safe.push(file);
  }
  return { safe, errors };
}
