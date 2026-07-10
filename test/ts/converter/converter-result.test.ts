import { describe, expect, it } from 'vitest';
import { ConverterResult } from '../../../src/ts/converter/converter-result';

describe('ConverterResult', () => {
    it('success: success=true で生成される', () => {
        const result = ConverterResult.success('ok');

        expect(result).toBeInstanceOf(ConverterResult);
        expect(result).toEqual({ success: true, output: 'ok' });
    });

    it('failure: success=false で生成される', () => {
        const result = ConverterResult.failure('ng');

        expect(result).toBeInstanceOf(ConverterResult);
        expect(result).toEqual({ success: false, output: 'ng' });
    });
});
