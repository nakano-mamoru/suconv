import { describe, expectTypeOf, it } from 'vitest';
import type { Converter } from '../../../src/ts/converter/converter';

describe('converter type', () => {
    it('Converter 型が convert 関数を持つ', () => {
        expectTypeOf<Converter>().toHaveProperty('id');
        expectTypeOf<Converter>().toHaveProperty('name');
        expectTypeOf<Converter>().toHaveProperty('convert');
    });
});
