export type CountMode = 'chars' | 'utf8-bytes' | 'sjis-bytes';

/**
 * 英単語の前後に半角空白を挿入します。
 * @param text 
 * @returns 
 */
export function normalizeWordSpacing(text: string) {
  return text
    .replace(/([ぁ-んァ-ヶ一-龯])([0-9A-Za-z]+)/g, '$1 $2')
    .replace(/([0-9A-Za-z]+)([ぁ-んァ-ヶ一-龯])/g, '$1 $2');
  // .replace(/([ぁ-んァ-ヶ一-龯、。，．！？：；）］】〉》」』])([0-9A-Za-z]+)/g, '$1 $2')
  // .replace(/([0-9A-Za-z]+)([ぁ-んァ-ヶ一-龯、。，．！？：；（［【〈《「『])/g, '$1 $2');
}

//TODO:汚い、バラしたい
export function normalizeText(text: string,
  trimWhitespace: boolean,
  nbsp2sp: boolean,
  removeEmptyLine: boolean,
  collapseMultipleSpaces: boolean,
  removeLineBreaks: boolean,
  stripTags = false,
  removeScriptBlock = false): string {
  // console.info(`collapseMultipleSpaces:${collapseMultipleSpaces}`)
  if (removeScriptBlock) {
    text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  }
  if (stripTags) {
    text = text.replace(
      /<\/(?:div|p|section|article|header|footer|main|aside|nav|h[1-6]|ul|ol|li|table|tr|thead|tbody|tfoot|blockquote|pre)>/gi,
      "\n"
    );
    text = text.replace(/<[^>]*>/g, '');
  }
  if (nbsp2sp) {
    text = text.replace(/(?:&nbsp;|\u00A0)/g, ' ');
  }
  if (removeEmptyLine) {
    text = text.replace(/^\s*\r?\n/gm, '');
  }

  if (collapseMultipleSpaces) {
    text = text.replace(/[ \t]+/g, ' ');
  }
  if (trimWhitespace) {
    text = text.split('\n').map((line) => line.replace(/^[ \t　]+|[ \t　]+$/g, '')).join('\n');
  }

  if (removeLineBreaks) {
    text = text.replace(/\r\n|\r|\n/g, '');
  }
  return text;
}

export function getByteSize(char: string, countMode: CountMode): number {
  switch (countMode) {
    case 'utf8-bytes':
      return new TextEncoder().encode(char).length;
    case 'sjis-bytes': {
      const codePoint = char.codePointAt(0) ?? 0;
      if (codePoint <= 0x7f || (codePoint >= 0xff61 && codePoint <= 0xff9f)) {
        return 1;
      }
      return 2;
    }
    default:
      return 1;
  }
}

function normalizeLineBreakForByteCount(text: string, lineBreakChar: string): string {
  if (lineBreakChar === 'crlf') {
    return text.replace(/\r\n|\r|\n/g, '\r\n');
  }

  return text.replace(/\r\n|\r|\n/g, '\n');
}

export function countTextByMode(text: string, countMode: CountMode, lineBreakChar: string): number {
  if (countMode === 'chars') {
    return Array.from(text).length;
  }

  const normalized = normalizeLineBreakForByteCount(text, lineBreakChar);
  return Array.from(normalized).reduce((sum, char) => sum + getByteSize(char, countMode), 0);
}

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

export function isDigit(code: number): boolean {
  return code >= 0x30 && code <= 0x39;
}

export function isAlpha(code: number): boolean {
  return (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a);
}

export function convertWidth(
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

const KINSOKU_HEAD = new Set('、。，．・：；？！）〕］｝〉》」』】ーっッゃャゅュょョぁぁぃィぅゥぇェぉォ…‥');
const KINSOKU_TAIL = new Set('（〔［｛〈《「『【');
export function splitText(
  text: string,
  limit: number,
  countMode: CountMode,
  useKinsoku: boolean,
  keepLineBreakBoundary: boolean,
): string[] {
  const chars = Array.from(text);
  const segments: string[] = [];
  let currentSegment = '';
  let currentLength = 0;
  let skipNextLf = false;

  chars.forEach((char, index) => {
    if (keepLineBreakBoundary) {
      if (skipNextLf && char === '\n') {
        skipNextLf = false;
        return;
      }
      skipNextLf = false;

      if (char === '\n' || char === '\r') {
        segments.push(currentSegment);
        currentSegment = '';
        currentLength = 0;
        if (char === '\r') {
          skipNextLf = true;
        }
        return;
      }
    }

    const charLength = getByteSize(char, countMode);

    currentSegment += char;
    currentLength += charLength;

    if (currentSegment.length > 0 && currentLength >= limit) {
      const nextChar = chars[index + 1];
      const shouldHoldByKinsoku = useKinsoku
        && (KINSOKU_TAIL.has(char) || (nextChar !== undefined && KINSOKU_HEAD.has(nextChar)));
      if (shouldHoldByKinsoku) {
        return;
      }

      segments.push(currentSegment);
      currentSegment = '';
      currentLength = 0;
    }
  });

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

