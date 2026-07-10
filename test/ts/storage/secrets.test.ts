import { describe, expect, it } from 'vitest';
import { Secrets } from '../../../src/ts/storage/secrets';

describe('Secrets', () => {
  it('初期状態は未使用・未認証', () => {
    const secrets = new Secrets();

    expect(secrets.unused).toBe(true);
    expect(secrets.isAuthenticated).toBe(false);
  });

  it('put/get で値を保持できる', () => {
    const secrets = new Secrets();
    secrets.put('k1', 'test', 'abc');

    expect(secrets.get('k1')).toEqual({ name: 'k1', purpose: 'test', data: 'abc' });
  });
});
