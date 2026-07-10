import { convertWidth } from '../../util/str-util';
import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';

export const charWidthConverter: Converter = {
  id: 'char-width-convert',
  name: '全角/半角変換',
  description: () => `
    <p>全角文字と半角文字を相互に変換します。</p>
    <div class="converter-options">
      <div>
        <label for="opt-mode">変換方向</label>
        <select id="opt-mode">
          <option value="toFull">半角を全角に</option>
          <option value="toHalf" selected>全角を半角に</option>
        </select>
      </div>
      <div>
        <label><input id="opt-space" type="checkbox" checked> 空白文字</label>
        <label><input id="opt-digit" type="checkbox" checked> 数字</label>
        <label><input id="opt-alpha" type="checkbox" checked> アルファベット</label>
        <label><input id="opt-symbol" type="checkbox" checked> ASCII記号</label>
        <label><input id="opt-kana" type="checkbox"> カタカナ</label>
      </div>
    </div>
  `,
  swapMode(container: HTMLElement): void {
    const sel = container.querySelector<HTMLSelectElement>('#opt-mode');
    if (!sel) return;
    sel.value = sel.value === 'toFull' ? 'toHalf' : 'toFull';
  },
  async convert(text, opts) {
    if (text === '') return ConverterResult.success('');
    const toFull = (opts['mode'] ?? 'toHalf') !== 'toHalf';
    const space = opts['space'] === true;
    const digit = opts['digit'] === true;
    const alpha = opts['alpha'] === true;
    const symbol = opts['symbol'] === true;
    const kana = opts['kana'] === true;
    return ConverterResult.success(convertWidth(text, toFull, space, digit, alpha, symbol, kana));
  },
};
