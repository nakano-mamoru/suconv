import type { Converter } from './converter';
import { binaryConverter } from './binary/utf8-to-base64';
import { hashConverter } from './binary/hash';
import { lineBreakByLengthConverter } from './format/line-break-by-length';
import { escapeStringConverter } from './format/escape-string';
import { prettierFormatConverter } from './format/prettier-format';
import { structuredDataConverter } from './format/structured-data';
import { arrayTableConverter } from './format/array-table';
import { countLengthConverter } from './utility/count-length';
import { generateStringConverter } from './utility/generate-string';
import { datetimeConverter } from './utility/datetime';
import { widthConverter } from './utility/width-convert';
import { variableNameConverter } from './utility/variable-name';
import { cryptoConverter } from './crypto';

export const CONVERTERS: Converter[] = [
	binaryConverter,
	hashConverter,
	lineBreakByLengthConverter,
	escapeStringConverter,
	prettierFormatConverter,
	structuredDataConverter,
	arrayTableConverter,
	countLengthConverter,
	generateStringConverter,
	datetimeConverter,
	widthConverter,
	variableNameConverter,
	cryptoConverter,
];
