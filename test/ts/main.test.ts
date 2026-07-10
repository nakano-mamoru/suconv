import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('main.ts', () => {
  it('ConvertPage を起動するエントリポイントを持つ', () => {
    const source = readFileSync(resolve('src/ts/main.ts'), 'utf8');

    expect(source).toContain("import { ConvertPage } from './convert-page';");
    expect(source).toContain('const page = new ConvertPage();');
    expect(source).toContain('await page.init();');
  });
});
