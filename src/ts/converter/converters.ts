import type { Converter } from './types';
import { binaryConverter } from './binary/utf8-to-base64';
import { lineBreakByLengthConverter } from './format/line-break-by-length';

export const CONVERTERS: Converter[] = [binaryConverter, lineBreakByLengthConverter];
