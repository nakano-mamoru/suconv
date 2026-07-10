import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';

type GenerateMode = 'repeat' | 'shuffle' | 'guid' | 'password';

const DIGITS = '0123456789';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DEFAULT_SYMBOLS = '/*-+.,!#$%&()~|_';

function randomInt(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateGuid(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateRepeat(text: string, length: number): string {
  const stripped = text.replace(/\r\n|\r|\n/g, '');
  if (stripped.length === 0) return '';
  const chars = Array.from(stripped);
  return Array.from({ length }, (_, i) => chars[i % chars.length]).join('');
}

function generateShuffle(text: string, length: number): string {
  const stripped = text.replace(/\r\n|\r|\n/g, '');
  if (stripped.length === 0) return '';
  const chars = shuffleArray(Array.from(stripped));
  return Array.from({ length }, (_, i) => chars[i % chars.length]).join('');
}

function generatePassword(length: number, pools: string[]): string {
  if (pools.length === 0) return '';
  const combined = Array.from(pools.join(''));
  if (length >= pools.length) {
    const guaranteed = pools.map((pool) => {
      const poolChars = Array.from(pool);
      return poolChars[randomInt(poolChars.length)];
    });
    const remaining = Array.from({ length: length - pools.length }, () => combined[randomInt(combined.length)]);
    return shuffleArray([...guaranteed, ...remaining]).join('');
  }
  return Array.from({ length }, () => combined[randomInt(combined.length)]).join('');
}

export const randomTextGenerator: Converter = {
  id: 'random-text-generator',
  name: '文字列生成',
  disableMultiline: true,
  description: () => `
    <p>任意の文字列を生成します。「行単位」は無視されます。</p>
    <div class="converter-options">
      <div>
        <label for="opt-mode">モード</label>
        <select id="opt-mode">
          <option value="password" selected>パスワード</option>
          <option value="guid">GUID</option>
          <option value="shuffle">入力テキストのシャッフル</option>
          <option value="repeat">入力テキストのリピート</option>
        </select>
      </div>
      <div id="grp-length">
        <label for="opt-length">文字数</label>
        <input id="opt-length" type="number" value="16" min="1">
      </div>
      <div>
        <label for="opt-lines">行数</label>
        <input id="opt-lines" type="number" value="10" min="1">
      </div>
      <div id="grp-charsets" class="side-by-side">
        <span>文字種</span><br>
        <label><input id="opt-useDigits" type="checkbox" checked> 数字</label>
        <label><input id="opt-useLowercase" type="checkbox" checked> 小文字アルファベット</label>
        <label><input id="opt-useUppercase" type="checkbox"> 大文字アルファベット</label>
        <label><input id="opt-useSymbols" type="checkbox" checked> 記号</label>
        <input id="opt-symbolChars" type="text" value="/*-+.,!#$%&()~|_" style="margin-left: 0.5em;" hidden>
      </div>
    </div>
  `,
  setupDescription(container: HTMLElement): void {
    const modeSelect = container.querySelector<HTMLSelectElement>('#opt-mode');
    const lengthGroup = container.querySelector<HTMLElement>('#grp-length');
    const charsetsGroup = container.querySelector<HTMLElement>('#grp-charsets');
    const useSymbolsCheck = container.querySelector<HTMLInputElement>('#opt-useSymbols');
    const symbolCharsInput = container.querySelector<HTMLInputElement>('#opt-symbolChars');
    if (!modeSelect) return;

    const update = (): void => {
      const mode = modeSelect.value as GenerateMode;
      if (lengthGroup) {
        lengthGroup.hidden = mode === 'guid';
      }
      if (charsetsGroup) {
        charsetsGroup.hidden = mode !== 'password';
      }
      if (symbolCharsInput) {
        symbolCharsInput.hidden = mode !== 'password' || useSymbolsCheck?.checked !== true;
      }
    };

    modeSelect.addEventListener('change', update);
    useSymbolsCheck?.addEventListener('change', update);
    update();
  },
  async convert(text, opts) {
    const mode = (opts['mode'] ?? 'password') as GenerateMode;
    const length = Number.parseInt(String(opts['length'] ?? '16'), 10);
    const lines = Number.parseInt(String(opts['lines'] ?? '10'), 10);

    const pools: string[] = [];
    if (opts['useDigits'] === true) pools.push(DIGITS);
    if (opts['useLowercase'] === true) pools.push(LOWERCASE);
    if (opts['useUppercase'] === true) pools.push(UPPERCASE);
    if (opts['useSymbols'] === true) pools.push(String(opts['symbolChars'] ?? DEFAULT_SYMBOLS));

    const generateLine = (): string => {
      switch (mode) {
        case 'repeat': return generateRepeat(text, length);
        case 'shuffle': return generateShuffle(text, length);
        case 'guid': return generateGuid();
        case 'password': return generatePassword(length, pools);
        default: return '';
      }
    };

    return ConverterResult.success(Array.from({ length: lines }, generateLine).join('\n'));
  },
};
