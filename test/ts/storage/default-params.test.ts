import { describe, expect, it } from 'vitest';
import { installIndexedDbMock } from '../test-helpers/indexeddb-mock';

describe('DefaultParams', () => {
    it('初期値は空のオブジェクト', async () => {
        installIndexedDbMock();
        const { DefaultParams } = await import('../../../src/ts/storage/default-params');

        const params = new DefaultParams();

        expect(params.value).toEqual({});
    });
});
