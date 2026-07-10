import * as hash from 'hash-wasm';

export type HashAlgo = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512' | 'crc32' | 'adler32';

const HASH_ALGO_OPTIONS: Array<{ value: HashAlgo; label: string }> = [
  { value: 'md5', label: 'MD5' },
  { value: 'sha1', label: 'SHA1' },
  { value: 'sha256', label: 'SHA256' },
  { value: 'sha384', label: 'SHA384' },
  { value: 'sha512', label: 'SHA512' },
  { value: 'crc32', label: 'CRC32' },
  { value: 'adler32', label: 'Adler32' },
];

export function getHashAlgoSelectHtml(): string {
  const optionsHtml = HASH_ALGO_OPTIONS.map((item) => {
    return `<option value="${item.value}">${item.label}</option>`;
  }).join('');
  return `<select id="opt-hashAlgo">${optionsHtml}</select>`;
}

export async function computeHash(data: Uint8Array, algo: HashAlgo): Promise<Uint8Array> {
  switch (algo) {
    case 'md5': {
      const h = await hash.createMD5();
      h.update(data);
      return h.digest('binary');
    }
    case 'sha1': {
      const h = await hash.createSHA1();
      h.update(data);
      return h.digest('binary');
    }
    case 'sha256': {
      const h = await hash.createSHA256();
      h.update(data);
      return h.digest('binary');
    }
    case 'sha384': {
      const h = await hash.createSHA384();
      h.update(data);
      return h.digest('binary');
    }
    case 'sha512': {
      const h = await hash.createSHA512();
      h.update(data);
      return h.digest('binary');
    }
    case 'crc32': {
      const result = await hash.crc32(data);
      return new Uint8Array(result.match(/../g)!.map((b) => parseInt(b, 16)));
    }
    case 'adler32': {
      const result = await hash.adler32(data);
      return new Uint8Array(result.match(/../g)!.map((b) => parseInt(b, 16)));
    }
    default:
      throw new Error('不明なアルゴリズムです。');
  }
}
