import {
  BIN_FORMAT_OPTIONS,
  type Converter,
} from '../types';
import { ConverterResult } from '../converter-result';
import { decodeInput, encodeOutput, resolveMode } from '../../util/bin-util';

const INPUT_MODE_OPTION_ID = 'inputMode';
const OUTPUT_MODE_OPTION_ID = 'outputMode';

export const binaryConverter: Converter = {
  id: 'byte-format-converter',
  name: 'バイト列表現変換',
  description: 'UTF-8テキスト、HEX、Base64、10進数CSV、0xFF形式CSVの間で相互変換します。',
  options: [
    {
      id: INPUT_MODE_OPTION_ID,
      label: '入力モード',
      type: 'select',
      defaultValue: 'utf8-text',
      items: BIN_FORMAT_OPTIONS,
    },
    {
      id: OUTPUT_MODE_OPTION_ID,
      label: '出力モード',
      type: 'select',
      defaultValue: 'base64-string',
      items: BIN_FORMAT_OPTIONS,
    },
  ],
  async convert(input, opts) {
    try {
      const inputMode = resolveMode(opts[INPUT_MODE_OPTION_ID], 'utf8-text');
      const outputMode = resolveMode(opts[OUTPUT_MODE_OPTION_ID], 'base64-string');
      const bytes = decodeInput(input, inputMode);
      return ConverterResult.success(encodeOutput(bytes, outputMode));
    } catch (error) {
      if (error instanceof Error) {
        return ConverterResult.failure(`エラー: ${error.message}`);
      }
      return ConverterResult.failure('エラー: 変換に失敗しました。');
    }
  },
};