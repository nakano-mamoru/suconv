import { describe, expect, it } from 'vitest';
import { utf8ToBase64Converter } from '../../../src/ts/converter/utf8-to-base64';
import type { BinFormatMode, OptionValue } from '../../../src/ts/converter/types';

function opts(inputMode: BinFormatMode, outputMode: BinFormatMode): Record<string, OptionValue> {
  return { inputMode, outputMode };
}

describe('utf8ToBase64Converter', () => {
  it('convert: UTF-8テキストをBase64文字列に変換する', async () => {
    const result = await utf8ToBase64Converter.convert('hello', opts('utf8-text', 'base64-string'));

    expect(result).toEqual({ success: true, output: 'aGVsbG8=' });
  });

  it('convert: HEX文字列をUTF-8テキストに変換する', async () => {
    const result = await utf8ToBase64Converter.convert('e38182', opts('hex-string', 'utf8-text'));

    expect(result).toEqual({ success: true, output: 'あ' });
  });

  it('convert: Base64文字列をHEX文字列に変換する', async () => {
    const result = await utf8ToBase64Converter.convert('YWJj', opts('base64-string', 'hex-string'));

    expect(result).toEqual({ success: true, output: '616263' });
  });

  it('convert: 10進数カンマ区切りを0xFF形式カンマ区切りに変換する', async () => {
    const result = await utf8ToBase64Converter.convert(
      '10,255,0',
      opts('decimal-comma', 'hex-prefixed-comma'),
    );

    expect(result).toEqual({ success: true, output: '0x0a,0xff,0x00' });
  });

  it('convert: 0xFF形式カンマ区切りを10進数カンマ区切りに変換する', async () => {
    const result = await utf8ToBase64Converter.convert(
      '0x0A, 0xff,0x00',
      opts('hex-prefixed-comma', 'decimal-comma'),
    );

    expect(result).toEqual({ success: true, output: '10,255,0' });
  });

  it('convert: 奇数長のHEX文字列はエラーになる', async () => {
    const result = await utf8ToBase64Converter.convert('abc', opts('hex-string', 'utf8-text'));

    expect(result).toEqual({
      success: false,
      output: 'エラー: HEX文字列モードでは文字数を偶数にしてください。',
    });
  });

  it('convert: 不正なBase64文字列はエラーになる', async () => {
    const result = await utf8ToBase64Converter.convert('@@@', opts('base64-string', 'utf8-text'));

    expect(result).toEqual({
      success: false,
      output: 'エラー: Base64文字列の形式が不正です。',
    });
  });

  it('convert: 範囲外の10進数値はエラーになる', async () => {
    const result = await utf8ToBase64Converter.convert('256', opts('decimal-comma', 'hex-string'));

    expect(result).toEqual({
      success: false,
      output: 'エラー: 10進数カンマ区切りモードでは各値を0から255の範囲にしてください。',
    });
  });

  it('preProcess/postProcess: 未実装（undefined）である', () => {
    expect(utf8ToBase64Converter.preProcess).toBeUndefined();
    expect(utf8ToBase64Converter.postProcess).toBeUndefined();
  });
});
