import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';
import {
  COUNT_MODE_MAP,
  type CountMode,
  measureCharByCountMode,
  preprocessByCommonOptions,
} from '../../util/str-util';

const LINE_BREAK_CHAR_MAP: Record<string, string> = {
  'lf': '\n',
  'none': '',
  'escaped-lf': '\\n',
  'escaped-crlf': '\\r\\n',
  'br': '<br>',
};

const KINSOKU_HEAD = new Set('、。，．・：；？！）〕］｝〉》」』】ーっッゃャゅュょョぁぁぃィぅゥぇェぉォ…‥');
const KINSOKU_TAIL = new Set('（〔［｛〈《「『【');

function splitTextByMode(
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

    const charLength = measureCharByCountMode(char, countMode);

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

export const lineBreakByLengthConverter: Converter = {
  id: 'line-break-by-length',
  name: '文字列フォーマット',
  description: () => `
    <p>指定した文字数ごとに改行を入れます。</p>
    <div class="converter-options">
      <div>
        <label for="opt-charsPerLine">1行あたりの文字数</label>
        <div data-role="picker">
          <input id="opt-charsPerLine" type="text" value="72" />
          <button type="button" data-role="picker-toggle" aria-label="文字数候補を選択">▼</button>
          <div data-role="picker-popup" hidden>
            <div>
              <button type="button" data-value="72">72:RFC文書</button>
              <button type="button" data-value="80">80:UNIXやエディタ標準</button>
              <button type="button" data-value="64">64:証明書等</button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <label for="opt-splitMode">カウント方式</label>
        <select id="opt-splitMode">
          <option value="chars" selected>文字数</option>
          <option value="utf8-bytes">UTF8バイト数</option>
          <option value="sjis-bytes">SJISバイト数</option>
        </select>
      </div>
      <div>
        <label><input id="opt-stripTags" type="checkbox"> タグ除去（HTMLタグを除去します）</label>
      </div>
      <div>
        <label><input id="opt-trimWhitespace" type="checkbox" checked> 空白除去（行頭・行末の連続した空白文字、タブ文字を除去します）</label>
      </div>
      <div>
        <label><input id="opt-removeLineBreaks" type="checkbox" checked> 改行除去（すべての改行文字を削除します。「行単位」が優先されます）</label>
      </div>
      <div>
        <label><input id="opt-kinsoku" type="checkbox"> 禁則処理</label>
      </div>
      <div>
        <label for="opt-lineBreakChar">改行文字</label>
        <select id="opt-lineBreakChar">
          <option value="lf" selected>改行（\\n）</option>
          <option value="escaped-lf">改行文字（"\\n"）</option>
          <option value="escaped-crlf">改行文字（"\\r\\n"）</option>
          <option value="br">改行タグ &lt;br&gt;</option>
          <option value="none">なし</option>
        </select>
      </div>
    </div>
  `,
  async preProcess(text, opts) {
    const { charsPerLine, trimWhitespace, removeLineBreaks, stripTags } = opts;
    const parsedCharsPerLine = Number(String(charsPerLine).trim());
    if (!Number.isNaN(parsedCharsPerLine)) {
      opts.charsPerLine = String(parsedCharsPerLine);
    }
    return ConverterResult.success(preprocessByCommonOptions(text, trimWhitespace === true, removeLineBreaks === true, stripTags === true));
  },
  async convert(text, opts) {
    const {
      charsPerLine,
      lineBreakChar,
      splitMode,
      kinsoku,
      removeLineBreaks,
    } = opts;
    const parsedCharsPerLine = Number(String(charsPerLine).trim());
    if (Number.isNaN(parsedCharsPerLine) || parsedCharsPerLine <= 0) {
      return ConverterResult.success(text.replace(/\r\n|\r|\n/g, ''));
    }

    const lineBreakCharKey = (lineBreakChar ?? 'lf') as keyof typeof LINE_BREAK_CHAR_MAP;
    const splitModeKey = (splitMode ?? 'chars') as keyof typeof COUNT_MODE_MAP;
    const segments = splitTextByMode(
      text,
      parsedCharsPerLine,
      COUNT_MODE_MAP[splitModeKey],
      kinsoku === true,
      removeLineBreaks !== true,
    );
    return ConverterResult.success(segments.join(LINE_BREAK_CHAR_MAP[lineBreakCharKey]));
  },
};