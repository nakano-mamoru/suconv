import type { Converter, OptionValue } from '../types';
import { ConverterResult } from '../converter-result';

const CHARS_PER_LINE_OPTION_ID = 'charsPerLine';

function parseCharsPerLine(opts: Record<string, OptionValue>): number | null {
  const raw = opts[CHARS_PER_LINE_OPTION_ID];
  if (typeof raw !== 'string') {
    return null;
  }

  const normalized = raw.trim();
  if (!/^[1-9][0-9]*$/.test(normalized)) {
    return null;
  }

  return Number.parseInt(normalized, 10);
}

export const lineBreakByLengthConverter: Converter = {
  id: 'line-break-by-length',
  name: '指定文字数で改行',
  description: () => '指定した文字数ごとに改行を入れます。',
  options: [
    {
      id: CHARS_PER_LINE_OPTION_ID,
      label: '1行あたりの文字数',
      type: 'text',
      defaultValue: '80',
    },
  ],
  async preProcess(input, opts) {
    const charsPerLine = parseCharsPerLine(opts);
    if (charsPerLine === null) {
      return ConverterResult.failure('エラー: 1行あたりの文字数には1以上の整数を入力してください。');
    }

    opts[CHARS_PER_LINE_OPTION_ID] = String(charsPerLine);
    return ConverterResult.success(input);
  },
  async convert(input, opts) {
    const charsPerLine = parseCharsPerLine(opts);
    if (charsPerLine === null) {
      return ConverterResult.failure('エラー: 1行あたりの文字数の解釈に失敗しました。');
    }

    const chars = Array.from(input);
    const lines: string[] = [];
    for (let i = 0; i < chars.length; i += charsPerLine) {
      lines.push(chars.slice(i, i + charsPerLine).join(''));
    }

    return ConverterResult.success(lines.join('\n'));
  },
};