import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';

// 半角カタカナペア（濁点・半濁点付き） → 全角カタカナ
const HW_KANA_PAIRS: Record<string, string> = {
  'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
  'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
  'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
  'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
  'ｳﾞ': 'ヴ',
  'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
};

// 半角カタカナ単体 → 全角カタカナ
const HW_KANA_SINGLE: Record<string, string> = {
  '｡': '。', '｢': '「', '｣': '」', '､': '、', '･': '・',
  'ｦ': 'ヲ', 'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
  'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ', 'ｯ': 'ッ', 'ｰ': 'ー',
  'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
  'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
  'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
  'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
  'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
  'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
  'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
  'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
  'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
  'ﾜ': 'ワ', 'ﾝ': 'ン',
  'ﾞ': '゛', 'ﾟ': '゜',
};

// 全角カタカナ → 半角カタカナ (上記2マップの逆引き)
const FW_KANA: Record<string, string> = {};
for (const [hw, fw] of Object.entries(HW_KANA_PAIRS)) {
  FW_KANA[fw] = hw;
}
for (const [hw, fw] of Object.entries(HW_KANA_SINGLE)) {
  FW_KANA[fw] = hw;
}

function isDigit(code: number): boolean {
  return code >= 0x30 && code <= 0x39;
}

function isAlpha(code: number): boolean {
  return (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a);
}

function convertWidth(
  text: string,
  toFull: boolean,
  space: boolean,
  digit: boolean,
  alpha: boolean,
  symbol: boolean,
  kana: boolean,
): string {
  const chars = Array.from(text);
  let result = '';

  if (toFull) {
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      const pair = c + (i + 1 < chars.length ? chars[i + 1] : '');

      if (kana && HW_KANA_PAIRS[pair] !== undefined) {
        result += HW_KANA_PAIRS[pair];
        i++;
        continue;
      }
      if (kana && HW_KANA_SINGLE[c] !== undefined) {
        result += HW_KANA_SINGLE[c];
        continue;
      }

      const code = c.codePointAt(0)!;
      if (space && c === ' ') { result += '　'; continue; }
      if (digit && isDigit(code)) { result += String.fromCodePoint(code + 0xfee0); continue; }
      if (alpha && isAlpha(code)) { result += String.fromCodePoint(code + 0xfee0); continue; }
      if (symbol && code >= 0x21 && code <= 0x7e && !isDigit(code) && !isAlpha(code)) {
        result += String.fromCodePoint(code + 0xfee0);
        continue;
      }
      result += c;
    }
  } else {
    for (const c of chars) {
      if (kana && FW_KANA[c] !== undefined) { result += FW_KANA[c]; continue; }
      if (space && c === '　') { result += ' '; continue; }

      const code = c.codePointAt(0)!;
      if (code >= 0xff01 && code <= 0xff5e) {
        const halfCode = code - 0xfee0;
        if (digit && isDigit(halfCode)) { result += String.fromCodePoint(halfCode); continue; }
        if (alpha && isAlpha(halfCode)) { result += String.fromCodePoint(halfCode); continue; }
        if (symbol && !isDigit(halfCode) && !isAlpha(halfCode)) {
          result += String.fromCodePoint(halfCode);
          continue;
        }
      }
      result += c;
    }
  }

  return result;
}

export const widthConvertConverter: Converter = {
  id: 'width-convert',
  name: '全角/半角変換',
  description: () => `
    <p>全角文字と半角文字を相互に変換します。</p>
    <div class="converter-options">
      <div>
        <label for="opt-mode">変換方向</label>
        <select id="opt-mode">
          <option value="toFull" selected>半角を全角に</option>
          <option value="toHalf">全角を半角に</option>
        </select>
      </div>
      <div>
        <label><input id="opt-space" type="checkbox" checked> 空白文字</label>
        <label><input id="opt-digit" type="checkbox" checked> 数字</label>
        <label><input id="opt-alpha" type="checkbox" checked> アルファベット</label>
        <label><input id="opt-symbol" type="checkbox" checked> ASCII記号</label>
        <label><input id="opt-kana" type="checkbox" checked> カタカナ</label>
      </div>
    </div>
  `,
  async convert(text, opts) {
    if (text === '') return ConverterResult.success('');
    const toFull = opts['mode'] !== 'toHalf';
    const space = opts['space'] === true;
    const digit = opts['digit'] === true;
    const alpha = opts['alpha'] === true;
    const symbol = opts['symbol'] === true;
    const kana = opts['kana'] === true;
    return ConverterResult.success(convertWidth(text, toFull, space, digit, alpha, symbol, kana));
  },
};
