import { SuconvDatabase } from './suconv-database';

export type SecretData = {
    name: string;
    purpose: string;
    data: string;
};

export type SecretMap = Record<string, SecretData>;

type SecretsRecord = {
    key:string | undefined;
    secretsJson: string;
    salt: string;
};

export class Secrets {
    public static readonly storeName = 'Secrets';
    public readonly defaultKey = 'default';
    private rawData: SecretsRecord = {
        key: undefined,
        secretsJson: '',
        salt: ''
    };
    private cryptoKey: CryptoKey | null = null;
    public readonly secretMap:SecretMap = {};

    public constructor() {
    }
    public initialize(): Promise<void> {
        return this.load();
    }
    // 未使用か調べます
    public get unused(): boolean {
        return this.rawData.salt.length === 0;
    }
    // 認証済か調べます
    public get isAuthenticated(): boolean {
        return this.cryptoKey != null;
    }
    // 認証済でない場合はエラーをスローします
    public checkAuthenticated(){
        if (!this.isAuthenticated) {
            throw new Error('Secrets is not ready');
        }
    }

    // public isReady(): boolean {
    //     return this.secretMap!['lastupdate'] !== undefined;
    // }
    // public isLoaded(): boolean {
    //     return this.rawData != null && this.rawData.key != null && this.rawData.key.length > 0;
    // }
    public get(name: string): {name: string, purpose: string, data: string} | undefined {
        return this.secretMap[name];
    }
    public put(name: string, purpose: string, data: string): void {
        this.secretMap[name] = {
            name,
            purpose,
            data
        };
    }
    private async loadSecretsMap(): Promise<void> {
        if (this.rawData.secretsJson.length === 0) {
            Object.assign(this.secretMap, {});
            return;
        }
        const data = await this.decrypt(this.rawData.secretsJson, this.cryptoKey!);
        const secrets: SecretMap = JSON.parse(new TextDecoder().decode(data));
        Object.assign(this.secretMap, secrets);
    }

    public async load(): Promise<void> {
        const record = await this.loadRawData();
        if (record) {
            this.rawData = record;
        }

        if (this.cryptoKey != null) {
            await this.loadSecretsMap();
        } else {
            Object.assign(this.secretMap, {});
        }
    }

    public async save(): Promise<void> {
        this.checkAuthenticated();
        this.secretMap['lastupdate'] = { name: 'lastupdate', purpose: 'Last Update', data: new Date().toISOString() };
        const data = new TextEncoder().encode(JSON.stringify(this.secretMap));
        this.rawData.secretsJson = await this.encrypt(data, this.cryptoKey!);
        await this.saveRowData(this.rawData);
    }

    public async setPassword(password: string): Promise<boolean> {
        let salt = this.rawData.salt;
        if (salt.length === 0) {
            salt = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
        }
        const cryptoKey = await this.deriveKey(password, new Uint8Array(this.base64ToArrayBuffer(salt)));
        if (this.rawData.salt.length > 0) {
            try {
                await this.decrypt(this.rawData.secretsJson, cryptoKey);
            } catch (e) {
                return false;
            }
        }
        this.cryptoKey = cryptoKey;
        this.rawData.salt = salt;
        await this.loadSecretsMap();
        return true;
    }
    public async isValidPassword(password: string): Promise<boolean> {
        let salt = this.rawData.salt;
        if (salt.length === 0) {
            return false;
        }
        try {
            const cryptoKey = await this.deriveKey(password, new Uint8Array(this.base64ToArrayBuffer(salt)));
            const data = await this.decrypt(this.rawData.secretsJson, cryptoKey!);
            return true;
        } catch (e) {
            console.error('Failed to derive key with the provided password', e);
            return false;
        }
    }

    public async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
        if (!await this.isValidPassword(oldPassword)) {
            return false;
        }
        const newCryptoKey = await this.deriveKey(newPassword, new Uint8Array(this.base64ToArrayBuffer(this.rawData.salt)));
        this.cryptoKey = newCryptoKey;
        return true;
    }

    arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveKey'],
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256',
            } as Pbkdf2Params,
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt'],
        );
    }



    async encrypt(data: Uint8Array, key: CryptoKey): Promise<string> {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            data as BufferSource,
        );

        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);

        return this.arrayBufferToBase64(combined.buffer);
    }

    async decrypt(encryptedBase64: string, key: CryptoKey): Promise<Uint8Array> {
        
        const combined = new Uint8Array(this.base64ToArrayBuffer(encryptedBase64));
        // IVは最初の12バイト、残りが暗号化されたデータ
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted,
        );
        return new Uint8Array(decrypted);
    }
    protected async loadRawData(): Promise<SecretsRecord | undefined> {
        const db = await SuconvDatabase.openDatabase();
        const record = await new Promise<SecretsRecord | undefined>((resolve, reject) => {
            const transaction = db.transaction(Secrets.storeName, 'readonly');
            const store = transaction.objectStore(Secrets.storeName);
            const request = store.get(this.defaultKey);

            request.addEventListener('success', () => {
                resolve(request.result);
            });
            request.addEventListener('error', () => reject(request.error));
        });

        if (!record) {
            return undefined;
        }
        return record;
    }

    public async saveRowData(rawData: SecretsRecord): Promise<void> {
        const db = await SuconvDatabase.openDatabase();

        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(Secrets.storeName, 'readwrite');
            const store = transaction.objectStore(Secrets.storeName);
            rawData.key = this.defaultKey;
            store.put(rawData);
            transaction.addEventListener('complete', () => resolve());
            transaction.addEventListener('error', () => reject(transaction.error));
        });
    }
}

export const secrets = new Secrets();
