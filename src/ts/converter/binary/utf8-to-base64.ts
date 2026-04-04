import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';
import { decodeInput, encodeOutput, getSelectHtml } from '../../util/bin-util';

const setupAbortControllers = new WeakMap<HTMLElement, AbortController>();

export const binaryConverter: Converter = {
  id: 'byte-format-converter',
  name: 'バイナリデータ フォーマット変換',
  description: () => `
    <p>UTF-8テキスト、HEX、Base64、Base64URL、10進数CSV、16進数CSVの間で相互変換します。</p>
    <div class="converter-options">
      <div>
        <label for="opt-inputMode">入力モード</label>
        ${getSelectHtml('opt-inputMode')}
      </div>
      <div>
        <label for="opt-outputMode">出力モード</label>
        ${getSelectHtml('opt-outputMode')}
      </div>
      <div id="grp-base64-breaks" hidden>
        <label for="opt-base64LineBreak">改行</label>
        <select id="opt-base64LineBreak">
          <option value="none" selected>改行なし</option>
          <option value="64">64文字改行</option>
          <option value="76">76文字改行</option>
        </select>
      </div>
      <div id="grp-hex-format" hidden>
        <label for="opt-hexFormat">HEX形式</label>
        <select id="opt-hexFormat">
          <option value="flat" selected>フラット</option>
          <option value="grouped">区切り付き</option>
          <option value="dump">ダンプ形式</option>
        </select>
      </div>
      <div id="grp-hex-uppercase" hidden>
        <label><input id="opt-hexUppercase" type="checkbox"> 英大文字</label>
      </div>
      <div id="grp-csv-breaks" hidden>
        <label for="opt-csvLineBreak">改行</label>
        <select id="opt-csvLineBreak">
          <option value="none" selected>改行なし</option>
          <option value="line">改行あり（16バイト単位）</option>
        </select>
      </div>
    </div>
  `,
  setupDescription(container: HTMLElement): void {
    setupAbortControllers.get(container)?.abort();
    const ctrl = new AbortController();
    setupAbortControllers.set(container, ctrl);

    const outputModeSelect = container.querySelector<HTMLSelectElement>('#opt-outputMode');
    if (!outputModeSelect) return;
    const update = (): void => {
      const mode = outputModeSelect.value;
      const grpBase64 = container.querySelector<HTMLElement>('#grp-base64-breaks');
      const grpHexFormat = container.querySelector<HTMLElement>('#grp-hex-format');
      const grpHexUppercase = container.querySelector<HTMLElement>('#grp-hex-uppercase');
      const grpCsvBreaks = container.querySelector<HTMLElement>('#grp-csv-breaks');
      if (grpBase64) grpBase64.hidden = mode !== 'base64-string' && mode !== 'base64url-string';
      if (grpHexFormat) grpHexFormat.hidden = mode !== 'hex-string';
      if (grpHexUppercase) grpHexUppercase.hidden = mode !== 'hex-string' && mode !== 'hex-prefixed-comma';
      if (grpCsvBreaks) grpCsvBreaks.hidden = mode !== 'decimal-comma' && mode !== 'hex-prefixed-comma';
    };

    outputModeSelect.addEventListener('change', update, { signal: ctrl.signal });
      console.info( "setupDescription")
    update();
  },
  async convert(text, opts) {
    const inputBytes = decodeInput(text, opts.inputMode as string);
    return ConverterResult.success(encodeOutput(inputBytes, opts.outputMode as string, {
      hexFormat: opts.hexFormat as string,
      hexUppercase: opts.hexUppercase === true,
      base64LineBreak: opts.base64LineBreak as string,
      csvLineBreak: opts.csvLineBreak as string,
    }));
  },
};
