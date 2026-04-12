import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';

type CaseStyle = 'camel' | 'pascal' | 'snake' | 'constant' | 'kebab';

const INPUT_PATTERNS: Record<CaseStyle, string> = {
  camel:    '[a-zA-Z][a-zA-Z0-9]*',
  pascal:   '[A-Z][a-zA-Z0-9]*',
  snake:    '[a-z][a-z0-9_]*',
  constant: '[A-Z][A-Z0-9_]*',
  kebab:    '[a-z][a-z0-9-]*',
};

function tokenize(text: string, style: CaseStyle, abbrevUppercase: boolean): string[] {
  if (style === 'snake' || style === 'constant') {
    return text.split('_').map(s => s.toLowerCase()).filter(s => s.length > 0);
  }
  if (style === 'kebab') {
    return text.split('-').map(s => s.toLowerCase()).filter(s => s.length > 0);
  }

  // camelCase or PascalCase
  let s = text;

  // Split on digit/lowercase → uppercase boundary
  s = s.replace(/([a-z\d])([A-Z])/g, '$1_$2');

  if (abbrevUppercase) {
    // Treat consecutive uppercase runs as one acronym word.
    // Insert split before the last uppercase that is followed by lowercase.
    s = s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2');
  } else {
    // Split every uppercase→uppercase boundary (iterate until stable due to alternating matches).
    let prev = '';
    while (prev !== s) {
      prev = s;
      s = s.replace(/([A-Z])([A-Z])/g, '$1_$2');
    }
  }

  return s.split('_').map(t => t.toLowerCase()).filter(t => t.length > 0);
}

function assemble(words: string[], style: CaseStyle, abbrevUppercase: boolean): string {
  if (words.length === 0) return '';

  if (style === 'snake') return words.join('_');
  if (style === 'constant') return words.map(w => w.toUpperCase()).join('_');
  if (style === 'kebab') return words.join('-');

  // camelCase or PascalCase
  return words
    .map((word, i) => {
      if (style === 'camel' && i === 0) return word;
      if (abbrevUppercase && /^[a-z]{2}$/.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

export const variableNameConverter: Converter = {
  id: 'variable-name',
  name: '変数名変換',
  description: () => `
    <p>変数名の命名規則を変換します。</p>
    <div class="converter-options">
      <div>
        <label for="opt-inputMode">入力形式</label>
        <select id="opt-inputMode">
          <option value="camel" selected>camelCase</option>
          <option value="pascal">PascalCase</option>
          <option value="snake">snake_case</option>
          <option value="constant">CONSTANT_CASE</option>
          <option value="kebab">kebab-case</option>
        </select>
      </div>
      <div>
        <label for="opt-outputMode">出力形式</label>
        <select id="opt-outputMode">
          <option value="camel">camelCase</option>
          <option value="pascal">PascalCase</option>
          <option value="snake" selected>snake_case</option>
          <option value="constant">CONSTANT_CASE</option>
          <option value="kebab">kebab-case</option>
        </select>
      </div>
      <div>
        <label><input id="opt-abbrevUppercase" type="checkbox" checked> 2文字の略語を大文字にする</label>
      </div>
    </div>
  `,
  async convert(text, opts) {
    if (text === '') return ConverterResult.success('');
    const inputMode = (opts['inputMode'] ?? 'camel') as CaseStyle;
    const outputMode = (opts['outputMode'] ?? 'snake') as CaseStyle;
    const abbrevUppercase = opts['abbrevUppercase'] !== false;
    const pattern = new RegExp(INPUT_PATTERNS[inputMode], 'g');
    const result = text.replace(pattern, (match) => {
      const words = tokenize(match, inputMode, abbrevUppercase);
      return assemble(words, outputMode, abbrevUppercase);
    });
    return ConverterResult.success(result);
  },
  swapMode(container: HTMLElement): void {
    const inputSel = container.querySelector<HTMLSelectElement>('#opt-inputMode');
    const outputSel = container.querySelector<HTMLSelectElement>('#opt-outputMode');
    if (!inputSel || !outputSel) return;
    [inputSel.value, outputSel.value] = [outputSel.value, inputSel.value];
  },
};
