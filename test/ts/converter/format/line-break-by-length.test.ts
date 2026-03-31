import { describe, expect, it } from 'vitest';
import { lineBreakByLengthConverter } from '../../../../src/ts/converter/format/line-break-by-length';

describe('lineBreakByLengthConverter', () => {
  it('preProcess: 正常な文字数を正規化して成功を返す', async () => {
    const opts = { charsPerLine: ' 3 ' };

    const result = await lineBreakByLengthConverter.preProcess?.('abcdef', opts);

    expect(result).toEqual({ success: true, output: 'abcdef' });
    expect(opts.charsPerLine).toBe('3');
  });

  it('preProcess: 数値キャスト可能な文字数は受け入れる', async () => {
    const opts = { charsPerLine: '0' };

    const result = await lineBreakByLengthConverter.preProcess?.('abcdef', opts);

    expect(result).toEqual({ success: true, output: 'abcdef' });
    expect(opts.charsPerLine).toBe('0');
  });

  it('convert: 指定文字数ごとに改行を入れる（マルチバイト文字対応）', async () => {
    const result = await lineBreakByLengthConverter.convert('あいうえお', { charsPerLine: '2' });

    expect(result).toEqual({
      success: true,
      output: 'あい\nうえ\nお',
    });
  });

  it('convert: splitMode=charsの場合、従来通り文字数で改行する', async () => {
    const result = await lineBreakByLengthConverter.convert('abcde', { charsPerLine: '2', splitMode: 'chars' });

    expect(result).toEqual({
      success: true,
      output: 'ab\ncd\ne',
    });
  });

  it('convert: splitMode=utf8-bytesの場合、UTF-8バイト数で改行する', async () => {
    const result = await lineBreakByLengthConverter.convert('あaいb', { charsPerLine: '4', splitMode: 'utf8-bytes' });

    expect(result).toEqual({
      success: true,
      output: 'あa\nいb',
    });
  });

  it('convert: splitMode=sjis-bytesの場合、ASCIIは1バイト、その他は2バイトで改行する', async () => {
    const result = await lineBreakByLengthConverter.convert('あaいb', { charsPerLine: '3', splitMode: 'sjis-bytes' });

    expect(result).toEqual({
      success: true,
      output: 'あa\nいb',
    });
  });

  it('convert: splitMode=sjis-bytesの場合、半角カタカナは1バイトとして扱う', async () => {
    const result = await lineBreakByLengthConverter.convert('ｱｲｳあ', { charsPerLine: '3', splitMode: 'sjis-bytes' });

    expect(result).toEqual({
      success: true,
      output: 'ｱｲｳ\nあ',
    });
  });

  it('convert: UTF-8/SJISバイト数モードでも文字の途中では分割しない', async () => {
    const utf8Result = await lineBreakByLengthConverter.convert('あい', { charsPerLine: '2', splitMode: 'utf8-bytes' });
    const sjisResult = await lineBreakByLengthConverter.convert('あい', { charsPerLine: '1', splitMode: 'sjis-bytes' });

    expect(utf8Result).toEqual({
      success: true,
      output: 'あ\nい',
    });
    expect(sjisResult).toEqual({
      success: true,
      output: 'あ\nい',
    });
  });

  it('convert: 解釈不能な文字数は改行なしで連結する', async () => {
    const result = await lineBreakByLengthConverter.convert('ab\ncd', { charsPerLine: 'abc' });

    expect(result).toEqual({
      success: true,
      output: 'abcd',
    });
  });

  it('postProcess: 未実装（undefined）である', () => {
    expect(lineBreakByLengthConverter.postProcess).toBeUndefined();
  });

  describe('preProcess: 空白除去', () => {
    it('trimWhitespace=trueの場合、各行の行頭・行末の半角空白を除去する', async () => {
      const opts = { charsPerLine: '5', trimWhitespace: true };

      const result = await lineBreakByLengthConverter.preProcess?.(' hello \n world ', opts);

      expect(result).toEqual({ success: true, output: 'hello\nworld' });
    });

    it('trimWhitespace=trueの場合、各行の行頭・行末の全角空白を除去する', async () => {
      const opts = { charsPerLine: '5', trimWhitespace: true };

      const result = await lineBreakByLengthConverter.preProcess?.('　hello　\n　world　', opts);

      expect(result).toEqual({ success: true, output: 'hello\nworld' });
    });

    it('trimWhitespace=trueの場合、各行の行頭・行末のタブ文字を除去する', async () => {
      const opts = { charsPerLine: '5', trimWhitespace: true };

      const result = await lineBreakByLengthConverter.preProcess?.('\thello\t\n\tworld\t', opts);

      expect(result).toEqual({ success: true, output: 'hello\nworld' });
    });

    it('trimWhitespace=falseの場合、空白文字を除去しない', async () => {
      const opts = { charsPerLine: '5', trimWhitespace: false };

      const result = await lineBreakByLengthConverter.preProcess?.(' hello \n world ', opts);

      expect(result).toEqual({ success: true, output: ' hello \n world ' });
    });
  });

  describe('preProcess: 改行除去', () => {
    it('removeLineBreaks=trueの場合、LFを除去する', async () => {
      const opts = { charsPerLine: '5', removeLineBreaks: true };

      const result = await lineBreakByLengthConverter.preProcess?.('hello\nworld', opts);

      expect(result).toEqual({ success: true, output: 'helloworld' });
    });

    it('removeLineBreaks=trueの場合、CRLFを除去する', async () => {
      const opts = { charsPerLine: '5', removeLineBreaks: true };

      const result = await lineBreakByLengthConverter.preProcess?.('hello\r\nworld', opts);

      expect(result).toEqual({ success: true, output: 'helloworld' });
    });

    it('removeLineBreaks=trueの場合、CRを除去する', async () => {
      const opts = { charsPerLine: '5', removeLineBreaks: true };

      const result = await lineBreakByLengthConverter.preProcess?.('hello\rworld', opts);

      expect(result).toEqual({ success: true, output: 'helloworld' });
    });

    it('removeLineBreaks=falseの場合、改行文字を除去しない', async () => {
      const opts = { charsPerLine: '5', removeLineBreaks: false };

      const result = await lineBreakByLengthConverter.preProcess?.('hello\nworld', opts);

      expect(result).toEqual({ success: true, output: 'hello\nworld' });
    });

    it('trimWhitespace=trueかつremoveLineBreaks=trueの場合、空白除去後に改行を除去する', async () => {
      const opts = { charsPerLine: '5', trimWhitespace: true, removeLineBreaks: true };

      const result = await lineBreakByLengthConverter.preProcess?.('　hello　\n　world　', opts);

      expect(result).toEqual({ success: true, output: 'helloworld' });
    });
  });

  describe('convert: 改行文字', () => {
    it('lineBreakCharが未指定の場合、\\nで区切る', async () => {
      const result = await lineBreakByLengthConverter.convert('abcdef', { charsPerLine: '3' });

      expect(result).toEqual({ success: true, output: 'abc\ndef' });
    });

    it('lineBreakChar=lfの場合、\\nで区切る', async () => {
      const result = await lineBreakByLengthConverter.convert('abcdef', { charsPerLine: '3', lineBreakChar: 'lf' });

      expect(result).toEqual({ success: true, output: 'abc\ndef' });
    });

    it('lineBreakChar=escaped-lfの場合、テキスト\\nで区切る', async () => {
      const result = await lineBreakByLengthConverter.convert('abcdef', { charsPerLine: '3', lineBreakChar: 'escaped-lf' });

      expect(result).toEqual({ success: true, output: 'abc\\ndef' });
    });

    it('lineBreakChar=escaped-crlfの場合、テキスト\\r\\nで区切る', async () => {
      const result = await lineBreakByLengthConverter.convert('abcdef', { charsPerLine: '3', lineBreakChar: 'escaped-crlf' });

      expect(result).toEqual({ success: true, output: 'abc\\r\\ndef' });
    });

    it('lineBreakChar=brの場合、<br>で区切る', async () => {
      const result = await lineBreakByLengthConverter.convert('abcdef', { charsPerLine: '3', lineBreakChar: 'br' });

      expect(result).toEqual({ success: true, output: 'abc<br>def' });
    });

    it('lineBreakChar=noneの場合、区切り文字なしで連結する', async () => {
      const result = await lineBreakByLengthConverter.convert('abcdef', { charsPerLine: '3', lineBreakChar: 'none' });

      expect(result).toEqual({ success: true, output: 'abcdef' });
    });
  });

  describe('convert: 分割モード', () => {
    it('splitMode未指定時は文字数モードとして扱う', async () => {
      const result = await lineBreakByLengthConverter.convert('abcdef', { charsPerLine: '3' });

      expect(result).toEqual({ success: true, output: 'abc\ndef' });
    });

    it('splitModeが不正値でも変換処理を継続する', async () => {
      const result = await lineBreakByLengthConverter.convert('abcdef', { charsPerLine: '3', splitMode: 'invalid' });

      expect(result).toEqual({ success: true, output: 'abc\ndef' });
    });

    it('charsPerLineが0以下の場合、改行なしで連結する', async () => {
      const zeroResult = await lineBreakByLengthConverter.convert('ab\ncd', { charsPerLine: '0', lineBreakChar: 'lf' });
      const negativeResult = await lineBreakByLengthConverter.convert('ab\ncd', { charsPerLine: '-1', lineBreakChar: 'lf' });

      expect(zeroResult).toEqual({ success: true, output: 'abcd' });
      expect(negativeResult).toEqual({ success: true, output: 'abcd' });
    });

    it('改行除去しない場合、入力改行を行端として扱う', async () => {
      const result = await lineBreakByLengthConverter.convert('ab\ncd', {
        charsPerLine: '3',
        splitMode: 'chars',
      });

      expect(result).toEqual({ success: true, output: 'ab\ncd' });
    });
  });

  describe('convert: 禁則処理', () => {
    it('kinsoku=trueの場合、行頭禁則文字を前の行に移動する', async () => {
      // "abcd。" charsPerLine=2 → ["ab","cd","。"] → 。は行頭禁則 → ["ab","cd。"]
      const result = await lineBreakByLengthConverter.convert('abcd。', { charsPerLine: '2', kinsoku: true });

      expect(result).toEqual({ success: true, output: 'ab\ncd。' });
    });

    it('kinsoku=trueの場合、行末禁則文字を次の行に移動する', async () => {
      // 分割判定時に禁則を考慮するため、（での改行を保留して次の文字まで含める
      const result = await lineBreakByLengthConverter.convert('a（bcde', { charsPerLine: '2', kinsoku: true });

      expect(result).toEqual({ success: true, output: 'a（b\ncd\ne' });
    });

    it('kinsoku=trueの場合、行頭禁則文字が連続しても正しく処理する', async () => {
      // "ab、。cd" charsPerLine=2 → ["ab、","。cd"] → 。は行頭禁則 → ["ab、。","cd"]
      const result = await lineBreakByLengthConverter.convert('ab、。cd', { charsPerLine: '2', kinsoku: true });

      expect(result).toEqual({ success: true, output: 'ab、。\ncd' });
    });

    it('kinsoku=falseまたは未指定の場合、禁則処理を行わない', async () => {
      // "abcd。" charsPerLine=2 → ["ab","cd","。"] → そのまま
      const result = await lineBreakByLengthConverter.convert('abcd。', { charsPerLine: '2' });

      expect(result).toEqual({ success: true, output: 'ab\ncd\n。' });
    });
  });
});
