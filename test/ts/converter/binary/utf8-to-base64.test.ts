import { describe, expect, it } from 'vitest';
import { binaryConverter } from '../../../../src/ts/converter/binary/utf8-to-base64';
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

  it('convert: 10進数カンマ区切りを0xFF形式カンマ区切りに変換する', async () => {
    const result = await binaryConverter.convert('10,255,0', opts('decimal-comma', 'hex-prefixed-comma'));

    expect(result).toEqual({ success: true, output: '0x0a,0xff,0x00' });
  });

  it('convert: Base64文字列を10進数カンマ区切りに変換する', async () => {
    const result = await binaryConverter.convert('Cv8A', opts('base64-string', 'decimal-comma'));

    expect(result).toEqual({ success: true, output: '10,255,0' });
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
