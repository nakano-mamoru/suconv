import type { ConverterParams } from '../converter/converter-params';

type DefaultParamsRecord = {
  key: string;
  value: unknown;
};

const DATABASE_NAME = 'suconv';
const DATABASE_VERSION = 3;
const SETTINGS_STORE_NAME = 'Settings';
const PREFERENCES_STORE_NAME = 'Preferences';
const DEFAULT_PARAMS_STORE_NAME = 'DefaultParams';
const DEFAULT_PARAMS_KEY = 'defaultParams';

export class DefaultParams {
  private dbPromise: Promise<IDBDatabase>;
  private cache: ConverterParams = {};
  private initialized = false;

  constructor() {
    this.dbPromise = this.openDatabase();
  }

  get value(): ConverterParams {
    return { ...this.cache };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const stored = await this.getValue<ConverterParams>(DEFAULT_PARAMS_KEY);
    if (stored && typeof stored === 'object') {
      this.cache = filterParams(stored);
    }

    this.initialized = true;
  }

  async merge(params: ConverterParams): Promise<void> {
    this.cache = {
      ...this.cache,
      ...filterParams(params),
    };
    await this.setValue(DEFAULT_PARAMS_KEY, this.cache);
  }

  async clear(): Promise<void> {
    this.cache = {};
    await this.setValue(DEFAULT_PARAMS_KEY, this.cache);
  }

  private async getValue<T>(key: string): Promise<T | undefined> {
    const db = await this.dbPromise;
    return await new Promise<T | undefined>((resolve, reject) => {
      const transaction = db.transaction(DEFAULT_PARAMS_STORE_NAME, 'readonly');
      const store = transaction.objectStore(DEFAULT_PARAMS_STORE_NAME);
      const request = store.get(key);

      request.addEventListener('success', () => {
        const result = request.result as DefaultParamsRecord | undefined;
        resolve(result?.value as T | undefined);
      });
      request.addEventListener('error', () => reject(request.error));
    });
  }

  private async setValue<T>(key: string, value: T): Promise<void> {
    const db = await this.dbPromise;
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(DEFAULT_PARAMS_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(DEFAULT_PARAMS_STORE_NAME);
      store.put({ key, value } satisfies DefaultParamsRecord);

      transaction.addEventListener('complete', () => resolve());
      transaction.addEventListener('error', () => reject(transaction.error));
      transaction.addEventListener('abort', () => reject(transaction.error));
    });
  }

  private async openDatabase(): Promise<IDBDatabase> {
    return await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.addEventListener('upgradeneeded', () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
          db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(PREFERENCES_STORE_NAME)) {
          db.createObjectStore(PREFERENCES_STORE_NAME, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(DEFAULT_PARAMS_STORE_NAME)) {
          db.createObjectStore(DEFAULT_PARAMS_STORE_NAME, { keyPath: 'key' });
        }
      });

      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
    });
  }
}

function filterParams(params: ConverterParams): ConverterParams {
  const filtered: ConverterParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string' || typeof value === 'boolean') {
      filtered[key] = value;
    }
  });
  return filtered;
}

export const defaultParams = new DefaultParams();
