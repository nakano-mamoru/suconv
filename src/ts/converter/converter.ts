import type { ConverterResult } from './converter-result';
import type { ConverterParams } from './converter-params';

export type Converter = {
  id: string;
  name: string;
  description: () => string;
  disableMultiline?: boolean;
  setupDescription?: (container: HTMLElement) => void;
  swapMode?: (container: HTMLElement) => void;
  preProcess?: (input: string, opts: ConverterParams) => Promise<ConverterResult>;
  convert: (text: string, opts: ConverterParams) => Promise<ConverterResult>;
  postProcess?: (output: string, opts: ConverterParams) => Promise<ConverterResult>;
};
