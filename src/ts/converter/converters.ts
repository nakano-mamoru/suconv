import type { Converter } from './converter';
import { binaryConverter } from './binary/utf8-to-base64';
import { lineBreakByLengthConverter } from './format/line-break-by-length';
import { countLengthConverter } from './utility/count-length';

export const CONVERTERS: Converter[] = [binaryConverter, lineBreakByLengthConverter, countLengthConverter];
