type SettingRecord = {
  key: string;
  value: unknown;
};

const DATABASE_NAME = 'suconv';
const DATABASE_VERSION = 3;
const SETTINGS_STORE_NAME = 'Settings';
const PREFERENCES_STORE_NAME = 'Preferences';
const DEFAULT_PARAMS_STORE_NAME = 'DefaultParams';
const INPUT_TEXT_KEY = 'inputText';
const INPUT_PANE_RATIO_KEY = 'inputPaneRatio';
const OUTPUT_PANE_RATIO_KEY = 'outputPaneRatio';
const CONVERTER_PANE_HEIGHT_PX_KEY = 'converterPaneHeightPx';
const LAST_CONVERTER_ID_KEY = 'lastConverterId';
const AUTO_CONVERT_ENABLED_KEY = 'autoConvertEnabled';
const LINE_BY_LINE_ENABLED_KEY = 'lineByLineEnabled';
const LINE_WRAP_ENABLED_KEY = 'lineWrapEnabled';
const MONOSPACE_FONT_ENABLED_KEY = 'monospaceFontEnabled';
const INPUT_TRANSFER_MODE_KEY = 'inputTransferMode';
const OUTPUT_TRANSFER_MODE_KEY = 'outputTransferMode';
const TO_INPUT_MODE_KEY = 'toInputMode';

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

  get lastConverterId(): string {
    const value = this.cache.get(LAST_CONVERTER_ID_KEY);
    return typeof value === 'string' ? value : '';
  }

  set lastConverterId(value: string) {
    this.cache.set(LAST_CONVERTER_ID_KEY, value);
    void this.setValue(LAST_CONVERTER_ID_KEY, value);
  }

  get autoConvertEnabled(): boolean {
    const value = this.cache.get(AUTO_CONVERT_ENABLED_KEY);
    return typeof value === 'boolean' ? value : false;
  }

  set autoConvertEnabled(value: boolean) {
    this.cache.set(AUTO_CONVERT_ENABLED_KEY, value);
    void this.setValue(AUTO_CONVERT_ENABLED_KEY, value);
  }

  get lineByLineEnabled(): boolean {
    const value = this.cache.get(LINE_BY_LINE_ENABLED_KEY);
    return typeof value === 'boolean' ? value : false;
  }

  set lineByLineEnabled(value: boolean) {
    this.cache.set(LINE_BY_LINE_ENABLED_KEY, value);
    void this.setValue(LINE_BY_LINE_ENABLED_KEY, value);
  }

  get lineWrapEnabled(): boolean {
    const value = this.cache.get(LINE_WRAP_ENABLED_KEY);
    return typeof value === 'boolean' ? value : true;
  }

  set lineWrapEnabled(value: boolean) {
    this.cache.set(LINE_WRAP_ENABLED_KEY, value);
    void this.setValue(LINE_WRAP_ENABLED_KEY, value);
  }

  get monospaceFontEnabled(): boolean {
    const value = this.cache.get(MONOSPACE_FONT_ENABLED_KEY);
    return typeof value === 'boolean' ? value : true;
  }

  set monospaceFontEnabled(value: boolean) {
    this.cache.set(MONOSPACE_FONT_ENABLED_KEY, value);
    void this.setValue(MONOSPACE_FONT_ENABLED_KEY, value);
  }

  get inputTransferMode(): 'text' | 'binary-hex' {
    const value = this.cache.get(INPUT_TRANSFER_MODE_KEY);
    return isTransferMode(value) ? value : 'text';
  }

  set inputTransferMode(value: 'text' | 'binary-hex') {
    this.cache.set(INPUT_TRANSFER_MODE_KEY, value);
    void this.setValue(INPUT_TRANSFER_MODE_KEY, value);
  }

  get outputTransferMode(): 'text' | 'binary-hex' {
    const value = this.cache.get(OUTPUT_TRANSFER_MODE_KEY);
    return isTransferMode(value) ? value : 'text';
  }

  set outputTransferMode(value: 'text' | 'binary-hex') {
    this.cache.set(OUTPUT_TRANSFER_MODE_KEY, value);
    void this.setValue(OUTPUT_TRANSFER_MODE_KEY, value);
  }

  get toInputMode(): 'copy' | 'swap' {
    const value = this.cache.get(TO_INPUT_MODE_KEY);
    return isToInputMode(value) ? value : 'copy';
  }

  set toInputMode(value: 'copy' | 'swap') {
    this.cache.set(TO_INPUT_MODE_KEY, value);
    void this.setValue(TO_INPUT_MODE_KEY, value);
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

    const storedLastConverterId = await this.getValue<string>(LAST_CONVERTER_ID_KEY);
    if (typeof storedLastConverterId === 'string') {
      this.cache.set(LAST_CONVERTER_ID_KEY, storedLastConverterId);
    }

    const storedAutoConvertEnabled = await this.getValue<boolean>(AUTO_CONVERT_ENABLED_KEY);
    if (typeof storedAutoConvertEnabled === 'boolean') {
      this.cache.set(AUTO_CONVERT_ENABLED_KEY, storedAutoConvertEnabled);
    }

    const storedLineByLineEnabled = await this.getValue<boolean>(LINE_BY_LINE_ENABLED_KEY);
    if (typeof storedLineByLineEnabled === 'boolean') {
      this.cache.set(LINE_BY_LINE_ENABLED_KEY, storedLineByLineEnabled);
    }

    const storedLineWrapEnabled = await this.getValue<boolean>(LINE_WRAP_ENABLED_KEY);
    if (typeof storedLineWrapEnabled === 'boolean') {
      this.cache.set(LINE_WRAP_ENABLED_KEY, storedLineWrapEnabled);
    }

    const storedMonospaceFontEnabled = await this.getValue<boolean>(MONOSPACE_FONT_ENABLED_KEY);
    if (typeof storedMonospaceFontEnabled === 'boolean') {
      this.cache.set(MONOSPACE_FONT_ENABLED_KEY, storedMonospaceFontEnabled);
    }

    const storedInputTransferMode = await this.getValue<string>(INPUT_TRANSFER_MODE_KEY);
    if (isTransferMode(storedInputTransferMode)) {
      this.cache.set(INPUT_TRANSFER_MODE_KEY, storedInputTransferMode);
    }

    const storedOutputTransferMode = await this.getValue<string>(OUTPUT_TRANSFER_MODE_KEY);
    if (isTransferMode(storedOutputTransferMode)) {
      this.cache.set(OUTPUT_TRANSFER_MODE_KEY, storedOutputTransferMode);
    }

    const storedToInputMode = await this.getValue<string>(TO_INPUT_MODE_KEY);
    if (isToInputMode(storedToInputMode)) {
      this.cache.set(TO_INPUT_MODE_KEY, storedToInputMode);
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
        if (!db.objectStoreNames.contains(DEFAULT_PARAMS_STORE_NAME)) {
          db.createObjectStore(DEFAULT_PARAMS_STORE_NAME, { keyPath: 'key' });
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

function isTransferMode(value: unknown): value is 'text' | 'binary-hex' {
  return value === 'text' || value === 'binary-hex';
}

function isToInputMode(value: unknown): value is 'copy' | 'swap' {
  return value === 'copy' || value === 'swap';
}

export const settings = new Settings();