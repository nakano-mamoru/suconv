import { describe, expect, it } from 'vitest';
import {
    countTextByMode,
    convertWidth,
    getByteSize,
    normalizeText,
    normalizeWordSpacing,
    splitText,
} from '../../../src/ts/util/str-util';

describe('str-util', () => {
    it('normalizeWordSpacing: 日本語と英数字の境界に空白を入れる', () => {
        expect(normalizeWordSpacing('ABC日本語123')).toBe('ABC 日本語 123');
    });

    it('normalizeText: script/tag除去と空白正規化を行う', () => {
        const input = '<script>bad()</script><div> a\t\t b </div>\n<p>x</p>';
        const result = normalizeText(input, true, false, true, true, false, true, true);

        expect(result).toBe('a b\nx\n');
    });

    it('getByteSize/countTextByMode: UTF8/SJISの簡易バイト数を返す', () => {
        expect(getByteSize('あ', 'utf8-bytes')).toBe(3);
        expect(getByteSize('あ', 'sjis-bytes')).toBe(2);
        expect(countTextByMode('a\nb', 'utf8-bytes', 'crlf')).toBe(4);
    });

    it('convertWidth: 半角英数と半角カナを全角へ変換する', () => {
        const result = convertWidth('A1 ｶﾞ', true, true, true, true, false, true);

        expect(result).toBe('Ａ１　ガ');
    });

    it('splitText: 禁則ありで分割する', () => {
        const result = splitText('ab、。cd', 2, 'chars', true, false);

        expect(result).toEqual(['ab、。', 'cd']);
    });
});
