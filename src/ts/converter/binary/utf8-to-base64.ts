import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';
import { decodeInput, encodeOutput, getSelectHtml } from '../../util/bin-util';

export const binaryConverter: Converter = {
  id: 'byte-format-converter',
  name: 'バイト列表現変換',
  description: () => `
    <p>UTF-8テキスト、HEX、Base64、10進数CSV、0xFF形式CSVの間で相互変換します。</p>
    <div class="converter-options">
      <div>
        <label for="opt-inputMode">入力モード</label>
        ${getSelectHtml('opt-inputMode')}
      </div>
      <div>
        <label for="opt-outputMode">出力モード</label>
        ${getSelectHtml('opt-outputMode')}
      </div>
    </div>
  `,
  async convert(text, opts) {
    const { inputMode, outputMode } = opts;
    const inputBytes = decodeInput(text, inputMode as string);
    return ConverterResult.success(encodeOutput(inputBytes, outputMode as string));
  },
};