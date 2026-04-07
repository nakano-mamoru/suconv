import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';

// Excel serial 25569 = 1970-01-01 (includes Excel's fake Feb 29, 1900)
const EXCEL_OFFSET = 25569;
const MS_PER_DAY = 86400000;

// .NET Ticks: 100ns intervals since 0001-01-01 UTC
const DOTNET_TICKS_PER_MS = BigInt(10000);
const DOTNET_EPOCH_TICKS = BigInt('621355968000000000'); // ticks from 0001-01-01 to 1970-01-01

type DateMode = 'iso8601' | 'yyyymmdd' | 'epochms' | 'unixtime' | 'excel' | 'dotnet';

// --- Extraction ---

function extractIso8601(text: string): string {
  const m = text.match(
    /\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?\b|\d{4}-\d{2}\b|\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?/
  );
  return m?.[0] ?? '';
}

function extractYyyyMmDd(text: string): string {
  const m = text.match(
    /\d{4}\/\d{1,2}\/\d{1,2}(?:[T ]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?|\d{4}\/\d{1,2}|\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?/
  );
  return m?.[0] ?? '';
}

function extractNumber(text: string): string {
  return text.match(/\d+(?:\.\d+)?/)?.[0] ?? '';
}

// --- Padding helpers ---

function pad2(n: number): string { return String(n).padStart(2, '0'); }
function pad3(n: number): string { return String(n).padStart(3, '0'); }
function pad4(n: number): string { return String(n).padStart(4, '0'); }

// --- Parse extracted string to UTC milliseconds ---

function parseIso8601(str: string, utc: boolean): number {
  // Full datetime: YYYY-MM-DD[T ]HH:MM[:SS[.fff]][TZ]
  const full = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:?\d{2})?$/);
  if (full) {
    if (full[8]) return new Date(str).getTime();
    const ms = full[7] ? parseInt(full[7].padEnd(3, '0').slice(0, 3)) : 0;
    if (utc) return Date.UTC(+full[1], +full[2] - 1, +full[3], +full[4], +full[5], +(full[6] ?? '0'), ms);
    return new Date(+full[1], +full[2] - 1, +full[3], +full[4], +full[5], +(full[6] ?? '0'), ms).getTime();
  }

  // Date only: YYYY-MM-DD
  const dateOnly = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    if (utc) return Date.UTC(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]);
    return new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]).getTime();
  }

  // Year-Month: YYYY-MM
  const yearMonth = str.match(/^(\d{4})-(\d{2})$/);
  if (yearMonth) {
    if (utc) return Date.UTC(+yearMonth[1], +yearMonth[2] - 1, 1);
    return new Date(+yearMonth[1], +yearMonth[2] - 1, 1).getTime();
  }

  // Time only: HH:MM[:SS[.fff]]
  const timeOnly = str.match(/^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/);
  if (timeOnly) {
    const ms = timeOnly[4] ? parseInt(timeOnly[4].padEnd(3, '0').slice(0, 3)) : 0;
    const now = new Date();
    if (utc) return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), +timeOnly[1], +timeOnly[2], +(timeOnly[3] ?? '0'), ms);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), +timeOnly[1], +timeOnly[2], +(timeOnly[3] ?? '0'), ms).getTime();
  }

  throw new Error(`ISO-8601 として解析できません: "${str}"`);
}

function parseYyyyMmDd(str: string, utc: boolean): number {
  // Full: YYYY/MM/DD[T ]H:MM[:SS[.fff]]
  const full = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})[T ](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/);
  if (full) {
    const ms = full[7] ? parseInt(full[7].padEnd(3, '0').slice(0, 3)) : 0;
    if (utc) return Date.UTC(+full[1], +full[2] - 1, +full[3], +full[4], +full[5], +(full[6] ?? '0'), ms);
    return new Date(+full[1], +full[2] - 1, +full[3], +full[4], +full[5], +(full[6] ?? '0'), ms).getTime();
  }

  // Date only: YYYY/MM/DD
  const dateOnly = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (dateOnly) {
    if (utc) return Date.UTC(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]);
    return new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]).getTime();
  }

  // Year/Month: YYYY/MM
  const yearMonth = str.match(/^(\d{4})\/(\d{1,2})$/);
  if (yearMonth) {
    if (utc) return Date.UTC(+yearMonth[1], +yearMonth[2] - 1, 1);
    return new Date(+yearMonth[1], +yearMonth[2] - 1, 1).getTime();
  }

  // Time only: H:MM[:SS[.fff]]
  const timeOnly = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/);
  if (timeOnly) {
    const ms = timeOnly[4] ? parseInt(timeOnly[4].padEnd(3, '0').slice(0, 3)) : 0;
    const now = new Date();
    if (utc) return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), +timeOnly[1], +timeOnly[2], +(timeOnly[3] ?? '0'), ms);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), +timeOnly[1], +timeOnly[2], +(timeOnly[3] ?? '0'), ms).getTime();
  }

  throw new Error(`日時として解析できません: "${str}"`);
}

function parseToMs(text: string, mode: DateMode, utc: boolean): number {
  switch (mode) {
    case 'iso8601': {
      const extracted = extractIso8601(text);
      if (!extracted) throw new Error('ISO-8601 形式の日時が見つかりません');
      return parseIso8601(extracted, utc);
    }
    case 'yyyymmdd': {
      const extracted = extractYyyyMmDd(text);
      if (!extracted) throw new Error('日時文字列が見つかりません');
      return parseYyyyMmDd(extracted, utc);
    }
    case 'epochms': {
      const n = extractNumber(text);
      if (!n) throw new Error('数値が見つかりません');
      return parseFloat(n);
    }
    case 'unixtime': {
      const n = extractNumber(text);
      if (!n) throw new Error('数値が見つかりません');
      return parseFloat(n) * 1000;
    }
    case 'excel': {
      const n = extractNumber(text);
      if (!n) throw new Error('数値が見つかりません');
      return (parseFloat(n) - EXCEL_OFFSET) * MS_PER_DAY;
    }
    case 'dotnet': {
      const n = extractNumber(text);
      if (!n) throw new Error('数値が見つかりません');
      return Number((BigInt(n) - DOTNET_EPOCH_TICKS) / DOTNET_TICKS_PER_MS);
    }
  }
}

// --- Format UTC milliseconds to output string ---

function formatFromMs(ms: number, mode: DateMode, utc: boolean, showMs: boolean): string {
  const d = new Date(ms);

  switch (mode) {
    case 'iso8601': {
      if (utc) {
        const base = `${pad4(d.getUTCFullYear())}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
        return showMs ? `${base}.${pad3(d.getUTCMilliseconds())}Z` : `${base}Z`;
      } else {
        const tzOff = -d.getTimezoneOffset();
        const tzSign = tzOff >= 0 ? '+' : '-';
        const tzH = pad2(Math.floor(Math.abs(tzOff) / 60));
        const tzM = pad2(Math.abs(tzOff) % 60);
        const tz = `${tzSign}${tzH}:${tzM}`;
        const base = `${pad4(d.getFullYear())}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
        return showMs ? `${base}.${pad3(d.getMilliseconds())}${tz}` : `${base}${tz}`;
      }
    }
    case 'yyyymmdd': {
      if (utc) {
        const base = `${pad4(d.getUTCFullYear())}/${pad2(d.getUTCMonth() + 1)}/${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
        return showMs ? `${base}.${pad3(d.getUTCMilliseconds())}` : base;
      } else {
        const base = `${pad4(d.getFullYear())}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
        return showMs ? `${base}.${pad3(d.getMilliseconds())}` : base;
      }
    }
    case 'epochms':
      return String(ms);
    case 'unixtime':
      return String(Math.floor(ms / 1000));
    case 'excel': {
      const serial = ms / MS_PER_DAY + EXCEL_OFFSET;
      return serial.toFixed(10).replace(/\.?0+$/, '');
    }
    case 'dotnet': {
      const ticks = BigInt(ms) * DOTNET_TICKS_PER_MS + DOTNET_EPOCH_TICKS;
      return String(ticks);
    }
  }
}

// --- setupDescription ---

const setupAbortControllers = new WeakMap<HTMLElement, AbortController>();

// --- Converter definition ---

const MODE_OPTIONS = `
  <option value="iso8601">ISO-8601</option>
  <option value="yyyymmdd">yyyy/mm/dd hh:mm:ss.fff</option>
  <option value="epochms">エポックミリ秒 (JavaScript)</option>
  <option value="unixtime">UNIX時間</option>
  <option value="excel">Excel 日付シリアル値</option>
  <option value="dotnet">C#/.NET Ticks</option>
`;

export const datetimeConverter: Converter = {
  id: 'datetime-converter',
  name: '日付時刻変換',
  description: () => `
    <p>日付・時刻をさまざまな形式の間で変換します。入力がブランクの場合は現在日時を使用します。</p>
    <div class="converter-options">
      <div>
        <label for="opt-inputMode">入力モード</label>
        <select id="opt-inputMode">${MODE_OPTIONS}</select>
        <label><input id="opt-inputUtc" type="checkbox"> UTC</label>
      </div>
      <div>
        <label for="opt-outputMode">出力モード</label>
        <select id="opt-outputMode">${MODE_OPTIONS}</select>
        <label><input id="opt-outputUtc" type="checkbox"> UTC</label>
      </div>
      <div id="grp-showMs">
        <label><input id="opt-showMs" type="checkbox" checked> ミリ秒</label>
      </div>
    </div>
  `,
  setupDescription(container: HTMLElement): void {
    setupAbortControllers.get(container)?.abort();
    const ctrl = new AbortController();
    setupAbortControllers.set(container, ctrl);

    const outputModeSelect = container.querySelector<HTMLSelectElement>('#opt-outputMode');
    if (!outputModeSelect) return;

    const update = (): void => {
      const grpShowMs = container.querySelector<HTMLElement>('#grp-showMs');
      if (grpShowMs) {
        grpShowMs.hidden = outputModeSelect.value !== 'iso8601' && outputModeSelect.value !== 'yyyymmdd';
      }
    };

    outputModeSelect.addEventListener('change', update, { signal: ctrl.signal });
    update();
  },
  async convert(text, opts) {
    const inputMode = (opts['inputMode'] ?? 'iso8601') as DateMode;
    const outputMode = (opts['outputMode'] ?? 'iso8601') as DateMode;
    const inputUtc = opts['inputUtc'] === true;
    const outputUtc = opts['outputUtc'] === true;
    const showMs = opts['showMs'] !== false;
    if (text.trim() === '') return ConverterResult.success('');
    const ms = parseToMs(text, inputMode, inputUtc);
    return ConverterResult.success(formatFromMs(ms, outputMode, outputUtc, showMs));
  },
};
