import { describe, expect, it } from 'vitest';
import { installIndexedDbMock } from '../test-helpers/indexeddb-mock';

describe('Settings', () => {
  it('デフォルト値を返す', async () => {
    installIndexedDbMock();
    const { Settings } = await import('../../../src/ts/storage/settings');

    const settings = new Settings();

    expect(settings.inputText).toBe('');
    expect(settings.inputPaneRatio).toBe(0.5);
    expect(settings.outputPaneRatio).toBe(0.5);
    expect(settings.toInputMode).toBe('copy');
  });
});
