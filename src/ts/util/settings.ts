type SettingRecord = {
  key: string;
  value: unknown;
};

const DATABASE_NAME = 'suconv';
const DATABASE_VERSION = 2;
const SETTINGS_STORE_NAME = 'Settings';
const PREFERENCES_STORE_NAME = 'Preferences';
const INPUT_TEXT_KEY = 'inputText';
const INPUT_PANE_RATIO_KEY = 'inputPaneRatio';
const OUTPUT_PANE_RATIO_KEY = 'outputPaneRatio';
const CONVERTER_PANE_HEIGHT_PX_KEY = 'converterPaneHeightPx';

export class Settings {
  private dbPromise: Promise<IDBDatabase>;
  private cache = new Map<string, unknown>();
  private initialized = false;

  constructor() {
    this.dbPromise = this.openDatabase();
  }

  get inputText(): string {
    const value = this.cache.get(INPUT_TEXT_KEY);
    return typeof value === 'string' ? value : '';
  }

  set inputText(value: string) {
    this.cache.set(INPUT_TEXT_KEY, value);
    void this.setValue(INPUT_TEXT_KEY, value);
  }

  get inputPaneRatio(): number {
    const value = this.cache.get(INPUT_PANE_RATIO_KEY);
    return isPaneRatio(value) ? value : 0.5;
  }

  set inputPaneRatio(value: number) {
    if (!isPaneRatio(value)) {
      return;
    }
    this.cache.set(INPUT_PANE_RATIO_KEY, value);
    void this.setValue(INPUT_PANE_RATIO_KEY, value);
  }

  get outputPaneRatio(): number {
    const value = this.cache.get(OUTPUT_PANE_RATIO_KEY);
    return isPaneRatio(value) ? value : 0.5;
  }

  set outputPaneRatio(value: number) {
    if (!isPaneRatio(value)) {
      return;
    }
    this.cache.set(OUTPUT_PANE_RATIO_KEY, value);
    void this.setValue(OUTPUT_PANE_RATIO_KEY, value);
  }

  get converterPaneHeightPx(): number {
    const value = this.cache.get(CONVERTER_PANE_HEIGHT_PX_KEY);
    return isPositiveNumber(value) ? Math.max(300, value) : 300;
  }

  set converterPaneHeightPx(value: number) {
    if (!isPositiveNumber(value)) {
      return;
    }
    const nextValue = Math.max(300, value);
    this.cache.set(CONVERTER_PANE_HEIGHT_PX_KEY, nextValue);
    void this.setValue(CONVERTER_PANE_HEIGHT_PX_KEY, nextValue);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const storedInputText = await this.getValue<string>(INPUT_TEXT_KEY);
    if (typeof storedInputText === 'string') {
      this.cache.set(INPUT_TEXT_KEY, storedInputText);
    }

    const storedInputPaneRatio = await this.getValue<number>(INPUT_PANE_RATIO_KEY);
    if (isPaneRatio(storedInputPaneRatio)) {
      this.cache.set(INPUT_PANE_RATIO_KEY, storedInputPaneRatio);
    }

    const storedOutputPaneRatio = await this.getValue<number>(OUTPUT_PANE_RATIO_KEY);
    if (isPaneRatio(storedOutputPaneRatio)) {
      this.cache.set(OUTPUT_PANE_RATIO_KEY, storedOutputPaneRatio);
    }

    const storedConverterPaneHeightPx = await this.getValue<number>(CONVERTER_PANE_HEIGHT_PX_KEY);
    if (isPositiveNumber(storedConverterPaneHeightPx)) {
      this.cache.set(CONVERTER_PANE_HEIGHT_PX_KEY, Math.max(300, storedConverterPaneHeightPx));
    }

    this.initialized = true;
  }

  async getValue<T>(key: string): Promise<T | undefined> {
    const db = await this.dbPromise;
    return await new Promise<T | undefined>((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE_NAME, 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE_NAME);
      const request = store.get(key);

      request.addEventListener('success', () => {
        const result = request.result as SettingRecord | undefined;
        const value = result?.value as T | undefined;
        if (value !== undefined) {
          this.cache.set(key, value);
        }
        resolve(value);
      });
      request.addEventListener('error', () => reject(request.error));
    });
  }

  async setValue<T>(key: string, value: T): Promise<void> {
    const db = await this.dbPromise;
    this.cache.set(key, value);

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE_NAME);
      store.put({ key, value } satisfies SettingRecord);

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

function isPaneRatio(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 1;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export const settings = new Settings();