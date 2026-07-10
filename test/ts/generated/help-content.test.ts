import { describe, expect, it } from 'vitest';
import { helpContent } from '../../../src/ts/generated/help-content';

describe('helpContent', () => {
    it('主要キーのヘルプ文字列を持つ', () => {
        expect(helpContent.app).toContain('suconv ヘルプ');
        expect(helpContent['prettier-format']).toContain('Prettier');
    });
});
