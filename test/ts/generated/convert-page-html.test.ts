import { describe, expect, it } from 'vitest';
import { convertPageHtml } from '../../../src/ts/generated/convert-page-html';

describe('convertPageHtml', () => {
    it('主要DOM要素IDを含む', () => {
        expect(convertPageHtml).toContain('id="splitRoot"');
        expect(convertPageHtml).toContain('id="inputText"');
        expect(convertPageHtml).toContain('id="outputText"');
    });
});
