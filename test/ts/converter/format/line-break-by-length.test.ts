import { describe, expect, it } from 'vitest';
import { lineBreakByLengthConverter } from '../../../../src/ts/converter/format/line-break-by-length';

describe('lineBreakByLengthConverter', () => {
  it('preProcess: 正常な文字数を正規化して成功を返す', async () => {
    const opts = { charsPerLine: ' 3 ' };

    const result = await lineBreakByLengthConverter.preProcess?.('abcdef', opts);

    expect(result).toEqual({ success: true, output: 'abcdef' });
    expect(opts.charsPerLine).toBe('3');
  });

  it('preProcess: 不正な文字数はエラーを返す', async () => {
    const opts = { charsPerLine: '0' };

    const result = await lineBreakByLengthConverter.preProcess?.('abcdef', opts);

    expect(result).toEqual({
      success: false,
      output: 'エラー: 1行あたりの文字数には1以上の整数を入力してください。',
    });
  });

  it('convert: 指定文字数ごとに改行を入れる（マルチバイト文字対応）', async () => {
    const result = await lineBreakByLengthConverter.convert('あいうえお', { charsPerLine: '2' });

    expect(result).toEqual({
      success: true,
      output: 'あい\nうえ\nお',
    });
  });

  it('convert: 解釈不能な文字数はエラーを返す', async () => {
    const result = await lineBreakByLengthConverter.convert('abcdef', { charsPerLine: 'abc' });

    expect(result).toEqual({
      success: false,
      output: 'エラー: 1行あたりの文字数の解釈に失敗しました。',
    });
  });

  it('postProcess: 未実装（undefined）である', () => {
    expect(lineBreakByLengthConverter.postProcess).toBeUndefined();
  });
});
