import { describe, expectTypeOf, it } from 'vitest';
import type { ConverterParams } from '../../../src/ts/converter/converter-params';

describe('converter-params type', () => {
    it('ConverterParams は文字列または真偽値のRecord', () => {
        expectTypeOf<ConverterParams>().toExtend<Record<string, string | boolean>>();
    });
});
