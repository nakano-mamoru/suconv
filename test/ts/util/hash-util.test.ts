import { describe, expect, it } from 'vitest';
import { computeHash, getHashAlgoSelectHtml } from '../../../src/ts/util/hash-util';
import { encodeOutput } from '../../../src/ts/util/bin-util';

describe('hash-util', () => {
    it('getHashAlgoSelectHtml: アルゴリズムselectを生成する', () => {
        const html = getHashAlgoSelectHtml();

        expect(html).toContain('<select id="opt-hashAlgo">');
        expect(html).toContain('value="md5"');
        expect(html).toContain('value="sha256"');
    });

    it('computeHash: md5を計算できる', async () => {
        const data = new TextEncoder().encode('hello');
        const digest = await computeHash(data, 'md5');
        const hex = encodeOutput(digest, 'hex-string');

        expect(hex).toBe('5d41402abc4b2a76b9719d911017c592');
    });
});
