import { describe, expect, it } from 'vitest';
import { installIndexedDbMock } from '../test-helpers/indexeddb-mock';

describe('SuconvDatabase', () => {
  it('openDatabase: DBを開ける', async () => {
    installIndexedDbMock();
    const { SuconvDatabase } = await import('../../../src/ts/storage/suconv-database');

    const db = await SuconvDatabase.openDatabase();

    expect(db).toBeDefined();
  });
});
