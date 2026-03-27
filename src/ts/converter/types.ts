export type OptionValue = string | boolean;

import type { ConverterResult } from './converter-result';

export type CheckboxConverterOption = {
  id: string;
  label: string;
  type: 'checkbox';
  defaultValue: boolean;
};

export type TextConverterOption = {
  id: string;
  label: string;
  type: 'text';
  defaultValue: string;
};

export type SelectOptionItem = {
  value: string;
  label: string;
};

export type SelectConverterOption = {
  id: string;
  label: string;
  type: 'select';
  defaultValue: string;
  items: SelectOptionItem[];
};

export type BinFormatMode =
  | 'utf8-text'
  | 'hex-string'
  | 'base64-string'
  | 'decimal-comma'
  | 'hex-prefixed-comma';

export const BIN_FORMAT_OPTIONS: SelectOptionItem[] = [
  { value: 'utf8-text', label: 'テキスト (UTF-8)' },
  { value: 'hex-string', label: 'HEX文字列' },
  { value: 'base64-string', label: 'Base64文字列' },
  { value: 'decimal-comma', label: '10進数カンマ区切り' },
  { value: 'hex-prefixed-comma', label: '0xFF形式カンマ区切り' },
];

export type ConverterOption = CheckboxConverterOption | TextConverterOption | SelectConverterOption;

export type ConverterDescription = string | (() => string);

export type Converter = {
  id: string;
  name: string;
  description: ConverterDescription;
  options: ConverterOption[];
  preProcess?: (input: string, opts: Record<string, OptionValue>) => Promise<ConverterResult>;
  convert: (input: string, opts: Record<string, OptionValue>) => Promise<ConverterResult>;
  postProcess?: (output: string, opts: Record<string, OptionValue>) => Promise<ConverterResult>;
};
