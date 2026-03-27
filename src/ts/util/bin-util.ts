import type { BinFormatMode, OptionValue } from '../converter/types';

export function resolveMode(
  value: OptionValue | undefined,
  fallback: BinFormatMode,
): BinFormatMode {
  if (
    value === 'utf8-text' ||
    value === 'hex-string' ||
    value === 'base64-string' ||
    value === 'decimal-comma' ||
    value === 'hex-prefixed-comma'
  ) {
    return value;
  }
  return fallback;
}

function normalizeHex(text: string): string {
  return text.replace(/\s+/g, '').trim();
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
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

function bytesToBase64(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary);
}

function decimalCommaToBytes(input: string): Uint8Array {
  const normalized = input.trim();
  if (normalized.length === 0) {
    return new Uint8Array();
  }

  const values = normalized.split(',').map((part) => part.trim());
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

function bytesToDecimalComma(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => String(byte)).join(',');
}

function hexPrefixedCommaToBytes(input: string): Uint8Array {
  const normalized = input.trim();
  if (normalized.length === 0) {
    return new Uint8Array();
  }

  const values = normalized.split(',').map((part) => part.trim());
  return Uint8Array.from(
    values.map((value) => {
      if (!/^0x[0-9a-fA-F]{1,2}$/.test(value)) {
        throw new Error('0xFF形式カンマ区切りモードでは 0xff,0x00 のように入力してください。');
      }
      return Number.parseInt(value.slice(2), 16);
    }),
  );
}

function bytesToHexPrefixedComma(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => `0x${byte.toString(16).padStart(2, '0')}`).join(',');
}

export function decodeInput(input: string, mode: BinFormatMode): Uint8Array {
  switch (mode) {
    case 'utf8-text':
      return new TextEncoder().encode(input);
    case 'hex-string':
      return hexToBytes(input);
    case 'base64-string':
      return base64ToBytes(input);
    case 'decimal-comma':
      return decimalCommaToBytes(input);
    case 'hex-prefixed-comma':
      return hexPrefixedCommaToBytes(input);
  }
}

export function encodeOutput(bytes: Uint8Array, mode: BinFormatMode): string {
  switch (mode) {
    case 'utf8-text':
      return new TextDecoder().decode(bytes);
    case 'hex-string':
      return bytesToHex(bytes);
    case 'base64-string':
      return bytesToBase64(bytes);
    case 'decimal-comma':
      return bytesToDecimalComma(bytes);
    case 'hex-prefixed-comma':
      return bytesToHexPrefixedComma(bytes);
  }
}