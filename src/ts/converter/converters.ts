import type { Converter } from './converter';
import { binaryConverter } from './binary/utf8-to-base64';
import { lineBreakByLengthConverter } from './format/line-break-by-length';
import { escapeStringConverter } from './format/escape-string';
import { countLengthConverter } from './utility/count-length';
import { generateStringConverter } from './utility/generate-string';

export const CONVERTERS: Converter[] = [
	binaryConverter,
	lineBreakByLengthConverter,
	escapeStringConverter,
	countLengthConverter,
	generateStringConverter,
];
