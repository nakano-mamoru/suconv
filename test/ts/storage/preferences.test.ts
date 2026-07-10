import { describe, expect, it } from 'vitest';
import { installIndexedDbMock } from '../test-helpers/indexeddb-mock';

describe('Preferences', () => {
  it('デフォルト値を返す', async () => {
    installIndexedDbMock();
    const { Preferences } = await import('../../../src/ts/storage/preferences');

    const preference = new Preferences();

    expect(preference.themeId).toBe('light');
    expect(preference.spellCheckEnabled).toBe(false);
  });
});
