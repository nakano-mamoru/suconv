import { describe, expect, it } from 'vitest';
import { prettierFormatConverter } from '../../../../src/ts/converter/format/prettier-format';

describe('prettierFormatConverter', () => {
  it('convert: JSONを整形する', async () => {
    const result = await prettierFormatConverter.convert('{"a":1,"b":2}', { inputFormat: 'json' });

    expect(result.success).toBe(true);
    expect(result.output).toContain('\n');
    expect(result.output).toContain('"a": 1');
  });

  it('convert: SQLを整形する', async () => {
    const result = await prettierFormatConverter.convert('select a,b from t', { inputFormat: 'sql' });

    expect(result.success).toBe(true);
    expect(result.output.toLowerCase()).toContain('select');
    expect(result.output.toLowerCase()).toContain('from');
  });

  it('convert: TOMLを整形する', async () => {
    const result = await prettierFormatConverter.convert('a=1\n[b]\nc=2', { inputFormat: 'toml' });

    expect(result.success).toBe(true);
    expect(result.output).toContain('a = 1');
    expect(result.output).toContain('[b]');
  });
});
