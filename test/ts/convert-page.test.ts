import { describe, expect, it } from 'vitest';
import { installIndexedDbMock } from './test-helpers/indexeddb-mock';

describe('ConvertPage', () => {
    it('getHtml: ページHTMLを返す', async () => {
        installIndexedDbMock();
        const { ConvertPage } = await import('../../src/ts/convert-page');

        const page = new ConvertPage();
        const html = page.getHtml();

        expect(html).toContain('id="splitRoot"');
    });
});
