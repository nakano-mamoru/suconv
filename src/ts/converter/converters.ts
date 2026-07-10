import type { Converter } from './converter';
import { binaryConverter } from './binary/binary-converter';
import { hashCalculator } from './binary/hash-calculator';
import { lineBreakConverter } from './format/line-break-converter';
import { escapeStringConverter } from './format/escape-string';
import { prettierFormatConverter } from './format/prettier-format';
import { structuredDataConverter } from './format/structured-data';
import { arrayTableConverter } from './format/array-table';
import { textLengthCounter } from './utility/text-length-counter';
import { randomTextGenerator } from './utility/random-text-generator';
import { datetimeConverter } from './utility/datetime';
import { charWidthConverter } from './utility/char-width-converter';
import { variableNameConverter } from './utility/variable-name';
import { cryptoConverter } from './crypto';

export const CONVERTERS: Converter[] = [
	binaryConverter,
	hashCalculator,
	lineBreakConverter,
	escapeStringConverter,
	prettierFormatConverter,
	structuredDataConverter,
	arrayTableConverter,
	textLengthCounter,
	randomTextGenerator,
	datetimeConverter,
	charWidthConverter,
	variableNameConverter,
	cryptoConverter,
];
