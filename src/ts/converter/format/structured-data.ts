import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';
import * as yaml from 'js-yaml';
import * as TOML from '@ltd/j-toml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

type DataFormat = 'json' | 'javascript' | 'yaml' | 'toml' | 'xml';
type IndentMode = 'none' | '2' | '4' | 'tab';

const INDENT_MAP: Record<IndentMode, string | undefined> = {
  none: undefined,
  '2': '  ',
  '4': '    ',
  tab: '\t',
};

// unknown をプレーンなオブジェクト/配列/プリミティブに正規化する
// TOML の特殊オブジェクト（Section等）も含め再帰的に処理する
function normalize(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as object)) {
      result[key] = normalize((value as Record<string, unknown>)[key]);
    }
    return result;
  }
  return value;
}

// JS リテラルとして出力するための簡易シリアライザ
function toJavaScript(value: unknown, indent: string | undefined, depth = 0): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  const currentIndent = indent !== undefined ? indent.repeat(depth) : '';
  const nextIndent = indent !== undefined ? indent.repeat(depth + 1) : '';
  const nl = indent !== undefined ? '\n' : '';
  const sp = indent !== undefined ? ' ' : '';

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((v) => `${nextIndent}${toJavaScript(v, indent, depth + 1)}`);
    return `[${nl}${items.join(`,${nl}`)}${nl}${currentIndent}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const items = entries.map(([k, v]) => {
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
      return `${nextIndent}${key}:${sp}${toJavaScript(v, indent, depth + 1)}`;
    });
    return `{${nl}${items.join(`,${nl}`)}${nl}${currentIndent}}`;
  }

  return String(value);
}

// JS オブジェクトリテラル文字列をパースする
// （Function コンストラクタは使わずJSONに変換して処理）
function parseJavaScript(text: string): unknown {
  // 末尾カンマを除去
  const normalized = text
    .trim()
    .replace(/,(\s*[}\]])/g, '$1')
    // キーのクォートなし識別子を "key" 形式に変換
    .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');
  return JSON.parse(normalized);
}

function parseInput(text: string, format: DataFormat): unknown {
  switch (format) {
    case 'json':
      return JSON.parse(text);
    case 'javascript':
      return parseJavaScript(text);
    case 'yaml':
      return yaml.load(text);
    case 'toml':
      return TOML.parse(text, { joiner: '\n', bigint: false });
    case 'xml': {
      const parser = new XMLParser({
        ignoreDeclaration: true,
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        numberParseOptions: { leadingZeros: false, hex: true, skipLike: undefined },
        parseTagValue: true,
      });
      return parser.parse(text);
    }
  }
}

function buildTomlValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    const items = value.map(buildTomlValue);
    // 配列の要素がオブジェクトの場合は Section 化してテーブル配列にする
    if (items.some((v) => typeof v === 'object' && v !== null && !Array.isArray(v))) {
      return items.map((v) =>
        typeof v === 'object' && v !== null && !Array.isArray(v)
          ? TOML.Section(v as Parameters<typeof TOML.Section>[0])
          : v,
      );
    }
    return items;
  }
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as object)) {
      result[key] = buildTomlValue((value as Record<string, unknown>)[key]);
    }
    return TOML.Section(result);
  }
  return value;
}

// 要素の値がオブジェクトのとき、スカラープロパティを @_ 属性に変換する
// 配列・ネストオブジェクトは子要素として再帰処理する
function applyAttrFirst(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('@_')) {
      result[k] = v;
    } else if (Array.isArray(v)) {
      result[k] = v.map(convertToAttrFirst);
    } else if (v !== null && typeof v === 'object') {
      // ネストしたオブジェクトは属性変換して子要素に保持
      result[k] = applyAttrFirst(v as Record<string, unknown>);
    } else {
      // スカラー → 属性に昇格（XMLは属性値を文字列として扱う）
      result[`@_${k}`] = String(v);
    }
  }
  return result;
}

// ルートオブジェクトのキーは要素名なので変換しない
// 値がオブジェクトの場合のみ applyAttrFirst で属性変換する
function convertToAttrFirst(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(convertToAttrFirst);
  }
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (k.startsWith('@_')) {
      result[k] = v;
    } else if (Array.isArray(v)) {
      result[k] = v.map(convertToAttrFirst);
    } else if (v !== null && typeof v === 'object') {
      result[k] = applyAttrFirst(v as Record<string, unknown>);
    } else {
      // ルートレベルのスカラーはテキストコンテンツのまま
      result[k] = v;
    }
  }
  return result;
}

// @_ プレフィックスの属性キーを子要素キーに変換する（属性優先オフのとき）
function convertToChildFirst(value: unknown): unknown {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(convertToChildFirst);
  }
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const newKey = k.startsWith('@_') ? k.slice(2) : k;
    if (Array.isArray(v)) {
      result[newKey] = v.map(convertToChildFirst);
    } else if (v !== null && typeof v === 'object') {
      result[newKey] = convertToChildFirst(v);
    } else {
      result[newKey] = v;
    }
  }
  return result;
}

function serializeOutput(data: unknown, format: DataFormat, indentMode: IndentMode, xmlAttrFirst = false): string {
  const normalized = normalize(data);
  const indentStr = INDENT_MAP[indentMode];

  switch (format) {
    case 'json': {
      const space = indentMode === 'none' ? undefined : indentMode === 'tab' ? '\t' : Number(indentMode);
      return JSON.stringify(normalized, null, space) ?? '';
    }
    case 'javascript':
      return toJavaScript(normalized, indentStr);
    case 'yaml': {
      const indent = Number(indentMode);
      return yaml.dump(normalized, { indent, lineWidth: -1, noRefs: true }).trimEnd();
    }
    case 'toml': {
      const tomlData = buildTomlValue(normalized);
      if (typeof tomlData !== 'object' || tomlData === null || Array.isArray(tomlData)) {
        throw new TypeError('TOML出力にはオブジェクト（テーブル）が必要です。');
      }
      const indentVal = indentMode === 'none' ? '\t' : indentMode === 'tab' ? '\t' : Number(indentMode);
      return TOML.stringify(tomlData as Parameters<typeof TOML.stringify>[0], {
        newline: '\n',
        integer: Number.MAX_SAFE_INTEGER,
        indent: indentVal,
        newlineAround: 'section',
      });
    }
    case 'xml': {
      const xmlData = xmlAttrFirst ? convertToAttrFirst(normalized) : convertToChildFirst(normalized);
      const indentBy = indentStr ?? '';
      const builder = new XMLBuilder({
        format: indentMode !== 'none',
        indentBy,
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        suppressBooleanAttributes: false,
      });
      return (builder.build(xmlData) as string).trimEnd();
    }
  }
}

const setupAbortControllers = new WeakMap<HTMLElement, AbortController>();

export const structuredDataConverter: Converter = {
  id: 'structured-data',
  name: '構造化データ変換',
  disableMultiline: true,
  description: () => `
    <p>XML・JSON・JavaScript・YAML・TOML 形式の相互変換を行います。</p>
    <div class="converter-options">
      <div>
        <label for="opt-inputFormat">入力形式</label>
        <select id="opt-inputFormat">
          <option value="json" selected>JSON</option>
          <option value="javascript">JavaScript</option>
          <option value="yaml">YAML</option>
          <option value="toml">TOML</option>
          <option value="xml">XML</option>
        </select>
      </div>
      <div>
        <label for="opt-outputFormat">出力形式</label>
        <select id="opt-outputFormat">
          <option value="json">JSON</option>
          <option value="javascript">JavaScript</option>
          <option value="yaml" selected>YAML</option>
          <option value="toml">TOML</option>
          <option value="xml">XML</option>
        </select>
      </div>
      <div id="grp-indent">
        <label for="opt-indentMode">インデント</label>
        <select id="opt-indentMode">
          <option value="none">なし</option>
          <option value="2" selected>空白2文字</option>
          <option value="4">空白4文字</option>
          <option value="tab">Tab</option>
        </select>
      </div>
      <div id="grp-xml-attr" hidden>
        <label><input id="opt-xmlAttributeFirst" type="checkbox"> 属性優先（スカラー値を属性として出力）</label>
      </div>
    </div>
  `,
  setupDescription(container: HTMLElement): void {
    setupAbortControllers.get(container)?.abort();
    const ctrl = new AbortController();
    setupAbortControllers.set(container, ctrl);

    const outputFormatSelect = container.querySelector<HTMLSelectElement>('#opt-outputFormat');
    const indentSelect = container.querySelector<HTMLSelectElement>('#opt-indentMode');
    if (!outputFormatSelect || !indentSelect) return;

    const optNone = indentSelect.querySelector<HTMLOptionElement>('option[value="none"]');
    const optTab  = indentSelect.querySelector<HTMLOptionElement>('option[value="tab"]');
    const grpIndent  = container.querySelector<HTMLElement>('#grp-indent');
    const grpXmlAttr = container.querySelector<HTMLElement>('#grp-xml-attr');

    const update = (): void => {
      const fmt = outputFormatSelect.value as DataFormat;

      if (fmt === 'toml') {
        if (grpIndent)  grpIndent.hidden  = true;
        if (grpXmlAttr) grpXmlAttr.hidden = true;
        return;
      }

      if (grpIndent) grpIndent.hidden = false;
      if (grpXmlAttr) grpXmlAttr.hidden = fmt !== 'xml';

      if (fmt === 'yaml') {
        if (optNone) optNone.hidden = true;
        if (optTab)  optTab.hidden  = true;
        if (indentSelect.value === 'none' || indentSelect.value === 'tab') {
          indentSelect.value = '2';
        }
      } else {
        if (optNone) optNone.hidden = false;
        if (optTab)  optTab.hidden  = false;
      }
    };

    outputFormatSelect.addEventListener('change', update, { signal: ctrl.signal });
    update();
  },
  swapMode(container: HTMLElement): void {
    const inputSel = container.querySelector<HTMLSelectElement>('#opt-inputFormat');
    const outputSel = container.querySelector<HTMLSelectElement>('#opt-outputFormat');
    if (!inputSel || !outputSel) return;
    [inputSel.value, outputSel.value] = [outputSel.value, inputSel.value];
  },
  async convert(text, opts) {
    const inputFormat = (opts.inputFormat as DataFormat) ?? 'json';
    const outputFormat = (opts.outputFormat as DataFormat) ?? 'yaml';
    const indentMode = (opts.indentMode as IndentMode) ?? '2';
    const xmlAttrFirst = opts.xmlAttributeFirst === true;

    const parsed = parseInput(text, inputFormat);
    return ConverterResult.success(serializeOutput(parsed, outputFormat, indentMode, xmlAttrFirst));
  },
};
