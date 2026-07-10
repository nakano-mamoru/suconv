import { describe, expect, it } from 'vitest';
import { hashCalculator } from '../../../../src/ts/converter/binary/hash-calculator';

describe('hashCalculator', () => {
  it('convert: UTF-8文字列のMD5をHEX出力できる', async () => {
    const result = await hashCalculator.convert('hello', {
      inputMode: 'utf8-text',
      hashAlgo: 'md5',
      outputMode: 'hex-string',
    });

    expect(result).toEqual({
      success: true,
      output: '5d41402abc4b2a76b9719d911017c592',
    });
  });

  it('swapMode: input/output を入れ替える', () => {
    const input = { value: 'utf8-text' } as HTMLSelectElement;
    const output = { value: 'hex-string' } as HTMLSelectElement;
    const container = {
      querySelector<T>(selector: string): T | null {
        if (selector === '#opt-inputMode') return input as T;
        if (selector === '#opt-outputMode') return output as T;
        return null;
      },
    } as unknown as HTMLElement;

    hashCalculator.swapMode?.(container);

    expect(input.value).toBe('hex-string');
    expect(output.value).toBe('utf8-text');
  });
});
