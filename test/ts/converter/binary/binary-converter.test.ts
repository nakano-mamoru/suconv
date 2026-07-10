import { describe, expect, it } from 'vitest';
import { binaryConverter } from '../../../../src/ts/converter/binary/binary-converter';
import type { ConverterParams } from '../../../../src/ts/converter/converter-params';
import type { BinFormatMode } from '../../../../src/ts/util/bin-util';

function opts(inputMode: BinFormatMode, outputMode: BinFormatMode): ConverterParams {
  return {
    inputMode,
    outputMode,
  };
}

describe('binaryConverter', () => {
  it('convert: UTF-8テキストをBase64文字列に変換する', async () => {
    const result = await binaryConverter.convert('hello', opts('utf8-text', 'base64-string'));

    expect(result).toEqual({ success: true, output: 'aGVsbG8=' });
  });

  it('convert: HEX文字列をUTF-8テキストに変換する', async () => {
    const result = await binaryConverter.convert('e38182', opts('hex-string', 'utf8-text'));

    expect(result).toEqual({ success: true, output: 'あ' });
  });

  it('convert: UTF-8テキストをHEX文字列に変換する', async () => {
    const result = await binaryConverter.convert('abc', opts('utf8-text', 'hex-string'));

    expect(result).toEqual({ success: true, output: '616263' });
  });

  it('convert: 10進数カンマ区切りを16進数カンマ区切りに変換する', async () => {
    const result = await binaryConverter.convert('10,255,0', opts('decimal-comma', 'hex-prefixed-comma'));

    expect(result).toEqual({ success: true, output: '0x0a,0xff,0x00' });
  });

  it('convert: 16進数カンマ区切りで英大文字にする', async () => {
    const result = await binaryConverter.convert('10,255,0', { ...opts('decimal-comma', 'hex-prefixed-comma'), hexUppercase: true });

    expect(result).toEqual({ success: true, output: '0x0A,0xFF,0x00' });
  });

  it('convert: 10進数カンマ区切りで16バイト単位改行する', async () => {
    const input = Array.from({ length: 20 }, (_, i) => String(i)).join(',');
    const result = await binaryConverter.convert(input, { ...opts('decimal-comma', 'decimal-comma'), csvLineBreak: 'line' });

    const lines = (result as { success: true; output: string }).output.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[0]).toMatch(/,$/);
    expect(lines[0].split(',').filter(Boolean).length).toBe(16);
    expect(lines[1].split(',').filter(Boolean).length).toBe(4);
  });

  it('convert: 改行付き10進数カンマをデコードできる（ラウンドトリップ）', async () => {
    const original = Array.from({ length: 20 }, (_, i) => String(i)).join(',');
    const encoded = await binaryConverter.convert(original, { ...opts('decimal-comma', 'decimal-comma'), csvLineBreak: 'line' });
    const decoded = await binaryConverter.convert(encoded.output, opts('decimal-comma', 'decimal-comma'));

    expect(decoded.output).toBe(original);
  });

  it('convert: 改行付き16進数カンマをデコードできる（ラウンドトリップ）', async () => {
    const original = Array.from({ length: 20 }, (_, i) => `0x${i.toString(16).padStart(2, '0')}`).join(',');
    const encoded = await binaryConverter.convert(original, { ...opts('hex-prefixed-comma', 'hex-prefixed-comma'), csvLineBreak: 'line' });
    const decoded = await binaryConverter.convert(encoded.output, opts('hex-prefixed-comma', 'hex-prefixed-comma'));

    expect(decoded.output).toBe(original);
  });

  it('convert: HEX文字列を区切り付き形式に変換する', async () => {
    const input = 'deadbeef';
    const result = await binaryConverter.convert(input, { ...opts('hex-string', 'hex-string'), hexFormat: 'grouped' });

    expect(result).toEqual({ success: true, output: 'de ad be ef' });
  });

  it('convert: HEX文字列を英大文字に変換する', async () => {
    const result = await binaryConverter.convert('deadbeef', { ...opts('hex-string', 'hex-string'), hexUppercase: true });

    expect(result).toEqual({ success: true, output: 'DEADBEEF' });
  });

  it('convert: HEX文字列でダンプ形式を生成する', async () => {
    const result = await binaryConverter.convert('4142', { ...opts('hex-string', 'hex-string'), hexFormat: 'dump' });

    const lines = (result as { success: true; output: string }).output.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[0]).toMatch(/^\s+0/);     // header starts with spaces then '0'
    expect(lines[1]).toMatch(/^0000\s/);   // data row starts with address
  });

  it('convert: 区切り付きHEX文字列を入力として受け付ける', async () => {
    const result = await binaryConverter.convert('41 42 43', opts('hex-string', 'utf8-text'));

    expect(result).toEqual({ success: true, output: 'ABC' });
  });

  it('convert: Base64文字列を64文字改行で出力する', async () => {
    const longText = 'A'.repeat(60);
    const result = await binaryConverter.convert(longText, { ...opts('utf8-text', 'base64-string'), base64LineBreak: '64' });

    const lines = (result as { success: true; output: string }).output.split('\n');
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[0].length).toBe(64);
  });

  it('convert: Base64文字列を10進数カンマ区切りに変換する', async () => {
    const result = await binaryConverter.convert('Cv8A', opts('base64-string', 'decimal-comma'));

    expect(result).toEqual({ success: true, output: '10,255,0' });
  });

  it('convert: UTF-8テキストをBase64URL文字列に変換する', async () => {
    const result = await binaryConverter.convert('hello', opts('utf8-text', 'base64url-string'));

    expect(result).toEqual({ success: true, output: 'aGVsbG8' });
  });

  it('convert: Base64URL文字列（パディングなし）をUTF-8テキストに変換する', async () => {
    const result = await binaryConverter.convert('aGVsbG8', opts('base64url-string', 'utf8-text'));

    expect(result).toEqual({ success: true, output: 'hello' });
  });

  it('convert: Base64URLで+と/が-と_に置換される', async () => {
    // 0xFB 0xFF → Base64: +/8= → Base64URL: -_8
    const result = await binaryConverter.convert('0xfb,0xff', opts('hex-prefixed-comma', 'base64url-string'));

    expect(result).toEqual({ success: true, output: '-_8' });
  });

  it('convert: Base64URL文字列（-_記号含む）をデコードできる', async () => {
    const result = await binaryConverter.convert('-_8', opts('base64url-string', 'hex-prefixed-comma'));

    expect(result).toEqual({ success: true, output: '0xfb,0xff' });
  });

  it('convert: inputMode が無い場合はdecodeInputで例外になる', async () => {
    await expect(
      binaryConverter.convert('abc', { outputMode: 'utf8-text' }),
    ).rejects.toThrow('入力モードが不正です。');
  });

  it('convert: 不正なoutputModeはencodeOutputで例外になる', async () => {
    await expect(
      binaryConverter.convert('', {
        inputMode: 'utf8-text',
        outputMode: 'invalid-mode',
      }),
    ).rejects.toThrow('出力モードが不正です。');
  });

  it('preProcess/postProcess: 未実装（undefined）である', () => {
    expect(binaryConverter.preProcess).toBeUndefined();
    expect(binaryConverter.postProcess).toBeUndefined();
  });
});
