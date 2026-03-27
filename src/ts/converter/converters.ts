import type { Converter } from './types';
import { lineBreakByLengthConverter } from './line-break-by-length';
import { utf8ToBase64Converter } from './utf8-to-base64';

export const CONVERTERS: Converter[] = [utf8ToBase64Converter, lineBreakByLengthConverter];
