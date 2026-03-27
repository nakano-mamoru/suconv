type PreferenceRecord = {
  key: string;
  value: unknown;
};

const DATABASE_NAME = 'suconv';
const DATABASE_VERSION = 2;
const SETTINGS_STORE_NAME = 'Settings';
const PREFERENCES_STORE_NAME = 'Preferences';
const THEME_ID_KEY = 'themeId';

export class Preference {
  private dbPromise: Promise<IDBDatabase>;
  private cache = new Map<string, unknown>();
  private initialized = false;

  constructor() {
    this.dbPromise = this.openDatabase();
  }

  get themeId(): string {
    const value = this.cache.get(THEME_ID_KEY);
    return typeof value === 'string' && value.length > 0 ? value : 'light';
  }

  set themeId(value: string) {
    this.cache.set(THEME_ID_KEY, value);
    void this.setValue(THEME_ID_KEY, value);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const storedThemeId = await this.getValue<string>(THEME_ID_KEY);
    if (typeof storedThemeId === 'string' && storedThemeId.length > 0) {
      this.cache.set(THEME_ID_KEY, storedThemeId);
    }

    this.initialized = true;
  }

  private async getValue<T>(key: string): Promise<T | undefined> {
    const db = await this.dbPromise;
    return await new Promise<T | undefined>((resolve, reject) => {
      const transaction = db.transaction(PREFERENCES_STORE_NAME, 'readonly');
      const store = transaction.objectStore(PREFERENCES_STORE_NAME);
      const request = store.get(key);

      request.addEventListener('success', () => {
        const result = request.result as PreferenceRecord | undefined;
        const value = result?.value as T | undefined;
        if (value !== undefined) {
          this.cache.set(key, value);
        }
        resolve(value);
      });
      request.addEventListener('error', () => reject(request.error));
    });
  }

  private async setValue<T>(key: string, value: T): Promise<void> {
    const db = await this.dbPromise;
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(PREFERENCES_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(PREFERENCES_STORE_NAME);
      store.put({ key, value } satisfies PreferenceRecord);

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
      });

      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
    });
  }
}

export const preference = new Preference();