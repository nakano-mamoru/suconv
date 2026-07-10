import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';
import {
  CountMode,
  countTextByMode,
  normalizeText,
} from '../../util/str-util';

export const textLengthCounter: Converter = {
  id: 'count-length',
  name: '文字数/バイト数をカウント',
  description: () => `
    <p>文字数またはバイト数をカウントします。</p>
    <div class="converter-options">
      <div>
        <label for="opt-splitMode">カウント方式</label>
        <select id="opt-splitMode">
          <option value="chars" selected>文字数</option>
          <option value="utf8-bytes">UTF8バイト数</option>
          <option value="sjis-bytes">SJISバイト数</option>
        </select>
      </div>
      <div>
        <label>
          <input id="opt-stripTags" type="checkbox"> タグ除去（HTMLタグを除去します）
        </label>
        <label>
          <input id="opt-removeScriptBlock" type="checkbox"> スクリプト除去（SCRIPTタグ内を除去します）
        </label>
      </div>
      <div>
        <label><input id="opt-trimWhitespace" type="checkbox" checked> 空白文字除去（行頭・行末の連続した空白文字、タブ文字を除去します）</label>
      </div>
      <div>
        <label><input id="opt-removeEmptyLine" type="checkbox" checked> 空行除去（空の行を削除します。「行単位」が優先されます）</label>
      </div>
      <div>
        <label><input id="opt-removeLineBreaks" type="checkbox" checked> 改行除去（すべての改行文字を削除します。「行単位」が優先されます）</label>
      </div>
      <div>
        <label for="opt-lineBreakChar">改行文字</label>
        <select id="opt-lineBreakChar">
          <option value="lf" selected>LF（\\n）</option>
          <option value="crlf">CR+LF（\\r\\n）</option>
        </select>
      </div>
    </div>
  `,
  async preProcess(text, opts) {
    const { trimWhitespace, removeLineBreaks, stripTags, removeScriptBlock, removeEmptyLine } = opts;
    return ConverterResult.success(normalizeText(text,
      trimWhitespace === true, removeEmptyLine === true, removeLineBreaks === true, stripTags === true, removeScriptBlock === true));
  },
  async convert(text, opts) {
    const { splitMode, lineBreakChar } = opts;
    const count = countTextByMode(text, splitMode as CountMode, String(lineBreakChar ?? 'lf'));
    return ConverterResult.success(String(count));
  },
};
