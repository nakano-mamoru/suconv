import { CONVERTERS } from './converter/converters';
import type { Converter } from './converter/converter';
import { ConvertEngine } from './converter/convert-engine';
import { styleThemes } from './generated/style-themes';
import { convertPageHtml } from './generated/convert-page-html';
import { buildInfo } from './generated/build-info';
import { helpContent } from './generated/help-content';
import { preference } from './storage/preference';
import { settings } from './storage/settings';
import { defaultParams } from './storage/default-params';

type TransferMode = 'text' | 'binary-hex';
type ToInputMode = 'copy' | 'swap';
type ThemeDefinition = {
  id: string;
  name: string;
};

export class ConvertPage {
  private engine: ConvertEngine;
  private inputTransferMode: TransferMode = 'text';
  private outputTransferMode: TransferMode = 'text';
  private toInputMode: ToInputMode = 'copy';
  private themes: ThemeDefinition[] = [];

  private readonly MIN_PANE_WIDTH = 280;
  private readonly MIN_MAIN_HEIGHT = 180;
  private readonly MIN_CONVERTER_HEIGHT = 300;
  private readonly SPLITTER_SIZE = 6;

  // DOM elements
  private converterSelect!: HTMLSelectElement;
  private splitRoot!: HTMLElement;
  private verticalSplitter!: HTMLElement;
  private horizontalSplitter!: HTMLElement;
  private converterPane!: HTMLElement;
  private converterDescription!: HTMLDivElement;
  private converterOptions!: HTMLDivElement;
  private inputModeWrapper!: HTMLDivElement;
  private outputModeWrapper!: HTMLDivElement;
  private inputModeToggleBtn!: HTMLButtonElement;
  private inputModeMenu!: HTMLDivElement;
  private outputModeToggleBtn!: HTMLButtonElement;
  private outputModeMenu!: HTMLDivElement;
  private loadBtn!: HTMLButtonElement;
  private loadFileInput!: HTMLInputElement;
  private inputText!: HTMLTextAreaElement;
  private outputText!: HTMLTextAreaElement;
  private downloadBtn!: HTMLButtonElement;
  private convertBtn!: HTMLButtonElement;
  private autoConvertCheck!: HTMLInputElement;
  private lineByLineCheck!: HTMLInputElement;
  private lineWrapCheck!: HTMLInputElement;
  private monospaceFontCheck!: HTMLInputElement;
  private errorMsg!: HTMLDivElement;
  private clearInputBtn!: HTMLButtonElement;
  private copyInputBtn!: HTMLButtonElement;
  private toInputBtn!: HTMLButtonElement;
  private toInputModeWrapper!: HTMLDivElement;
  private toInputModeToggleBtn!: HTMLButtonElement;
  private toInputModeMenu!: HTMLDivElement;
  private copyOutputBtn!: HTMLButtonElement;
  private preferencesBtn!: HTMLButtonElement;
  private appHelpBtn!: HTMLButtonElement;
  private preferenceDialogBackdrop!: HTMLDivElement;
  private preferenceThemeSelect!: HTMLSelectElement;
  private preferenceCancelBtn!: HTMLButtonElement;
  private preferenceClearDefaultsBtn!: HTMLButtonElement;
  private preferenceSaveBtn!: HTMLButtonElement;
  private helpBtn!: HTMLButtonElement;
  private helpDialogBackdrop!: HTMLDivElement;
  private helpDialogBody!: HTMLDivElement;
  private helpDialogCloseBtn!: HTMLButtonElement;
  private buildDateDisplay!: HTMLElement;
  private gitBranchDisplay!: HTMLElement;
  private gitCommitDisplay!: HTMLElement;

  constructor() {
    this.engine = new ConvertEngine(CONVERTERS[0]);
  }

  getHtml(): string {
    return convertPageHtml;
  }

  private requireElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
      throw new Error(`Missing required element: #${id}`);
    }
    return el as T;
  }

  private closeModeMenu(menu: HTMLDivElement): void {
    menu.classList.add('visually-hidden');
  }

  private toggleModeMenu(menu: HTMLDivElement): void {
    const isHidden = menu.classList.contains('visually-hidden');
    this.closeModeMenu(this.inputModeMenu);
    this.closeModeMenu(this.outputModeMenu);
    this.closeModeMenu(this.toInputModeMenu);
    if (isHidden) {
      menu.classList.remove('visually-hidden');
    }
  }

  private parseTransferMode(value: string | undefined): TransferMode {
    return value === 'binary-hex' ? 'binary-hex' : 'text';
  }

  private setModeMenuActive(menu: HTMLDivElement, mode: TransferMode): void {
    const buttons = menu.querySelectorAll<HTMLButtonElement>('.mode-menu-button[data-mode]');
    buttons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mode === mode);
    });
  }

  private bindModeMenu(menu: HTMLDivElement, onChange: (mode: TransferMode) => void): void {
    const buttons = menu.querySelectorAll<HTMLButtonElement>('.mode-menu-button[data-mode]');
    buttons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const mode = this.parseTransferMode(button.dataset.mode);
        this.setModeMenuActive(menu, mode);
        onChange(mode);
        this.closeModeMenu(menu);
      });
    });
  }

  private clamp(value: number, minValue: number, maxValue: number): number {
    return Math.min(Math.max(value, minValue), maxValue);
  }

  private resolveInputPaneRatio(): number {
    const inputRatio = settings.inputPaneRatio;
    const outputRatio = settings.outputPaneRatio;
    const sum = inputRatio + outputRatio;
    if (sum <= 0) {
      return 0.5;
    }
    return this.clamp(inputRatio / sum, 0.1, 0.9);
  }

  private setInputPaneRatio(ratio: number): number {
    const nextRatio = this.clamp(ratio, 0.1, 0.9);
    document.documentElement.style.setProperty('--left-pane-width', `${(nextRatio * 100).toFixed(4)}%`);
    return nextRatio;
  }

  private setConverterPaneHeightPx(heightPx: number): number {
    const rootRect = this.splitRoot.getBoundingClientRect();
    const maxConverterHeight = Math.max(this.MIN_CONVERTER_HEIGHT, rootRect.height - this.MIN_MAIN_HEIGHT - this.SPLITTER_SIZE);
    const nextHeight = this.clamp(heightPx, this.MIN_CONVERTER_HEIGHT, maxConverterHeight);
    document.documentElement.style.setProperty('--converter-pane-height', `${Math.round(nextHeight)}px`);
    return nextHeight;
  }

  private applySavedPaneLayout(): void {
    const inputRatio = this.setInputPaneRatio(this.resolveInputPaneRatio());
    const converterHeight = this.setConverterPaneHeightPx(settings.converterPaneHeightPx);
    settings.inputPaneRatio = inputRatio;
    settings.outputPaneRatio = 1 - inputRatio;
    settings.converterPaneHeightPx = converterHeight;
  }

  private setupSplitters(): void {
    let dragging: 'vertical' | 'horizontal' | null = null;
    let currentInputRatio = this.resolveInputPaneRatio();
    let currentConverterHeight = settings.converterPaneHeightPx;

    const onPointerMove = (event: PointerEvent): void => {
      if (!dragging) {
        return;
      }

      const rootRect = this.splitRoot.getBoundingClientRect();

      if (dragging === 'vertical') {
        const rawLeft = event.clientX - rootRect.left - this.SPLITTER_SIZE / 2;
        const maxLeft = Math.max(this.MIN_PANE_WIDTH, rootRect.width - this.MIN_PANE_WIDTH - this.SPLITTER_SIZE);
        const nextLeft = this.clamp(rawLeft, this.MIN_PANE_WIDTH, maxLeft);
        const paneTotalWidth = Math.max(1, rootRect.width - this.SPLITTER_SIZE);
        currentInputRatio = this.setInputPaneRatio(nextLeft / paneTotalWidth);
        return;
      }

      const rawMainHeight = event.clientY - rootRect.top - this.SPLITTER_SIZE / 2;
      const maxMainHeight = Math.max(this.MIN_MAIN_HEIGHT, rootRect.height - this.MIN_CONVERTER_HEIGHT - this.SPLITTER_SIZE);
      const mainHeight = this.clamp(rawMainHeight, this.MIN_MAIN_HEIGHT, maxMainHeight);
      currentConverterHeight = rootRect.height - mainHeight - this.SPLITTER_SIZE;
      currentConverterHeight = this.setConverterPaneHeightPx(currentConverterHeight);
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

    this.verticalSplitter.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      dragging = 'vertical';
      document.body.classList.add('is-resizing');
    });

    this.horizontalSplitter.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      dragging = 'horizontal';
      document.body.classList.add('is-resizing');
    });

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    window.addEventListener('resize', () => {
      currentInputRatio = this.setInputPaneRatio(this.resolveInputPaneRatio());
      currentConverterHeight = this.setConverterPaneHeightPx(settings.converterPaneHeightPx);
    });
  }

  private openHelpDialog(contentKey: string): void {
    this.helpDialogBody.innerHTML = helpContent[contentKey] ?? '<p>ヘルプが見つかりません。</p>';
    this.helpDialogBackdrop.classList.remove('visually-hidden');
    this.helpDialogBackdrop.setAttribute('aria-hidden', 'false');
  }

  private closeHelpDialog(): void {
    this.helpDialogBackdrop.classList.add('visually-hidden');
    this.helpDialogBackdrop.setAttribute('aria-hidden', 'true');
  }

  private openPreferenceDialog(): void {
    this.preferenceDialogBackdrop.classList.remove('visually-hidden');
    this.preferenceDialogBackdrop.setAttribute('aria-hidden', 'false');
  }

  private closePreferenceDialog(): void {
    this.preferenceDialogBackdrop.classList.add('visually-hidden');
    this.preferenceDialogBackdrop.setAttribute('aria-hidden', 'true');
  }

  private displayBuildInfo(): void {
    const buildDate = new Date(buildInfo.buildDate).toLocaleString();
    this.buildDateDisplay.textContent = buildDate;
    this.gitBranchDisplay.textContent = buildInfo.gitBranch;
    this.gitCommitDisplay.textContent = buildInfo.gitCommit.substring(0, 7);
  }

  private async loadThemes(): Promise<ThemeDefinition[]> {
    return styleThemes.map((theme) => ({
      id: theme.id,
      name: theme.name,
    }));
  }

  private renderPreferenceThemeOptions(themeList: ThemeDefinition[]): void {
    this.preferenceThemeSelect.innerHTML = '';
    themeList.forEach((theme) => {
      const option = document.createElement('option');
      option.value = theme.id;
      option.textContent = theme.name;
      this.preferenceThemeSelect.appendChild(option);
    });
  }

  private applyTheme(themeId: string, themeList: ThemeDefinition[]): string {
    const selectedTheme = themeList.find((item) => item.id === themeId) ?? themeList[0];
    if (!selectedTheme) {
      return 'light';
    }

    Array.from(document.body.classList)
      .filter((cls) => cls.startsWith('theme_'))
      .forEach((cls) => document.body.classList.remove(cls));
    document.body.classList.add(`theme_${selectedTheme.id}`);

    this.preferenceThemeSelect.value = selectedTheme.id;
    return selectedTheme.id;
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  private normalizeHex(text: string): string {
    return text.replace(/\s+/g, '').trim();
  }

  private hexToUint8Array(hex: string): Uint8Array {
    const normalizedHex = this.normalizeHex(hex);
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

  private getCurrentDateFileName(extension: 'txt' | 'bin'): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}.${extension}`;
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  private async readFileAsText(file: File): Promise<string> {
    return await file.text();
  }

  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return await file.arrayBuffer();
  }

  private async handleLoadFile(): Promise<void> {
    this.errorMsg.textContent = '';

    const file = this.loadFileInput.files?.[0];
    if (!file) {
      return;
    }

    try {
      const mode = this.inputTransferMode;
      if (mode === 'text') {
        this.inputText.value = await this.readFileAsText(file);
      } else {
        this.inputText.value = this.arrayBufferToHex(await this.readFileAsArrayBuffer(file));
      }

      settings.inputText = this.inputText.value;
    } catch (error) {
      if (error instanceof Error) {
        this.errorMsg.textContent = `エラー: ${error.message}`;
      } else {
        this.errorMsg.textContent = 'エラー: ファイルの読み込みに失敗しました';
      }
    } finally {
      this.loadFileInput.value = '';
    }
  }

  private handleDownload(): void {
    this.errorMsg.textContent = '';

    try {
      const mode = this.outputTransferMode;
      if (mode === 'binary-hex') {
        const bytes = this.hexToUint8Array(this.outputText.value);
        const binaryBuffer = new ArrayBuffer(bytes.byteLength);
        new Uint8Array(binaryBuffer).set(bytes);
        this.downloadBlob(new Blob([new DataView(binaryBuffer)], { type: 'application/octet-stream' }), this.getCurrentDateFileName('bin'));
        return;
      }

      this.downloadBlob(new Blob([this.outputText.value], { type: 'text/plain;charset=utf-8' }), this.getCurrentDateFileName('txt'));
    } catch (error) {
      if (error instanceof Error) {
        this.errorMsg.textContent = `エラー: ${error.message}`;
        return;
      }
      this.errorMsg.textContent = 'エラー: ダウンロードの準備に失敗しました';
    }
  }

  private applyDisableMultiline(conv: Converter): void {
    const disabled = conv.disableMultiline === true;
    this.lineByLineCheck.disabled = disabled;
    this.lineByLineCheck.closest('label')?.classList.toggle('is-disabled', disabled);
  }

  private renderConverterUI(conv: Converter): void {
    this.converterDescription.innerHTML = conv.description();
    this.applyDisableMultiline(conv);
    conv.setupDescription?.(this.converterDescription);

    const inputs = this.converterDescription.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="number"]');
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        if (this.autoConvertCheck.checked) void this.runConvert(true);
      });
    });

    const selects = this.converterDescription.querySelectorAll<HTMLSelectElement>('select');
    selects.forEach((select) => {
      select.addEventListener('change', () => {
        if (this.autoConvertCheck.checked) void this.runConvert(true);
      });
    });

    const checkboxes = this.converterDescription.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        if (this.autoConvertCheck.checked) void this.runConvert(true);
      });
    });

    const pickerToggles = this.converterDescription.querySelectorAll<HTMLButtonElement>('.converter-options button[data-role="picker-toggle"]');
    pickerToggles.forEach((toggle) => {
      const wrapper = toggle.closest('[data-role="picker"]');
      if (!wrapper) return;
      const popup = wrapper?.querySelector<HTMLDivElement>('[data-role="picker-popup"]');
      const input = wrapper?.querySelector<HTMLInputElement>('input[type="text"]');

      if (!popup || !input) return;

      toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        const wasHidden = popup.hidden;
        popup.hidden = !popup.hidden;
        if (wasHidden) {
          const closeOnOutside = (outsideEvent: MouseEvent): void => {
            const target = outsideEvent.target;
            if (!(target instanceof Node) || !wrapper.contains(target)) {
              popup.hidden = true;
            }
          };
          document.addEventListener('click', closeOnOutside, { once: true });
        }
      });

      const menuButtons = popup.querySelectorAll<HTMLButtonElement>('button[data-value]');
      menuButtons.forEach((button) => {
        button.addEventListener('click', () => {
          input.value = button.dataset.value || '';
          popup.hidden = true;
          input.dispatchEvent(new Event('input'));
        });
      });
    });
  }

  private async runConvert(saveDefaultParams = false): Promise<void> {
    this.errorMsg.textContent = '';
    this.outputText.value = '';

    const opts = this.engine.getOptions(this.converterDescription);

    try {
      const disableMultiline = this.engine.getConverter().disableMultiline === true;
      const lineByLine = !disableMultiline && this.lineByLineCheck.checked;
      const result = await this.engine.run(this.inputText.value, opts, lineByLine, saveDefaultParams);
      this.outputText.value = result.output;
      if (lineByLine && !result.success) {
        this.errorMsg.textContent = '一部の行で変換に失敗しました';
      }
    } catch (e) {
      if (e instanceof Error) {
        this.errorMsg.textContent = `エラー: ${e.message}`;
        return;
      }
      this.errorMsg.textContent = 'エラー: 不明なエラーが発生しました';
    }
  }

  private applyTextAreaWrapMode(): void {
    const wrapMode = this.lineWrapCheck.checked ? 'soft' : 'off';
    const noWrap = wrapMode === 'off';

    [this.inputText, this.outputText].forEach((textArea) => {
      textArea.setAttribute('wrap', wrapMode);
      textArea.classList.toggle('no-wrap', noWrap);
    });
  }

  private applyTextAreaFontMode(): void {
    const useMonospace = this.monospaceFontCheck.checked;

    [this.inputText, this.outputText].forEach((textArea) => {
      textArea.classList.toggle('use-monospace-font', useMonospace);
    });
  }

  async init(): Promise<void> {
    // Query all required elements
    this.converterSelect = this.requireElement('converterSelect');
    this.splitRoot = this.requireElement('splitRoot');
    this.verticalSplitter = this.requireElement('verticalSplitter');
    this.horizontalSplitter = this.requireElement('horizontalSplitter');
    this.converterPane = this.requireElement('converterPane');
    this.converterDescription = this.requireElement('converterDescription');
    this.converterOptions = this.requireElement('converterOptions');
    this.inputModeWrapper = this.requireElement('inputModeWrapper');
    this.outputModeWrapper = this.requireElement('outputModeWrapper');
    this.inputModeToggleBtn = this.requireElement('inputModeToggleBtn');
    this.inputModeMenu = this.requireElement('inputModeMenu');
    this.outputModeToggleBtn = this.requireElement('outputModeToggleBtn');
    this.outputModeMenu = this.requireElement('outputModeMenu');
    this.loadBtn = this.requireElement('loadBtn');
    this.loadFileInput = this.requireElement('loadFileInput');
    this.inputText = this.requireElement('inputText');
    this.outputText = this.requireElement('outputText');
    this.downloadBtn = this.requireElement('downloadBtn');
    this.convertBtn = this.requireElement('convertBtn');
    this.autoConvertCheck = this.requireElement('autoConvertCheck');
    this.lineByLineCheck = this.requireElement('lineByLineCheck');
    this.lineWrapCheck = this.requireElement('lineWrapCheck');
    this.monospaceFontCheck = this.requireElement('monospaceFontCheck');
    this.errorMsg = this.requireElement('errorMsg');
    this.clearInputBtn = this.requireElement('clearInputBtn');
    this.copyInputBtn = this.requireElement('copyInputBtn');
    this.toInputBtn = this.requireElement('toInputBtn');
    this.toInputModeWrapper = this.requireElement('toInputModeWrapper');
    this.toInputModeToggleBtn = this.requireElement('toInputModeToggleBtn');
    this.toInputModeMenu = this.requireElement('toInputModeMenu');
    this.copyOutputBtn = this.requireElement('copyOutputBtn');
    this.preferencesBtn = this.requireElement('preferencesBtn');
    this.appHelpBtn = this.requireElement('appHelpBtn');
    this.preferenceDialogBackdrop = this.requireElement('preferenceDialogBackdrop');
    this.preferenceThemeSelect = this.requireElement('preferenceThemeSelect');
    this.preferenceCancelBtn = this.requireElement('preferenceCancelBtn');
    this.preferenceClearDefaultsBtn = this.requireElement('preferenceClearDefaultsBtn');
    this.preferenceSaveBtn = this.requireElement('preferenceSaveBtn');
    this.helpBtn = this.requireElement('helpBtn');
    this.helpDialogBackdrop = this.requireElement('helpDialogBackdrop');
    this.helpDialogBody = this.requireElement('helpDialogBody');
    this.helpDialogCloseBtn = this.requireElement('helpDialogCloseBtn');
    this.buildDateDisplay = this.requireElement('buildDateDisplay');
    this.gitBranchDisplay = this.requireElement('gitBranchDisplay');
    this.gitCommitDisplay = this.requireElement('gitCommitDisplay');

    // Initialize storage and settings
    await settings.initialize();
    await preference.initialize();
    await defaultParams.initialize();

    // Apply saved pane layout
    this.applySavedPaneLayout();

    // Load and apply theme
    this.themes = await this.loadThemes();
    this.renderPreferenceThemeOptions(this.themes);
    const appliedThemeId = this.applyTheme(preference.themeId, this.themes);
    preference.themeId = appliedThemeId;

    // Setup splitters
    this.setupSplitters();

    // Populate converter select
    CONVERTERS.forEach((conv) => {
      const option = document.createElement('option');
      option.value = conv.id;
      option.textContent = conv.name;
      this.converterSelect.appendChild(option);
    });

    const initialConverter = CONVERTERS.find((converter) => converter.id === settings.lastConverterId) ?? CONVERTERS[0];
    this.engine.setConverter(initialConverter);
    this.converterSelect.value = initialConverter.id;
    settings.lastConverterId = initialConverter.id;

    // Render initial converter UI
    this.renderConverterUI(initialConverter);
    this.engine.applyDefaultParamsToDescription();
    initialConverter.setupDescription?.(this.converterDescription);
    this.inputText.value = settings.inputText;

    this.autoConvertCheck.checked = settings.autoConvertEnabled;
    this.convertBtn.disabled = this.autoConvertCheck.checked;
    this.lineByLineCheck.checked = settings.lineByLineEnabled;
    this.lineWrapCheck.checked = settings.lineWrapEnabled;
    this.monospaceFontCheck.checked = settings.monospaceFontEnabled;
    this.inputTransferMode = settings.inputTransferMode;
    this.outputTransferMode = settings.outputTransferMode;
    this.toInputMode = settings.toInputMode;
    this.setModeMenuActive(this.inputModeMenu, this.inputTransferMode);
    this.setModeMenuActive(this.outputModeMenu, this.outputTransferMode);
    this.toInputModeMenu.querySelectorAll<HTMLButtonElement>('.mode-menu-button[data-mode]').forEach(b =>
      b.classList.toggle('is-active', b.dataset.mode === this.toInputMode)
    );

    this.applyTextAreaWrapMode();
    this.applyTextAreaFontMode();

    // Converter selection change
    this.converterSelect.addEventListener('change', () => {
      const conv = CONVERTERS.find((c) => c.id === this.converterSelect.value);
      if (conv) {
        this.engine.setConverter(conv);
        settings.lastConverterId = conv.id;
        this.renderConverterUI(conv);
        this.engine.applyDefaultParamsToDescription();
        conv.setupDescription?.(this.converterDescription);
        if (this.autoConvertCheck.checked) {
          void this.runConvert(true);
          return;
        }

        this.outputText.value = '';
        this.errorMsg.textContent = '';
      }
    });

    // Input text change
    this.inputText.addEventListener('input', () => {
      settings.inputText = this.inputText.value;
      if (this.autoConvertCheck.checked) {
        void this.runConvert(true);
      }
    });

    // Auto convert checkbox
    this.autoConvertCheck.addEventListener('change', () => {
      settings.autoConvertEnabled = this.autoConvertCheck.checked;
      this.convertBtn.disabled = this.autoConvertCheck.checked;
      if (this.autoConvertCheck.checked) {
        void this.runConvert(true);
      }
    });

    this.lineByLineCheck.addEventListener('change', () => {
      settings.lineByLineEnabled = this.lineByLineCheck.checked;
      if (this.autoConvertCheck.checked) {
        void this.runConvert(true);
      }
    });

    // Line wrap checkbox
    this.lineWrapCheck.addEventListener('change', () => {
      settings.lineWrapEnabled = this.lineWrapCheck.checked;
      this.applyTextAreaWrapMode();
    });

    this.monospaceFontCheck.addEventListener('change', () => {
      settings.monospaceFontEnabled = this.monospaceFontCheck.checked;
      this.applyTextAreaFontMode();
    });

    // Mode menus
    this.bindModeMenu(this.inputModeMenu, (mode) => {
      this.inputTransferMode = mode;
      settings.inputTransferMode = mode;
    });

    this.bindModeMenu(this.outputModeMenu, (mode) => {
      this.outputTransferMode = mode;
      settings.outputTransferMode = mode;
    });

    // Mode menu toggles
    this.inputModeToggleBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleModeMenu(this.inputModeMenu);
    });

    this.outputModeToggleBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleModeMenu(this.outputModeMenu);
    });

    // Close menus on outside click
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!this.inputModeWrapper.contains(target)) {
        this.closeModeMenu(this.inputModeMenu);
      }
      if (!this.outputModeWrapper.contains(target)) {
        this.closeModeMenu(this.outputModeMenu);
      }
      if (!this.toInputModeWrapper.contains(target)) {
        this.closeModeMenu(this.toInputModeMenu);
      }
    });

    // File loading
    this.loadBtn.addEventListener('click', () => {
      this.loadFileInput.click();
    });

    this.loadFileInput.addEventListener('change', () => {
      void this.handleLoadFile();
    });

    // Download
    this.downloadBtn.addEventListener('click', () => {
      this.handleDownload();
    });

    // Convert button
    this.convertBtn.addEventListener('click', () => {
      void this.runConvert(true);
    });

    // Clear input
    this.clearInputBtn.addEventListener('click', () => {
      this.inputText.value = '';
      settings.inputText = '';
      if (this.autoConvertCheck.checked) {
        void this.runConvert(true);
      }
    });

    // Copy buttons
    this.copyInputBtn.addEventListener('click', () => {
      void navigator.clipboard.writeText(this.inputText.value);
    });

    this.copyOutputBtn.addEventListener('click', () => {
      void navigator.clipboard.writeText(this.outputText.value);
    });

    // To input button
    this.toInputBtn.addEventListener('click', () => {
      const newInputText = this.outputText.value;
      if (this.toInputMode === 'swap') {
        const conv = this.engine.getConverter();
        conv.swapMode?.(this.converterDescription);
        conv.setupDescription?.(this.converterDescription);
      }
      this.inputText.value = newInputText;
      settings.inputText = newInputText;
      if (this.autoConvertCheck.checked) {
        void this.runConvert(true);
      }
    });

    // To input mode menu toggle
    this.toInputModeToggleBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleModeMenu(this.toInputModeMenu);
    });

    // To input mode menu buttons
    this.toInputModeMenu.querySelectorAll<HTMLButtonElement>('.mode-menu-button[data-mode]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toInputMode = button.dataset.mode === 'swap' ? 'swap' : 'copy';
        settings.toInputMode = this.toInputMode;
        this.toInputModeMenu.querySelectorAll<HTMLButtonElement>('.mode-menu-button[data-mode]').forEach(b =>
          b.classList.toggle('is-active', b.dataset.mode === this.toInputMode)
        );
        this.closeModeMenu(this.toInputModeMenu);
      });
    });

    // Preferences
    this.preferencesBtn.addEventListener('click', () => {
      this.preferenceThemeSelect.value = preference.themeId;
      this.displayBuildInfo();
      this.openPreferenceDialog();
    });

    this.preferenceCancelBtn.addEventListener('click', () => {
      this.closePreferenceDialog();
    });

    this.preferenceClearDefaultsBtn.addEventListener('click', () => {
      void (async () => {
        await defaultParams.clear();
        const currentConverter = this.engine.getConverter();
        this.renderConverterUI(currentConverter);
        this.engine.applyDefaultParamsToDescription();
        currentConverter.setupDescription?.(this.converterDescription);
      })();
    });

    this.preferenceSaveBtn.addEventListener('click', () => {
      const selectedThemeId = this.preferenceThemeSelect.value;
      const appliedId = this.applyTheme(selectedThemeId, this.themes);
      preference.themeId = appliedId;
      this.closePreferenceDialog();
    });

    this.preferenceDialogBackdrop.addEventListener('click', (event) => {
      if (event.target === this.preferenceDialogBackdrop) {
        this.closePreferenceDialog();
      }
    });

    // App-level help button (top header)
    this.appHelpBtn.addEventListener('click', () => {
      this.openHelpDialog('app');
    });

    // Converter help button
    this.helpBtn.addEventListener('click', () => {
      const convId = this.engine.getConverter().id;
      const key = convId in helpContent ? convId : 'app';
      this.openHelpDialog(key);
    });

    this.helpDialogCloseBtn.addEventListener('click', () => {
      this.closeHelpDialog();
    });

    this.helpDialogBackdrop.addEventListener('click', (event) => {
      if (event.target === this.helpDialogBackdrop) {
        this.closeHelpDialog();
      }
    });

    // Close mode menus initially
    this.closeModeMenu(this.inputModeMenu);
    this.closeModeMenu(this.outputModeMenu);
    this.closeModeMenu(this.toInputModeMenu);

    if (this.autoConvertCheck.checked) {
      void this.runConvert(true);
    }
  }
}
