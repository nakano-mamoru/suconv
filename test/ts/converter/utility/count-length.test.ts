import { describe, expect, it } from 'vitest';
import { textLengthCounter } from '../../../../src/ts/converter/utility/text-length-counter';

describe('textLengthCounter', () => {
  it('convert: 文字数をカウントする', async () => {
    const result = await textLengthCounter.convert('あa', { splitMode: 'chars' });

    expect(result).toEqual({ success: true, output: '2' });
  });

  it('convert: UTF8バイト数をカウントする', async () => {
    const result = await textLengthCounter.convert('あa', { splitMode: 'utf8-bytes' });

    expect(result).toEqual({ success: true, output: '4' });
  });

  it('convert: SJISバイト数をカウントする（簡易方式）', async () => {
    const result = await textLengthCounter.convert('あaｱ', { splitMode: 'sjis-bytes' });

    expect(result).toEqual({ success: true, output: '4' });
  });

  it('convert: 改行文字がCR+LF指定ならバイト数を増幅する', async () => {
    const utf8Result = await textLengthCounter.convert('a\nb', {
      splitMode: 'utf8-bytes',
      lineBreakChar: 'crlf',
    });
    const sjisResult = await textLengthCounter.convert('a\nb', {
      splitMode: 'sjis-bytes',
      lineBreakChar: 'crlf',
    });

    expect(utf8Result).toEqual({ success: true, output: '4' });
    expect(sjisResult).toEqual({ success: true, output: '4' });
  });

  it('preProcess: 空白除去と改行除去がline-break-by-lengthと同じ挙動', async () => {
    const result = await textLengthCounter.preProcess?.('　 a \n b 　', {
      trimWhitespace: true,
      removeLineBreaks: true,
    });

    expect(result).toEqual({ success: true, output: 'ab' });
  });
});
