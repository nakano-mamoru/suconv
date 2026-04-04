import { describe, expect, it } from 'vitest';
import { escapeStringConverter } from '../../../../src/ts/converter/format/escape-string';

describe('escapeStringConverter', () => {
  it('HTMLエスケープを行う', async () => {
    const result = await escapeStringConverter.convert('<a&b>', {
      escapeMode: 'escape',
      escapeType: 'html',
    });

    expect(result).toEqual({ success: true, output: '&lt;a&amp;b&gt;' });
  });

  it('HTMLエスケープ: 数値文字参照オプション有り時は数値参照を使用する', async () => {
    const result = await escapeStringConverter.convert('<a&b>', {
      escapeMode: 'escape',
      escapeType: 'html',
      useEntityReference: true,
    });

    expect(result).toEqual({ success: true, output: '&#60;a&#38;b&#62;' });
  });

  it('XMLエスケープを行う', async () => {
    const result = await escapeStringConverter.convert('<a&b>', {
      escapeMode: 'escape',
      escapeType: 'xml',
    });

    expect(result).toEqual({ success: true, output: '&lt;a&amp;b&gt;' });
  });

  it('XMLエスケープ: 数値文字参照オプション有り時は数値参照を使用する', async () => {
    const result = await escapeStringConverter.convert('<a&b>', {
      escapeMode: 'escape',
      escapeType: 'xml',
      useEntityReference: true,
    });

    expect(result).toEqual({ success: true, output: '&#60;a&#38;b&#62;' });
  });

  it('HTMLアンエスケープを行う', async () => {
    const result = await escapeStringConverter.convert('&lt;a&amp;b&gt;', {
      escapeMode: 'unescape',
      escapeType: 'html',
    });

    expect(result).toEqual({ success: true, output: '<a&b>' });
  });

  it('URLエスケープ/アンエスケープを行う', async () => {
    const escaped = await escapeStringConverter.convert('a b+c', {
      escapeMode: 'escape',
      escapeType: 'url',
    });
    const unescaped = await escapeStringConverter.convert(escaped.output, {
      escapeMode: 'unescape',
      escapeType: 'url',
    });

    expect(escaped).toEqual({ success: true, output: 'a%20b%2Bc' });
    expect(unescaped).toEqual({ success: true, output: 'a b+c' });
  });

  it('リテラル文字列エスケープ時はラップしない', async () => {
    const result = await escapeStringConverter.convert('a\n"b"', {
      escapeMode: 'escape',
      escapeType: 'literal',
    });

    expect(result).toEqual({ success: true, output: 'a\\n\\"b\\"' });
  });

  it('リテラル文字列アンエスケープ時はラップを外す', async () => {
    const result = await escapeStringConverter.convert('"a\\n\\\"b\\\""', {
      escapeMode: 'unescape',
      escapeType: 'literal',
    });

    expect(result).toEqual({ success: true, output: 'a\n"b"' });
  });

  it('リテラル: 実態参照文字チェック時は\\ux形式でエスケープ/アンエスケープする', async () => {
    const escaped = await escapeStringConverter.convert('あA', {
      escapeMode: 'escape',
      escapeType: 'literal',
      useEntityReference: true,
    });
    const unescaped = await escapeStringConverter.convert(escaped.output, {
      escapeMode: 'unescape',
      escapeType: 'literal',
      useEntityReference: true,
    });

    expect(escaped).toEqual({ success: true, output: '\\ux3042\\ux0041' });
    expect(unescaped).toEqual({ success: true, output: 'あA' });
  });


  it('半角空白をNBSPに置換する', async () => {
    const result = await escapeStringConverter.convert('a b', {
      escapeMode: 'escape',
      escapeType: 'html',
      replaceSpaceToNbsp: true,
    });

    expect(result).toEqual({ success: true, output: 'a&nbsp;b' });
  });
});
