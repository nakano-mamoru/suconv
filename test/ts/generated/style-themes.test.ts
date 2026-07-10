import { describe, expect, it } from 'vitest';
import { styleThemes } from '../../../src/ts/generated/style-themes';

describe('styleThemes', () => {
  it('テーマ一覧を持つ', () => {
    expect(styleThemes.length).toBeGreaterThan(0);
    expect(styleThemes.some((theme) => theme.id === 'light')).toBe(true);
  });
});
