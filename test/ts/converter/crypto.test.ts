import { afterEach, describe, expect, it, vi } from 'vitest';
import { cryptoConverter } from '../../../src/ts/converter/crypto';
import { secrets } from '../../../src/ts/storage/secrets';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('cryptoConverter', () => {
    it('鍵未登録状態では encrypt が失敗メッセージを返す', async () => {
        vi.spyOn(secrets, 'isAuthenticated', 'get').mockReturnValue(false);
        vi.spyOn(secrets, 'unused', 'get').mockReturnValue(true);

        const result = await cryptoConverter.convert('hello', {
            actionMode: 'encrypt',
            algorithm: 'AES256CBC',
            inputMode: 'text',
            outputMode: 'text',
        });

        expect(result).toEqual({ success: false, output: '鍵を登録してください。' });
    });

    it('未認証状態で addKey は登録要求エラーを投げる', async () => {
        vi.spyOn(secrets, 'isAuthenticated', 'get').mockReturnValue(false);
        vi.spyOn(secrets, 'unused', 'get').mockReturnValue(true);

        await expect(
            cryptoConverter.convert('', {
                actionMode: 'addKey',
                algorithm: 'AES256CBC',
                inputMode: 'text',
                newKeyName: 'app-key',
            }),
        ).rejects.toThrow('SECRETS_REGISTER_REQUIRED');
    });

    it('認証済みで keyName 未指定なら失敗メッセージを返す', async () => {
        vi.spyOn(secrets, 'isAuthenticated', 'get').mockReturnValue(true);

        const result = await cryptoConverter.convert('hello', {
            actionMode: 'encrypt',
            algorithm: 'AES256CBC',
            inputMode: 'text',
            outputMode: 'text',
            keyName: '',
        });

        expect(result).toEqual({ success: false, output: '鍵を選択してください。' });
    });
});
