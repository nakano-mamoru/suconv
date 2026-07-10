import { describe, expect, it } from 'vitest';
import { buildInfo } from '../../../src/ts/generated/build-info';

describe('buildInfo', () => {
  it('buildDate/git情報を持つ', () => {
    expect(typeof buildInfo.buildDate).toBe('string');
    expect(typeof buildInfo.gitBranch).toBe('string');
    expect(typeof buildInfo.gitCommit).toBe('string');
    expect(buildInfo.gitCommit.length).toBeGreaterThan(6);
  });
});
