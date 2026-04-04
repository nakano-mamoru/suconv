export type BinFormatMode =
  | 'utf8-text'
  | 'hex-string'
  | 'base64-string'
  | 'base64url-string'
  | 'decimal-comma'
  | 'hex-prefixed-comma';

const BIN_FORMAT_OPTIONS: Array<{ value: BinFormatMode; label: string }> = [
  { value: 'utf8-text', label: 'テキスト (UTF-8)' },
  { value: 'hex-string', label: 'HEX文字列' },
  { value: 'base64-string', label: 'Base64文字列' },
  { value: 'base64url-string', label: 'Base64URL文字列' },
  { value: 'decimal-comma', label: '10進数カンマ区切り' },
  { value: 'hex-prefixed-comma', label: '16進数カンマ区切り' },
];

export type EncodeOpts = {
  hexFormat?: string;
  hexUppercase?: boolean;
  base64LineBreak?: string;
  csvLineBreak?: string;
};

export function getSelectHtml(id: string): string {
  const defaultMode: BinFormatMode = id.includes('outputMode') ? 'base64-string' : 'utf8-text';
  const optionsHtml = BIN_FORMAT_OPTIONS.map((item) => {
    const selected = item.value === defaultMode ? ' selected' : '';
    return `<option value="${item.value}"${selected}>${item.label}</option>`;
  }).join('');
  return `<select id="${id}">${optionsHtml}</select>`;
}

function normalizeHex(text: string): string {
  return text.replace(/[\s-]/g, '');
}

function hexToBytes(input: string): Uint8Array {
  const normalized = normalizeHex(input);
  if (normalized.length === 0) {
    return new Uint8Array();
  }
  if (!/^[0-9a-fA-F]+$/.test(normalized)) {
    throw new Error('HEX文字列モードでは16進数のみ使用できます。');
  }
  if (normalized.length % 2 !== 0) {
    throw new Error('HEX文字列モードでは文字数を偶数にしてください。');
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }
  return bytes;
}

function base64ToBytes(input: string): Uint8Array {
  const normalized = input.replace(/\s+/g, '');
  if (normalized.length === 0) {
    return new Uint8Array();
  }

  try {
    const binary = atob(normalized);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    throw new Error('Base64文字列の形式が不正です。');
  }
}

function base64urlToBytes(input: string): Uint8Array {
  const normalized = input.replace(/\s+/g, '');
  if (normalized.length === 0) {
    return new Uint8Array();
  }

  const padded = normalized.replace(/-/g, '+').replace(/_/g, '/');
  const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  try {
    const binary = atob(withPadding);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    throw new Error('Base64URL文字列の形式が不正です。');
  }
}

function decimalCommaToBytes(input: string): Uint8Array {
  const normalized = input.trim();
  if (normalized.length === 0) {
    return new Uint8Array();
  }

  const values = normalized.replace(/\r\n|\r|\n/g, ',').split(',').map((part) => part.trim()).filter((p) => p.length > 0);
  return Uint8Array.from(
    values.map((value) => {
      if (!/^(0|[1-9][0-9]*)$/.test(value)) {
        throw new Error('10進数カンマ区切りモードでは0から255の整数をカンマ区切りで入力してください。');
      }
      const parsed = Number.parseInt(value, 10);
      if (parsed < 0 || parsed > 255) {
        throw new Error('10進数カンマ区切りモードでは各値を0から255の範囲にしてください。');
      }
      return parsed;
    }),
  );
}

function hexPrefixedCommaToBytes(input: string): Uint8Array {
  const normalized = input.trim();
  if (normalized.length === 0) {
    return new Uint8Array();
  }

  const values = normalized.replace(/\r\n|\r|\n/g, ',').split(',').map((part) => part.trim()).filter((p) => p.length > 0);
  return Uint8Array.from(
    values.map((value) => {
      if (!/^0x[0-9a-fA-F]{1,2}$/.test(value)) {
        throw new Error('16進数カンマ区切りモードでは 0xff,0x00 のように入力してください。');
      }
      return Number.parseInt(value.slice(2), 16);
    }),
  );
}

export function decodeInput(text: string, mode: string | undefined): Uint8Array {
  switch (mode) {
    case 'utf8-text':
      return new TextEncoder().encode(text);
    case 'hex-string':
      return hexToBytes(text);
    case 'base64-string':
      return base64ToBytes(text);
    case 'base64url-string':
      return base64urlToBytes(text);
    case 'decimal-comma':
      return decimalCommaToBytes(text);
    case 'hex-prefixed-comma':
      return hexPrefixedCommaToBytes(text);
    default:
      throw new Error('入力モードが不正です。');
  }
}

function bytesToHex(bytes: Uint8Array, useUppercase = false): string {
  const s = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return useUppercase ? s.toUpperCase() : s;
}

function hexByte(byte: number, useUppercase: boolean): string {
  const s = byte.toString(16).padStart(2, '0');
  return useUppercase ? s.toUpperCase() : s;
}

function formatGroupedHexRow(row: number[], useUppercase: boolean): string {
  return row.map((b, i) => {
    const hex = hexByte(b, useUppercase);
    if (i === 0) return hex;
    if (i === 8) return `-${hex}`;
    return ` ${hex}`;
  }).join('');
}

function bytesToHexGrouped(bytes: Uint8Array, useUppercase: boolean): string {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    lines.push(formatGroupedHexRow(Array.from(bytes.slice(i, i + 16)), useUppercase));
  }
  return lines.join('\n');
}

function bytesToHexDump(bytes: Uint8Array, useUppercase: boolean): string {
  if (bytes.length === 0) return '';
  const colHeader = Array.from({ length: 16 }, (_, i) => {
    const d = useUppercase ? i.toString(16).toUpperCase() : i.toString(16);
    return i === 0 ? d.padStart(2) : d.padStart(3);
  }).join('');
  const lines = [`      ${colHeader}`];
  for (let i = 0; i < bytes.length; i += 16) {
    const addr = i.toString(16).padStart(4, '0');
    lines.push(`${addr}  ${formatGroupedHexRow(Array.from(bytes.slice(i, i + 16)), useUppercase)}`);
  }
  return lines.join('\n');
}

function bytesToBase64(bytes: Uint8Array, lineBreak?: string): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  const b64 = btoa(binary);
  if (lineBreak === '64') return b64.match(/.{1,64}/g)?.join('\n') ?? b64;
  if (lineBreak === '76') return b64.match(/.{1,76}/g)?.join('\n') ?? b64;
  return b64;
}

function bytesToBase64Url(bytes: Uint8Array, lineBreak?: string): string {
  const b64url = bytesToBase64(bytes, lineBreak)
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+(?=$|\n)/g, '');
  return b64url;
}

function bytesToDecimalComma(bytes: Uint8Array, lineBreak?: string): string {
  const values = Array.from(bytes, (byte) => String(byte));
  if (lineBreak === 'line') {
    const lines: string[] = [];
    for (let i = 0; i < values.length; i += 16) lines.push(values.slice(i, i + 16).join(','));
    return lines.join(',\n');
  }
  return values.join(',');
}

function bytesToHexPrefixedComma(bytes: Uint8Array, useUppercase: boolean, lineBreak?: string): string {
  const values = Array.from(bytes, (byte) => {
    const hex = byte.toString(16).padStart(2, '0');
    return `0x${useUppercase ? hex.toUpperCase() : hex}`;
  });
  if (lineBreak === 'line') {
    const lines: string[] = [];
    for (let i = 0; i < values.length; i += 16) lines.push(values.slice(i, i + 16).join(','));
    return lines.join(',\n');
  }
  return values.join(',');
}

export function encodeOutput(bytes: Uint8Array, mode: string | undefined, opts: EncodeOpts = {}): string {
  const { hexFormat, hexUppercase = false, base64LineBreak, csvLineBreak } = opts;
  switch (mode) {
    case 'utf8-text':
      return new TextDecoder().decode(bytes);
    case 'hex-string':
      if (hexFormat === 'grouped') return bytesToHexGrouped(bytes, hexUppercase);
      if (hexFormat === 'dump') return bytesToHexDump(bytes, hexUppercase);
      return bytesToHex(bytes, hexUppercase);
    case 'base64-string':
      return bytesToBase64(bytes, base64LineBreak);
    case 'base64url-string':
      return bytesToBase64Url(bytes, base64LineBreak);
    case 'decimal-comma':
      return bytesToDecimalComma(bytes, csvLineBreak);
    case 'hex-prefixed-comma':
      return bytesToHexPrefixedComma(bytes, hexUppercase, csvLineBreak);
    default:
      throw new Error('出力モードが不正です。');
  }
}