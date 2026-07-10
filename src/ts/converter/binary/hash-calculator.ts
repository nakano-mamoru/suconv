import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';
import { decodeInput, encodeOutput, getSelectHtml } from '../../util/bin-util';
import { getHashAlgoSelectHtml, HashAlgo, computeHash } from '../../util/hash-util'
const setupAbortControllers = new WeakMap<HTMLElement, AbortController>();

export const hashCalculator: Converter = {
  id: 'hash-converter',
  name: 'ハッシュ値（チェックサム）の計算',
  description: () => `
    <p>入力データのハッシュ値（チェックサム）を計算します。</p>
    <div class="converter-options">
      <div>
        <label for="opt-inputMode">入力モード</label>
        ${getSelectHtml('opt-inputMode')}
      </div>
      <div>
        <label for="opt-hashAlgo">アルゴリズム</label>
        ${getHashAlgoSelectHtml()}
      </div>
      <div>
        <label for="opt-outputMode">出力モード</label>
        ${getSelectHtml('opt-outputMode', ['utf8-text'])}
      </div>
    </div>
  `,
  setupDescription(container: HTMLElement): void {
    setupAbortControllers.get(container)?.abort();
    const ctrl = new AbortController();
    setupAbortControllers.set(container, ctrl);
    // console.info('setupDescription');
  },
  swapMode(container: HTMLElement): void {
    const inputSel = container.querySelector<HTMLSelectElement>('#opt-inputMode');
    const outputSel = container.querySelector<HTMLSelectElement>('#opt-outputMode');
    if (!inputSel || !outputSel) return;
    [inputSel.value, outputSel.value] = [outputSel.value, inputSel.value];
  },
  async convert(text, opts) {
    const inputMode = (opts.inputMode as string);
    const algo = (opts.hashAlgo as HashAlgo);
    const outputMode = (opts.outputMode as string);

    const inputBytes = decodeInput(text, inputMode);
    const hashBytes = await computeHash(inputBytes, algo);

    return ConverterResult.success(encodeOutput(hashBytes, outputMode, {
      hexFormat: opts.hexFormat as string,
      hexUppercase: opts.hexUppercase === true,
      base64LineBreak: (opts.base64LineBreak as string) ?? 'none',
      csvLineBreak: opts.csvLineBreak as string,
    }));
  },
};