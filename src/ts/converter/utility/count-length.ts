import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';
import {
  COUNT_MODE_MAP,
  countTextByMode,
  preprocessByCommonOptions,
} from '../../util/str-util';

export const countLengthConverter: Converter = {
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
        <label><input id="opt-trimWhitespace" type="checkbox"> 空白除去（行頭・行末の連続した空白文字、タブ文字を除去します）</label>
      </div>
      <div>
        <label><input id="opt-removeLineBreaks" type="checkbox"> 改行除去（すべての改行文字を削除します。「行単位」が優先されます）</label>
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
    const { trimWhitespace, removeLineBreaks } = opts;
    return ConverterResult.success(preprocessByCommonOptions(text, trimWhitespace === true, removeLineBreaks === true));
  },
  async convert(text, opts) {
    const { splitMode, lineBreakChar } = opts;
    const splitModeKey = (splitMode ?? 'chars') as keyof typeof COUNT_MODE_MAP;
    const count = countTextByMode(text, COUNT_MODE_MAP[splitModeKey], String(lineBreakChar ?? 'lf'));
    return ConverterResult.success(String(count));
  },
};
