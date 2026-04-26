import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';
import { decodeInput, getSelectHtml } from '../../util/bin-util';
import * as hash from 'hash-wasm';

const setupAbortControllers = new WeakMap<HTMLElement, AbortController>();

type HashAlgo = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512' | 'crc32' | 'adler32';

const HASH_ALGO_OPTIONS: Array<{ value: HashAlgo; label: string }> = [
  { value: 'md5', label: 'MD5' },
  { value: 'sha1', label: 'SHA1' },
  { value: 'sha256', label: 'SHA256' },
  { value: 'sha384', label: 'SHA384' },
  { value: 'sha512', label: 'SHA512' },
  { value: 'crc32', label: 'CRC32' },
  { value: 'adler32', label: 'Adler32' },
];

type HashOutputMode = 'hex-string' | 'base64-string' | 'decimal-comma' | 'hex-prefixed-comma';

const HASH_OUTPUT_OPTIONS: Array<{ value: HashOutputMode; label: string }> = [
  { value: 'hex-string', label: 'HEX文字列' },
  { value: 'base64-string', label: 'Base64文字列' },
  { value: 'decimal-comma', label: '10進数カンマ区切り' },
  { value: 'hex-prefixed-comma', label: '16進数カンマ区切り' },
];

function getHashAlgoSelectHtml(): string {
  const optionsHtml = HASH_ALGO_OPTIONS.map((item) => {
    return `<option value="${item.value}">${item.label}</option>`;
  }).join('');
  return `<select id="opt-hashAlgo">${optionsHtml}</select>`;
}

function getHashOutputSelectHtml(): string {
  const optionsHtml = HASH_OUTPUT_OPTIONS.map((item) => {
    return `<option value="${item.value}">${item.label}</option>`;
  }).join('');
  return `<select id="opt-outputMode">${optionsHtml}</select>`;
}

async function computeHash(data: Uint8Array, algo: HashAlgo): Promise<string> {
  switch (algo) {
    case 'md5': {
      const h = await hash.createMD5();
      h.update(data);
      return h.digest('hex');
    }
    case 'sha1': {
      const h = await hash.createSHA1();
      h.update(data);
      return h.digest('hex');
    }
    case 'sha256': {
      const h = await hash.createSHA256();
      h.update(data);
      return h.digest('hex');
    }
    case 'sha384': {
      const h = await hash.createSHA384();
      h.update(data);
      return h.digest('hex');
    }
    case 'sha512': {
      const h = await hash.createSHA512();
      h.update(data);
      return h.digest('hex');
    }
    case 'crc32': {
      const result = await hash.crc32(data);
      return result.toString(16).padStart(8, '0');
    }
    case 'adler32': {
      const result = await hash.adler32(data);
      return result.toString(16).padStart(8, '0');
    }
    default:
      throw new Error('不明なアルゴリズムです。');
  }
}

export const hashConverter: Converter = {
  id: 'hash-converter',
  name: 'ハッシュ値（チェックサム）の計算',
  description: () => `
    <p>入力データのハッシュ値（チェックサム）を計算します。</p>
    <div class="converter-options">
      <div>
        <label for="opt-inputMode">入力モード</label>
        ${getSelectHtml('opt-inputMode')}
      </div>
      <div>
        <label for="opt-hashAlgo">アルゴリズム</label>
        ${getHashAlgoSelectHtml()}
      </div>
      <div>
        <label for="opt-outputMode">出力モード</label>
        ${getHashOutputSelectHtml()}
      </div>
    </div>
  `,
  setupDescription(container: HTMLElement): void {
    setupAbortControllers.get(container)?.abort();
    const ctrl = new AbortController();
    setupAbortControllers.set(container, ctrl);
    console.info('setupDescription');
  },
  swapMode(container: HTMLElement): void {
    const inputSel = container.querySelector<HTMLSelectElement>('#opt-inputMode');
    const outputSel = container.querySelector<HTMLSelectElement>('#opt-outputMode');
    if (!inputSel || !outputSel) return;
    [inputSel.value, outputSel.value] = [outputSel.value, inputSel.value];
  },
  async convert(text, opts) {
    const inputMode = (opts.inputMode as string) ?? 'utf8-text';
    const algo = (opts.hashAlgo as HashAlgo) ?? 'sha256';
    const outputMode = (opts.outputMode as string) ?? 'hex-string';

    const inputBytes = decodeInput(text, inputMode);
    const hashHex = await computeHash(inputBytes, algo);

    let output: string;
    const hashBytes = Uint8Array.from(hashHex, (c) => c.charCodeAt(0));
    switch (outputMode) {
      case 'hex-string':
        output = hashHex;
        break;
      case 'base64-string': {
        const binary = Array.from(hashBytes).map((b) => String.fromCharCode(b)).join('');
        output = btoa(binary);
        break;
      }
      case 'decimal-comma': {
        output = Array.from(hashBytes).join(',');
        break;
      }
      case 'hex-prefixed-comma': {
        output = Array.from(hashBytes).map((b) => `0x${b.toString(16).padStart(2, '0')}`).join(',');
        break;
      }
      default:
        output = hashHex;
    }

    return ConverterResult.success(output);
  },
};