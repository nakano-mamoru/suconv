import { describe, expect, it } from 'vitest';
import { widthConvertConverter } from '../../../../src/ts/converter/utility/width-convert';

const FULL = 'toFull';
const HALF = 'toHalf';

function opts(
  mode: string,
  space = false,
  digit = false,
  alpha = false,
  symbol = false,
  kana = false,
) {
  return { mode, space, digit, alpha, symbol, kana };
}

describe('widthConvertConverter', () => {
  // --- 空入力 ---
  it('空入力 → 空出力', async () => {
    const result = await widthConvertConverter.convert('', opts(FULL, true, true, true, true, true));
    expect(result).toEqual({ success: true, output: '' });
  });

  // --- 空白文字 ---
  it('半角スペース → 全角スペース', async () => {
    const result = await widthConvertConverter.convert('a b', opts(FULL, true, false, false, false, false));
    expect(result.output).toBe('a\u3000b');
  });

  it('全角スペース → 半角スペース', async () => {
    const result = await widthConvertConverter.convert('a\u3000b', opts(HALF, true, false, false, false, false));
    expect(result.output).toBe('a b');
  });

  it('空白チェックOFF → スペースは変換しない', async () => {
    const result = await widthConvertConverter.convert('a b', opts(FULL, false, false, false, false, false));
    expect(result.output).toBe('a b');
  });

  // --- 数字 ---
  it('半角数字 → 全角数字', async () => {
    const result = await widthConvertConverter.convert('0123456789', opts(FULL, false, true, false, false, false));
    expect(result.output).toBe('０１２３４５６７８９');
  });

  it('全角数字 → 半角数字', async () => {
    const result = await widthConvertConverter.convert('０１２３４５６７８９', opts(HALF, false, true, false, false, false));
    expect(result.output).toBe('0123456789');
  });

  it('数字チェックOFF → 数字は変換しない', async () => {
    const result = await widthConvertConverter.convert('123', opts(FULL, false, false, false, false, false));
    expect(result.output).toBe('123');
  });

  // --- アルファベット ---
  it('半角英字(大文字) → 全角英字', async () => {
    const result = await widthConvertConverter.convert('ABC', opts(FULL, false, false, true, false, false));
    expect(result.output).toBe('ＡＢＣ');
  });

  it('半角英字(小文字) → 全角英字', async () => {
    const result = await widthConvertConverter.convert('abc', opts(FULL, false, false, true, false, false));
    expect(result.output).toBe('ａｂｃ');
  });

  it('全角英字 → 半角英字', async () => {
    const result = await widthConvertConverter.convert('ＡＢＣａｂｃ', opts(HALF, false, false, true, false, false));
    expect(result.output).toBe('ABCabc');
  });

  it('英字チェックOFF → 英字は変換しない', async () => {
    const result = await widthConvertConverter.convert('ABC', opts(FULL, false, false, false, false, false));
    expect(result.output).toBe('ABC');
  });

  // --- ASCII記号 ---
  it('半角記号 → 全角記号', async () => {
    const result = await widthConvertConverter.convert('!@#', opts(FULL, false, false, false, true, false));
    expect(result.output).toBe('！＠＃');
  });

  it('全角記号 → 半角記号', async () => {
    const result = await widthConvertConverter.convert('！＠＃', opts(HALF, false, false, false, true, false));
    expect(result.output).toBe('!@#');
  });

  it('記号チェックOFF → 記号は変換しない', async () => {
    const result = await widthConvertConverter.convert('!@#', opts(FULL, false, false, false, false, false));
    expect(result.output).toBe('!@#');
  });

  it('記号チェックON・数字チェックOFF → 数字は変換しない', async () => {
    const result = await widthConvertConverter.convert('1!2@', opts(FULL, false, false, false, true, false));
    expect(result.output).toBe('1！2＠');
  });

  it('記号チェックON・英字チェックOFF → 英字は変換しない', async () => {
    const result = await widthConvertConverter.convert('A!B@', opts(FULL, false, false, false, true, false));
    expect(result.output).toBe('A！B＠');
  });

  // --- カタカナ単体変換 ---
  it('半角カタカナ(単体) → 全角カタカナ', async () => {
    const result = await widthConvertConverter.convert('ｱｲｳｴｵ', opts(FULL, false, false, false, false, true));
    expect(result.output).toBe('アイウエオ');
  });

  it('全角カタカナ → 半角カタカナ', async () => {
    const result = await widthConvertConverter.convert('アイウエオ', opts(HALF, false, false, false, false, true));
    expect(result.output).toBe('ｱｲｳｴｵ');
  });

  it('半角小文字カタカナ → 全角', async () => {
    const result = await widthConvertConverter.convert('ｧｨｩｪｫ', opts(FULL, false, false, false, false, true));
    expect(result.output).toBe('ァィゥェォ');
  });

  it('全角小文字カタカナ → 半角', async () => {
    const result = await widthConvertConverter.convert('ァィゥェォ', opts(HALF, false, false, false, false, true));
    expect(result.output).toBe('ｧｨｩｪｫ');
  });

  // --- カタカナ濁点ペア変換 ---
  it('半角ｶﾞ → 全角ガ (濁点2文字→1文字)', async () => {
    const result = await widthConvertConverter.convert('ｶﾞｷﾞｸﾞｹﾞｺﾞ', opts(FULL, false, false, false, false, true));
    expect(result.output).toBe('ガギグゲゴ');
  });

  it('半角ｻﾞ〜ﾄﾞ → 全角濁点行', async () => {
    const result = await widthConvertConverter.convert('ｻﾞｼﾞｽﾞｾﾞｿﾞﾀﾞﾁﾞﾂﾞﾃﾞﾄﾞ', opts(FULL, false, false, false, false, true));
    expect(result.output).toBe('ザジズゼゾダヂヅデド');
  });

  it('半角ﾊﾞ〜ﾎﾞ、ｳﾞ → 全角バ行・ヴ', async () => {
    const result = await widthConvertConverter.convert('ﾊﾞﾋﾞﾌﾞﾍﾞﾎﾞｳﾞ', opts(FULL, false, false, false, false, true));
    expect(result.output).toBe('バビブベボヴ');
  });

  it('半角半濁点ﾊﾟ〜ﾎﾟ → 全角パ行', async () => {
    const result = await widthConvertConverter.convert('ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ', opts(FULL, false, false, false, false, true));
    expect(result.output).toBe('パピプペポ');
  });

  it('全角ガ → 半角ｶﾞ (1文字→2文字に展開)', async () => {
    const result = await widthConvertConverter.convert('ガギグゲゴ', opts(HALF, false, false, false, false, true));
    expect(result.output).toBe('ｶﾞｷﾞｸﾞｹﾞｺﾞ');
  });

  it('全角パ行 → 半角半濁点展開', async () => {
    const result = await widthConvertConverter.convert('パピプペポ', opts(HALF, false, false, false, false, true));
    expect(result.output).toBe('ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ');
  });

  it('全角ヴ → 半角ｳﾞ', async () => {
    const result = await widthConvertConverter.convert('ヴ', opts(HALF, false, false, false, false, true));
    expect(result.output).toBe('ｳﾞ');
  });

  // --- 句読点・記号カタカナ ---
  it('半角句読点・中点 → 全角', async () => {
    const result = await widthConvertConverter.convert('｡｢｣､･', opts(FULL, false, false, false, false, true));
    expect(result.output).toBe('。「」、・');
  });

  it('全角句読点・中点 → 半角', async () => {
    const result = await widthConvertConverter.convert('。「」、・', opts(HALF, false, false, false, false, true));
    expect(result.output).toBe('｡｢｣､･');
  });

  // --- 複合変換 ---
  it('全オプションON・半角混在テキスト → 全角変換', async () => {
    const result = await widthConvertConverter.convert('Hello 123!ｶﾞ', opts(FULL, true, true, true, true, true));
    expect(result.output).toBe('Ｈｅｌｌｏ　１２３！ガ');
  });

  it('全オプションON・全角混在テキスト → 半角変換', async () => {
    const result = await widthConvertConverter.convert('Ｈｅｌｌｏ　１２３！ガ', opts(HALF, true, true, true, true, false));
    expect(result.output).toBe('Hello 123!ガ');
  });

  it('カタカナチェックOFF → 半角カタカナは変換しない', async () => {
    const result = await widthConvertConverter.convert('ｱｲｳ', opts(FULL, true, true, true, true, false));
    expect(result.output).toBe('ｱｲｳ');
  });

  it('変換対象外の文字は変換しない(ひらがな等)', async () => {
    const result = await widthConvertConverter.convert('あいう漢字', opts(FULL, true, true, true, true, true));
    expect(result.output).toBe('あいう漢字');
  });

  it('長音符(ｰ) → 全角長音符(ー)', async () => {
    const result = await widthConvertConverter.convert('ｱｰ', opts(FULL, false, false, false, false, true));
    expect(result.output).toBe('アー');
  });

  it('ヲ・ン変換', async () => {
    const result = await widthConvertConverter.convert('ｦｯｰﾜﾝ', opts(FULL, false, false, false, false, true));
    expect(result.output).toBe('ヲッーワン');
  });
});
