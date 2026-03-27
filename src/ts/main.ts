import { CONVERTERS } from './converter/converters';
import type { Converter, OptionValue } from './converter/types';
import { ConvertEngine } from './converter/convert-engine';
import { styleThemes } from './generated/style-themes';
import { preference } from './storage/preference';
import { settings } from './storage/settings';

type TransferMode = 'text' | 'binary-hex';
type ThemeDefinition = {
  id: string;
  name: string;
};

const engine = new ConvertEngine(CONVERTERS[0]);

function requireElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing required element: #${id}`);
  }
  return el as T;
}

const converterSelect = requireElement<HTMLSelectElement>('converterSelect');
const splitRoot = requireElement<HTMLElement>('splitRoot');
const verticalSplitter = requireElement<HTMLElement>('verticalSplitter');
const horizontalSplitter = requireElement<HTMLElement>('horizontalSplitter');
const converterPane = requireElement<HTMLElement>('converterPane');
const converterDescription = requireElement<HTMLDivElement>('converterDescription');
const converterOptions = requireElement<HTMLDivElement>('converterOptions');
const inputModeWrapper = requireElement<HTMLDivElement>('inputModeWrapper');
const outputModeWrapper = requireElement<HTMLDivElement>('outputModeWrapper');
const inputModeToggleBtn = requireElement<HTMLButtonElement>('inputModeToggleBtn');
const inputModeMenu = requireElement<HTMLDivElement>('inputModeMenu');
const outputModeToggleBtn = requireElement<HTMLButtonElement>('outputModeToggleBtn');
const outputModeMenu = requireElement<HTMLDivElement>('outputModeMenu');
const loadBtn = requireElement<HTMLButtonElement>('loadBtn');
const loadFileInput = requireElement<HTMLInputElement>('loadFileInput');
const inputText = requireElement<HTMLTextAreaElement>('inputText');
const outputText = requireElement<HTMLTextAreaElement>('outputText');
const downloadBtn = requireElement<HTMLButtonElement>('downloadBtn');
const convertBtn = requireElement<HTMLButtonElement>('convertBtn');
const autoConvertCheck = requireElement<HTMLInputElement>('autoConvertCheck');
const lineByLineCheck = requireElement<HTMLInputElement>('lineByLineCheck');
const errorMsg = requireElement<HTMLDivElement>('errorMsg');
const clearInputBtn = requireElement<HTMLButtonElement>('clearInputBtn');
const copyInputBtn = requireElement<HTMLButtonElement>('copyInputBtn');
const toInputBtn = requireElement<HTMLButtonElement>('toInputBtn');
const copyOutputBtn = requireElement<HTMLButtonElement>('copyOutputBtn');
const preferencesBtn = requireElement<HTMLButtonElement>('preferencesBtn');
const preferenceDialogBackdrop = requireElement<HTMLDivElement>('preferenceDialogBackdrop');
const preferenceThemeSelect = requireElement<HTMLSelectElement>('preferenceThemeSelect');
const preferenceCancelBtn = requireElement<HTMLButtonElement>('preferenceCancelBtn');
const preferenceSaveBtn = requireElement<HTMLButtonElement>('preferenceSaveBtn');

let inputTransferMode: TransferMode = 'text';
let outputTransferMode: TransferMode = 'text';
let themes: ThemeDefinition[] = [];

const MIN_PANE_WIDTH = 280;
const MIN_MAIN_HEIGHT = 180;
const MIN_CONVERTER_HEIGHT = 300;
const SPLITTER_SIZE = 6;

function closeModeMenu(menu: HTMLDivElement): void {
  menu.classList.add('visually-hidden');
}

function toggleModeMenu(menu: HTMLDivElement): void {
  const isHidden = menu.classList.contains('visually-hidden');
  closeModeMenu(inputModeMenu);
  closeModeMenu(outputModeMenu);
  if (isHidden) {
    menu.classList.remove('visually-hidden');
  }
}

function parseTransferMode(value: string | undefined): TransferMode {
  return value === 'binary-hex' ? 'binary-hex' : 'text';
}

function setModeMenuActive(menu: HTMLDivElement, mode: TransferMode): void {
  const buttons = menu.querySelectorAll<HTMLButtonElement>('.mode-menu-button[data-mode]');
  buttons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mode === mode);
  });
}

function bindModeMenu(menu: HTMLDivElement, onChange: (mode: TransferMode) => void): void {
  const buttons = menu.querySelectorAll<HTMLButtonElement>('.mode-menu-button[data-mode]');
  buttons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const mode = parseTransferMode(button.dataset.mode);
      setModeMenuActive(menu, mode);
      onChange(mode);
      closeModeMenu(menu);
    });
  });
}

function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(Math.max(value, minValue), maxValue);
}

function resolveInputPaneRatio(): number {
  const inputRatio = settings.inputPaneRatio;
  const outputRatio = settings.outputPaneRatio;
  const sum = inputRatio + outputRatio;
  if (sum <= 0) {
    return 0.5;
  }
  return clamp(inputRatio / sum, 0.1, 0.9);
}

function setInputPaneRatio(ratio: number): number {
  const nextRatio = clamp(ratio, 0.1, 0.9);
  document.documentElement.style.setProperty('--left-pane-width', `${(nextRatio * 100).toFixed(4)}%`);
  return nextRatio;
}

function setConverterPaneHeightPx(heightPx: number): number {
  const rootRect = splitRoot.getBoundingClientRect();
  const maxConverterHeight = Math.max(MIN_CONVERTER_HEIGHT, rootRect.height - MIN_MAIN_HEIGHT - SPLITTER_SIZE);
  const nextHeight = clamp(heightPx, MIN_CONVERTER_HEIGHT, maxConverterHeight);
  document.documentElement.style.setProperty('--converter-pane-height', `${Math.round(nextHeight)}px`);
  return nextHeight;
}

function applySavedPaneLayout(): void {
  const inputRatio = setInputPaneRatio(resolveInputPaneRatio());
  const converterHeight = setConverterPaneHeightPx(settings.converterPaneHeightPx);
  settings.inputPaneRatio = inputRatio;
  settings.outputPaneRatio = 1 - inputRatio;
  settings.converterPaneHeightPx = converterHeight;
}

function setupSplitters(): void {
  let dragging: 'vertical' | 'horizontal' | null = null;
  let currentInputRatio = resolveInputPaneRatio();
  let currentConverterHeight = settings.converterPaneHeightPx;

  const onPointerMove = (event: PointerEvent): void => {
    if (!dragging) {
      return;
    }

    const rootRect = splitRoot.getBoundingClientRect();

    if (dragging === 'vertical') {
      const rawLeft = event.clientX - rootRect.left - SPLITTER_SIZE / 2;
      const maxLeft = Math.max(MIN_PANE_WIDTH, rootRect.width - MIN_PANE_WIDTH - SPLITTER_SIZE);
      const nextLeft = clamp(rawLeft, MIN_PANE_WIDTH, maxLeft);
      const paneTotalWidth = Math.max(1, rootRect.width - SPLITTER_SIZE);
      currentInputRatio = setInputPaneRatio(nextLeft / paneTotalWidth);
      return;
    }

    const rawMainHeight = event.clientY - rootRect.top - SPLITTER_SIZE / 2;
    const maxMainHeight = Math.max(MIN_MAIN_HEIGHT, rootRect.height - MIN_CONVERTER_HEIGHT - SPLITTER_SIZE);
    const mainHeight = clamp(rawMainHeight, MIN_MAIN_HEIGHT, maxMainHeight);
    currentConverterHeight = rootRect.height - mainHeight - SPLITTER_SIZE;
    currentConverterHeight = setConverterPaneHeightPx(currentConverterHeight);
  };

  const stopDragging = (): void => {
    if (dragging === 'vertical') {
      settings.inputPaneRatio = currentInputRatio;
      settings.outputPaneRatio = 1 - currentInputRatio;
    }

    if (dragging === 'horizontal') {
      settings.converterPaneHeightPx = currentConverterHeight;
    }

    dragging = null;
    document.body.classList.remove('is-resizing');
  };

  verticalSplitter.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    dragging = 'vertical';
    document.body.classList.add('is-resizing');
  });

  horizontalSplitter.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    dragging = 'horizontal';
    document.body.classList.add('is-resizing');
  });

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', stopDragging);
  window.addEventListener('pointercancel', stopDragging);

  window.addEventListener('resize', () => {
    currentInputRatio = setInputPaneRatio(resolveInputPaneRatio());
    currentConverterHeight = setConverterPaneHeightPx(settings.converterPaneHeightPx);
  });
}

function openPreferenceDialog(): void {
  preferenceDialogBackdrop.classList.remove('visually-hidden');
  preferenceDialogBackdrop.setAttribute('aria-hidden', 'false');
}

function closePreferenceDialog(): void {
  preferenceDialogBackdrop.classList.add('visually-hidden');
  preferenceDialogBackdrop.setAttribute('aria-hidden', 'true');
}

async function loadThemes(): Promise<ThemeDefinition[]> {
  return styleThemes.map((theme) => ({
    id: theme.id,
    name: theme.name,
  }));
}

function renderPreferenceThemeOptions(themeList: ThemeDefinition[]): void {
  preferenceThemeSelect.innerHTML = '';
  themeList.forEach((theme) => {
    const option = document.createElement('option');
    option.value = theme.id;
    option.textContent = theme.name;
    preferenceThemeSelect.appendChild(option);
  });
}

function applyTheme(themeId: string, themeList: ThemeDefinition[]): string {
  const selectedTheme = themeList.find((item) => item.id === themeId) ?? themeList[0];
  if (!selectedTheme) {
    return 'light';
  }

  Array.from(document.body.classList)
    .filter((cls) => cls.startsWith('theme_'))
    .forEach((cls) => document.body.classList.remove(cls));
  document.body.classList.add(`theme_${selectedTheme.id}`);

  preferenceThemeSelect.value = selectedTheme.id;
  return selectedTheme.id;
}

async function init(): Promise<void> {
  await settings.initialize();
  await preference.initialize();

  applySavedPaneLayout();

  themes = await loadThemes();
  renderPreferenceThemeOptions(themes);
  const appliedThemeId = applyTheme(preference.themeId, themes);
  preference.themeId = appliedThemeId;

  setupSplitters();

  CONVERTERS.forEach((conv) => {
    const option = document.createElement('option');
    option.value = conv.id;
    option.textContent = conv.name;
    converterSelect.appendChild(option);
  });

  renderConverterUI(CONVERTERS[0]);
  inputText.value = settings.inputText;

  converterSelect.addEventListener('change', () => {
    const conv = CONVERTERS.find((c) => c.id === converterSelect.value);
    if (conv) {
      engine.setConverter(conv);
      renderConverterUI(conv);
      outputText.value = '';
      errorMsg.textContent = '';
    }
  });

  inputText.addEventListener('input', () => {
    settings.inputText = inputText.value;
    if (autoConvertCheck.checked) {
      void runConvert();
    }
  });

  autoConvertCheck.addEventListener('change', () => {
    convertBtn.disabled = autoConvertCheck.checked;
    if (autoConvertCheck.checked) {
      void runConvert();
    }
  });

  bindModeMenu(inputModeMenu, (mode) => {
    inputTransferMode = mode;
  });

  bindModeMenu(outputModeMenu, (mode) => {
    outputTransferMode = mode;
  });

  inputModeToggleBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleModeMenu(inputModeMenu);
  });

  outputModeToggleBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleModeMenu(outputModeMenu);
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (!inputModeWrapper.contains(target)) {
      closeModeMenu(inputModeMenu);
    }
    if (!outputModeWrapper.contains(target)) {
      closeModeMenu(outputModeMenu);
    }
  });

  loadBtn.addEventListener('click', () => {
    loadFileInput.click();
  });

  loadFileInput.addEventListener('change', handleLoadFile);
  downloadBtn.addEventListener('click', handleDownload);
  convertBtn.addEventListener('click', runConvert);

  clearInputBtn.addEventListener('click', () => {
    inputText.value = '';
    settings.inputText = '';
    if (autoConvertCheck.checked) {
      void runConvert();
    }
  });

  copyInputBtn.addEventListener('click', () => {
    void navigator.clipboard.writeText(inputText.value);
  });

  toInputBtn.addEventListener('click', () => {
    inputText.value = outputText.value;
    settings.inputText = inputText.value;
    if (autoConvertCheck.checked) {
      void runConvert();
    }
  });

  copyOutputBtn.addEventListener('click', () => {
    void navigator.clipboard.writeText(outputText.value);
  });

  preferencesBtn.addEventListener('click', () => {
    preferenceThemeSelect.value = preference.themeId;
    openPreferenceDialog();
  });

  preferenceCancelBtn.addEventListener('click', () => {
    closePreferenceDialog();
  });

  preferenceSaveBtn.addEventListener('click', () => {
    const selectedThemeId = preferenceThemeSelect.value;
    const appliedId = applyTheme(selectedThemeId, themes);
    preference.themeId = appliedId;
    closePreferenceDialog();
  });

  preferenceDialogBackdrop.addEventListener('click', (event) => {
    if (event.target === preferenceDialogBackdrop) {
      closePreferenceDialog();
    }
  });

  closeModeMenu(inputModeMenu);
  closeModeMenu(outputModeMenu);
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function normalizeHex(text: string): string {
  return text.replace(/\s+/g, '').trim();
}

function hexToUint8Array(hex: string): Uint8Array {
  const normalizedHex = normalizeHex(hex);
  if (normalizedHex.length === 0) {
    return new Uint8Array();
  }
  if (!/^[0-9a-fA-F]+$/.test(normalizedHex)) {
    throw new Error('バイナリ(HEX)モードでは16進数のみ使用できます。');
  }
  if (normalizedHex.length % 2 !== 0) {
    throw new Error('バイナリ(HEX)モードでは文字数を偶数にしてください。');
  }

  const bytes = new Uint8Array(normalizedHex.length / 2);
  for (let index = 0; index < normalizedHex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalizedHex.slice(index, index + 2), 16);
  }
  return bytes;
}

function getCurrentDateFileName(extension: 'txt' | 'bin'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}.${extension}`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function readFileAsText(file: File): Promise<string> {
  return await file.text();
}

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

async function handleLoadFile(): Promise<void> {
  errorMsg.textContent = '';

  const file = loadFileInput.files?.[0];
  if (!file) {
    return;
  }

  try {
    const mode = inputTransferMode;
    if (mode === 'text') {
      inputText.value = await readFileAsText(file);
    } else {
      inputText.value = arrayBufferToHex(await readFileAsArrayBuffer(file));
    }

    settings.inputText = inputText.value;
  } catch (error) {
    if (error instanceof Error) {
      errorMsg.textContent = `エラー: ${error.message}`;
    } else {
      errorMsg.textContent = 'エラー: ファイルの読み込みに失敗しました';
    }
  } finally {
    loadFileInput.value = '';
  }
}

function handleDownload(): void {
  errorMsg.textContent = '';

  try {
    const mode = outputTransferMode;
    if (mode === 'binary-hex') {
      const bytes = hexToUint8Array(outputText.value);
      const binaryBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(binaryBuffer).set(bytes);
      downloadBlob(new Blob([new DataView(binaryBuffer)], { type: 'application/octet-stream' }), getCurrentDateFileName('bin'));
      return;
    }

    downloadBlob(new Blob([outputText.value], { type: 'text/plain;charset=utf-8' }), getCurrentDateFileName('txt'));
  } catch (error) {
    if (error instanceof Error) {
      errorMsg.textContent = `エラー: ${error.message}`;
      return;
    }
    errorMsg.textContent = 'エラー: ダウンロードの準備に失敗しました';
  }
}

function resolveDescription(conv: Converter): string {
  if (typeof conv.description === 'function') {
    return conv.description();
  }
  return conv.description;
}

function getOptionValues(conv: Converter): Record<string, OptionValue> {
  const opts: Record<string, OptionValue> = {};
  conv.options.forEach((opt) => {
    const el = document.getElementById(`opt-${opt.id}`);
    if (opt.type === 'checkbox') {
      if (!(el instanceof HTMLInputElement)) {
        console.warn(`Option element not found: opt-${opt.id}`);
        return;
      }
      opts[opt.id] = el.checked;
      return;
    }

    if (opt.type === 'text') {
      if (!(el instanceof HTMLInputElement)) {
        console.warn(`Option element not found: opt-${opt.id}`);
        return;
      }
      opts[opt.id] = el.value;
      return;
    }

    if (!(el instanceof HTMLSelectElement)) {
      console.warn(`Option element not found: opt-${opt.id}`);
      return;
    }
    opts[opt.id] = el.value;
  });
  return opts;
}

function renderConverterUI(conv: Converter): void {
  converterDescription.textContent = resolveDescription(conv);
  converterOptions.innerHTML = '';

  conv.options.forEach((opt) => {
    const row = document.createElement('div');
    row.className = 'option-row';

    const label = document.createElement('label');
    label.htmlFor = `opt-${opt.id}`;
    label.textContent = opt.label;

    row.appendChild(label);

    if (opt.type === 'checkbox') {
      const input = document.createElement('input');
      input.id = `opt-${opt.id}`;
      input.type = 'checkbox';
      input.checked = opt.defaultValue;
      input.addEventListener('change', () => {
        if (autoConvertCheck.checked) void runConvert();
      });
      row.appendChild(input);
      converterOptions.appendChild(row);
      return;
    }

    if (opt.type === 'text') {
      const input = document.createElement('input');
      input.id = `opt-${opt.id}`;
      input.type = 'text';
      input.value = opt.defaultValue;
      input.addEventListener('input', () => {
        if (autoConvertCheck.checked) void runConvert();
      });
      row.appendChild(input);
      converterOptions.appendChild(row);
      return;
    }

    const select = document.createElement('select');
    select.id = `opt-${opt.id}`;
    opt.items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      option.selected = item.value === opt.defaultValue;
      select.appendChild(option);
    });
    select.addEventListener('change', () => {
      if (autoConvertCheck.checked) void runConvert();
    });
    row.appendChild(select);
    converterOptions.appendChild(row);
  });
}

async function runConvert(): Promise<void> {
  errorMsg.textContent = '';
  outputText.value = '';

  const opts = getOptionValues(engine.getConverter());

  try {
    const result = await engine.run(inputText.value, opts, lineByLineCheck.checked);
    outputText.value = result.output;
    if (result.lineErrors) {
      errorMsg.textContent = '一部の行で変換に失敗しました';
    }
  } catch (e) {
    if (e instanceof Error) {
      errorMsg.textContent = `エラー: ${e.message}`;
      return;
    }
    errorMsg.textContent = 'エラー: 不明なエラーが発生しました';
  }
}

void init();
