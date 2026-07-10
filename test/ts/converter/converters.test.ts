import { describe, expect, it } from 'vitest';
import { CONVERTERS } from '../../../src/ts/converter/converters';

describe('CONVERTERS', () => {
  it('主要コンバータIDを含む', () => {
    const ids = CONVERTERS.map((item) => item.id);

    expect(ids).toContain('byte-format-converter');
    expect(ids).toContain('hash-converter');
    expect(ids).toContain('line-break');
    expect(ids).toContain('escape-string');
    expect(ids).toContain('prettier-format');
    expect(ids).toContain('structured-data');
    expect(ids).toContain('array-table');
    expect(ids).toContain('count-length');
    expect(ids).toContain('random-text-generator');
    expect(ids).toContain('datetime-converter');
    expect(ids).toContain('char-width-convert');
    expect(ids).toContain('variable-name');
    expect(ids).toContain('cryptoCipher');
  });

  it('converter id が重複しない', () => {
    const ids = CONVERTERS.map((item) => item.id);
    const unique = new Set(ids);

    expect(unique.size).toBe(ids.length);
  });
});
