import { describe, expect, it } from 'vitest';
import { ConvertEngine } from '../../../src/ts/converter/convert-engine';
import type { Converter } from '../../../src/ts/converter/converter';

describe('ConvertEngine', () => {
  it('run: converter.convertが例外を投げた場合はfailureを返す', async () => {
    const throwingConverter: Converter = {
      id: 'throwing-converter',
      name: 'throwing',
      description: () => 'throws in convert',
      async convert() {
        throw new Error('boom');
      },
    };

    const engine = new ConvertEngine(throwingConverter);
    const result = await engine.run('input', {}, false);

    expect(result).toEqual({
      success: false,
      output: 'エラーが発生しました。',
    });
  });
});
