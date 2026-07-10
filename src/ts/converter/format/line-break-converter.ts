import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';
import {
  type CountMode,
  splitText,
  normalizeText,
  normalizeWordSpacing,
} from '../../util/str-util';

const LINE_BREAK_CHAR_MAP: Record<string, string> = {
  'lf': '\n',
  'none': '',
  'escaped-lf': '\\n',
  'escaped-crlf': '\\r\\n',
  'br': '<br>',
};

export const lineBreakConverter: Converter = {
  id: 'line-break',
  name: '文字列整形',
  description: () => `
    <p>文章を抜粋して指定した文字数ごとに改行を入れます。</p>
    <div class="converter-options">
      <div>
        <label>
          <input id="opt-stripTags" type="checkbox"> タグ除去（HTMLタグを除去します）
        </label>
        <label>
          <input id="opt-removeScriptBlock" type="checkbox"> スクリプト除去（SCRIPTタグ内を除去します）
        </label>
        <label>
          <input id="opt-br2cr" type="checkbox"> BRタグを改行に置換
        </label>
      </div>
      <div>
        <label><input id="opt-trimWhitespace" type="checkbox" checked> 空白文字除去（行頭・行末の連続した空白文字、タブ文字を除去します）</label>
      </div>
      <label>
        <input id="opt-nbsp2sp" type="checkbox"> &nbsp;(0xA0)を半角スペース(0x20)に変換
      </label>
      <div>
        <label><input id="opt-removeEmptyLine" type="checkbox" checked> 空行除去（空の行を削除します。「行単位」が優先されます）</label>
      </div>
      <div>
        <label><input id="opt-collapseMultipleSpaces" type="checkbox" checked> 複数のスペースを1つにまとめます。</label>
      </div>
      <div>
        <label><input id="opt-removeLineBreaks" type="checkbox" checked> 改行除去（すべての改行文字を削除します。「行単位」が優先されます）</label>
      </div>
      <div>
        <label><input id="opt-toNarrow" type="checkbox" checked> 全角英数字を半角に変換</label>
        <label><input id="opt-wordSpacing" type="checkbox" checked> 英単語の前後に空白挿入</label>
      </div>
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
    const { wordSpacing, charsPerLine, trimWhitespace, nbsp2sp, collapseMultipleSpaces, removeEmptyLine, removeLineBreaks, stripTags, removeScriptBlock, br2cr } = opts;
    if (br2cr === true) {
      text = text.replace(/<br[^>]*>/gim, '\n');
    }



    if (wordSpacing === true) {
      text = normalizeWordSpacing(text);
    }
    const parsedCharsPerLine = Number(String(charsPerLine).trim());
    if (!Number.isNaN(parsedCharsPerLine)) {
      opts.charsPerLine = String(parsedCharsPerLine);
    }
    return ConverterResult.success(normalizeText(
      text,
      trimWhitespace === true,
      nbsp2sp === true,
      removeEmptyLine === true,
      collapseMultipleSpaces === true,
      removeLineBreaks === true,
      stripTags === true,
      removeScriptBlock === true));

  },
  async convert(text, opts) {
    const {
      charsPerLine,
      lineBreakChar,
      splitMode,
      kinsoku,
      removeLineBreaks,
      collapseMultipleSpaces,
    } = opts;
    // console.info(`text:${text}`)
    const parsedCharsPerLine = Number(String(charsPerLine).trim());
    if (Number.isNaN(parsedCharsPerLine) || parsedCharsPerLine <= 0) {
      return ConverterResult.success(text.replace(/\r\n|\r|\n/g, ''));
    }
    collapseMultipleSpaces
    const lineBreakCharKey = (lineBreakChar ?? 'lf') as keyof typeof LINE_BREAK_CHAR_MAP;
    const segments = splitText(
      text,
      parsedCharsPerLine,
      splitMode as CountMode,
      kinsoku === true,
      removeLineBreaks !== true,
    );
    return ConverterResult.success(segments.join(LINE_BREAK_CHAR_MAP[lineBreakCharKey]));
  },
};