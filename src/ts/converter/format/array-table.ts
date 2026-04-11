import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';

type TableFormat = 'csv' | 'tsv' | 'json2d' | 'jsonobj' | 'java' | 'html' | 'markdown';

interface ParsedTable {
  header: string[] | null;
  rows: string[][];
}

// ---- CSV / TSV (RFC 4180 / Excel 形式) ----

function parseDsvRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuote = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
      } else if (ch === '"') {
        inQuote = false;
        i++;
      } else {
        field += ch;
        i++;
      }
    } else if (ch === '"') {
      inQuote = true;
      i++;
    } else if (text.startsWith(delimiter, i)) {
      row.push(field);
      field = '';
      i += delimiter.length;
    } else if (ch === '\r' && text[i + 1] === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      i += 2;
    } else if (ch === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      i++;
    } else {
      field += ch;
      i++;
    }
  }

  row.push(field);
  if (row.length > 1 || row[0] !== '') {
    rows.push(row);
  }
  return rows;
}

function parseDsv(text: string, delimiter: string, hasHeader: boolean, skipEmpty: boolean): ParsedTable {
  const raw = parseDsvRows(text, delimiter);
  const rows = skipEmpty ? raw.filter(r => r.some(c => c !== '')) : raw;
  if (hasHeader && rows.length > 0) {
    return { header: rows[0], rows: rows.slice(1) };
  }
  return { header: null, rows };
}

// ---- JSON 二次元配列 ----

function parseJson2d(text: string, hasHeader: boolean, skipEmpty: boolean): ParsedTable {
  const data = JSON.parse(text) as unknown;
  if (!Array.isArray(data)) throw new TypeError('入力はJSON配列である必要があります。');

  const rows = (data as unknown[]).map((r, idx) => {
    if (!Array.isArray(r)) throw new TypeError(`行 ${idx + 1} が配列ではありません。`);
    return (r as unknown[]).map(c => String(c ?? ''));
  });

  const filtered = skipEmpty ? rows.filter(r => r.some(c => c !== '')) : rows;
  if (hasHeader && filtered.length > 0) {
    return { header: filtered[0], rows: filtered.slice(1) };
  }
  return { header: null, rows: filtered };
}

// ---- JSON 連想配列 ----

function parseJsonObj(text: string, skipEmpty: boolean): ParsedTable {
  const data = JSON.parse(text) as unknown;
  if (!Array.isArray(data)) throw new TypeError('入力はJSONオブジェクト配列である必要があります。');
  if (data.length === 0) return { header: null, rows: [] };
  if (Array.isArray(data[0]) || data[0] === null || typeof data[0] !== 'object') {
    throw new TypeError('入力はオブジェクトの配列である必要があります。');
  }
  const header = Object.keys(data[0] as object);
  const rows = (data as Record<string, unknown>[]).map(obj => header.map(k => String(obj[k] ?? '')));
  const filtered = skipEmpty ? rows.filter(r => r.some(c => c !== '')) : rows;
  return { header, rows: filtered };
}

// ---- Java 配列 ----

function parseJava(text: string, hasHeader: boolean, skipEmpty: boolean): ParsedTable {
  // { から始まる部分を取り出す（型宣言・変数名・代入演算子を除去）
  const start = text.indexOf('{');
  if (start === -1) throw new SyntaxError('Java配列の "{" が見つかりません。');
  let src = text.slice(start).replace(/;\s*$/, '').trim();

  let i = 1; // skip outer '{'
  const rows: string[][] = [];

  function skipWs(): void {
    while (i < src.length && /[\s,]/.test(src[i])) i++;
  }

  while (i < src.length) {
    skipWs();
    if (i >= src.length || src[i] === '}') break;
    if (src[i] !== '{') { i++; continue; }
    i++; // skip '{'

    const row: string[] = [];
    while (i < src.length && src[i] !== '}') {
      skipWs();
      if (src[i] === '}') break;
      if (src[i] === '"') {
        let cell = '';
        i++; // skip opening "
        while (i < src.length && src[i] !== '"') {
          if (src[i] === '\\') {
            i++;
            switch (src[i]) {
              case '"':  cell += '"';  break;
              case '\\': cell += '\\'; break;
              case 'n':  cell += '\n'; break;
              case 'r':  cell += '\r'; break;
              case 't':  cell += '\t'; break;
              default:   cell += src[i];
            }
          } else {
            cell += src[i];
          }
          i++;
        }
        i++; // skip closing "
        row.push(cell);
      } else {
        let val = '';
        while (i < src.length && src[i] !== ',' && src[i] !== '}') val += src[i++];
        row.push(val.trim());
      }
    }
    i++; // skip '}'
    rows.push(row);
  }

  const filtered = skipEmpty ? rows.filter(r => r.some(c => c !== '')) : rows;
  if (hasHeader && filtered.length > 0) {
    return { header: filtered[0], rows: filtered.slice(1) };
  }
  return { header: null, rows: filtered };
}

// ---- HTML Table ----

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function parseHtml(text: string, hasHeader: boolean, skipEmpty: boolean): ParsedTable {
  function extractCells(trHtml: string, tag: string): string[] {
    const cells: string[] = [];
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(trHtml)) !== null) {
      cells.push(decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '').trim()));
    }
    return cells;
  }

  function extractRows(html: string, tag: string): string[][] {
    const result: string[][] = [];
    const re = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const cells = extractCells(m[1], tag);
      if (cells.length > 0) result.push(cells);
    }
    return result;
  }

  const theadMatch = text.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
  const tbodyMatch = text.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  const bodyHtml = tbodyMatch ? tbodyMatch[1] : text;

  let theadRows: string[] | null = null;
  if (theadMatch) {
    const heads = extractRows(theadMatch[1], 'th');
    if (heads.length > 0) theadRows = heads[0];
  }

  const dataRows = extractRows(bodyHtml, 'td');

  if (!hasHeader) {
    const all = theadRows ? [theadRows, ...dataRows] : dataRows;
    const filtered = skipEmpty ? all.filter(r => r.some(c => c !== '')) : all;
    return { header: null, rows: filtered };
  }

  if (theadRows) {
    const filtered = skipEmpty ? dataRows.filter(r => r.some(c => c !== '')) : dataRows;
    return { header: theadRows, rows: filtered };
  }

  // No <thead>: first data row becomes header
  if (dataRows.length > 0) {
    const rest = dataRows.slice(1);
    const filtered = skipEmpty ? rest.filter(r => r.some(c => c !== '')) : rest;
    return { header: dataRows[0], rows: filtered };
  }
  return { header: null, rows: [] };
}

// ---- Markdown テーブル ----

function parseMarkdown(text: string, hasHeader: boolean, skipEmpty: boolean): ParsedTable {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));

  function parseRow(line: string): string[] {
    return line.split('|').slice(1, -1).map(c => c.trim());
  }

  function isSeparator(line: string): boolean {
    return /^\|[\s|:-]+\|$/.test(line);
  }

  const dataLines = lines.filter(l => !isSeparator(l));
  const rows = dataLines.map(parseRow);
  const filtered = skipEmpty ? rows.filter(r => r.some(c => c !== '')) : rows;

  if (hasHeader && filtered.length > 0) {
    return { header: filtered[0], rows: filtered.slice(1) };
  }
  return { header: null, rows: filtered };
}

// ==== SERIALIZATION ====

function serializeDsv(table: ParsedTable, delimiter: string, outputHeader: boolean): string {
  function quoteField(field: string): string {
    if (field.includes(delimiter) || field.includes('"') || field.includes('\n') || field.includes('\r')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  function serRow(row: string[]): string {
    return row.map(quoteField).join(delimiter);
  }

  const lines: string[] = [];
  if (outputHeader && table.header) lines.push(serRow(table.header));
  for (const row of table.rows) lines.push(serRow(row));
  return lines.join('\n');
}

function serializeJson2d(table: ParsedTable, outputHeader: boolean): string {
  const rows = outputHeader && table.header ? [table.header, ...table.rows] : table.rows;
  return JSON.stringify(rows, null, 2);
}

function serializeJsonObj(table: ParsedTable): string {
  if (!table.header) throw new TypeError('JSON連想配列出力にはヘッダ行が必要です。');
  const objects = table.rows.map(row =>
    Object.fromEntries(table.header!.map((k, i) => [k, row[i] ?? ''])),
  );
  return JSON.stringify(objects, null, 2);
}

function serializeJava(table: ParsedTable, outputHeader: boolean): string {
  function quoteCell(cell: string): string {
    return `"${cell.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`;
  }

  const allRows = outputHeader && table.header ? [table.header, ...table.rows] : table.rows;
  const inner = allRows.map(row => `  {${row.map(quoteCell).join(', ')}}`).join(',\n');
  return `{\n${inner}\n}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function serializeHtml(table: ParsedTable, outputHeader: boolean): string {
  const parts: string[] = ['<table>'];

  if (outputHeader && table.header) {
    parts.push('  <thead>', '    <tr>');
    for (const cell of table.header) parts.push(`      <th>${escapeHtml(cell)}</th>`);
    parts.push('    </tr>', '  </thead>');
  }

  parts.push('  <tbody>');
  for (const row of table.rows) {
    parts.push('    <tr>');
    for (const cell of row) parts.push(`      <td>${escapeHtml(cell)}</td>`);
    parts.push('    </tr>');
  }
  parts.push('  </tbody>', '</table>');
  return parts.join('\n');
}

function serializeMarkdown(table: ParsedTable, outputHeader: boolean): string {
  const allRows = outputHeader && table.header ? [table.header, ...table.rows] : table.rows;
  if (allRows.length === 0) return '';

  const colCount = Math.max(...allRows.map(r => r.length));
  const widths = Array.from({ length: colCount }, (_, ci) =>
    Math.max(3, ...allRows.map(r => (r[ci] ?? '').length)),
  );

  function serRow(row: string[]): string {
    return '|' + Array.from({ length: colCount }, (_, ci) => ` ${(row[ci] ?? '').padEnd(widths[ci])} `).join('|') + '|';
  }

  const lines: string[] = [];
  if (outputHeader && table.header) {
    lines.push(serRow(table.header));
    lines.push('|' + widths.map(w => ' ' + '-'.repeat(w) + ' ').join('|') + '|');
    for (const row of table.rows) lines.push(serRow(row));
  } else {
    for (const row of allRows) lines.push(serRow(row));
  }
  return lines.join('\n');
}

// ==== エントリポイント ====

function parseInput(text: string, format: TableFormat, hasHeader: boolean, skipEmpty: boolean): ParsedTable {
  switch (format) {
    case 'csv':      return parseDsv(text, ',', hasHeader, skipEmpty);
    case 'tsv':      return parseDsv(text, '\t', hasHeader, skipEmpty);
    case 'json2d':   return parseJson2d(text, hasHeader, skipEmpty);
    case 'jsonobj':  return parseJsonObj(text, skipEmpty);
    case 'java':     return parseJava(text, hasHeader, skipEmpty);
    case 'html':     return parseHtml(text, hasHeader, skipEmpty);
    case 'markdown': return parseMarkdown(text, hasHeader, skipEmpty);
  }
}

function serializeOutput(table: ParsedTable, format: TableFormat, outputHeader: boolean): string {
  switch (format) {
    case 'csv':      return serializeDsv(table, ',', outputHeader);
    case 'tsv':      return serializeDsv(table, '\t', outputHeader);
    case 'json2d':   return serializeJson2d(table, outputHeader);
    case 'jsonobj':  return serializeJsonObj(table);
    case 'java':     return serializeJava(table, outputHeader);
    case 'html':     return serializeHtml(table, outputHeader);
    case 'markdown': return serializeMarkdown(table, outputHeader);
  }
}

export const arrayTableConverter: Converter = {
  id: 'array-table',
  name: '二次元配列変換',
  disableMultiline: true,
  swapMode(container: HTMLElement): void {
    const inputSel = container.querySelector<HTMLSelectElement>('#opt-inputFormat');
    const outputSel = container.querySelector<HTMLSelectElement>('#opt-outputFormat');
    if (!inputSel || !outputSel) return;
    [inputSel.value, outputSel.value] = [outputSel.value, inputSel.value];
  },
  description: () => `
    <p>CSV・TSV（Excel 形式）・JSON 配列・Java 配列・HTML Table・Markdown テーブルの相互変換を行います。</p>
    <div class="converter-options">
      <div>
        <label for="opt-inputFormat">入力形式</label>
        <select id="opt-inputFormat">
          <option value="csv" selected>CSV</option>
          <option value="tsv">TSV</option>
          <option value="json2d">JSON配列（二次元配列）</option>
          <option value="jsonobj">JSON配列（連想配列）</option>
          <option value="java">Java配列</option>
          <option value="html">HTML Table</option>
          <option value="markdown">Markdownテーブル</option>
        </select>
        <label><input id="opt-inputHeader" type="checkbox" checked> ヘッダ行有り</label>
      </div>
      <div>
        <label for="opt-outputFormat">出力形式</label>
        <select id="opt-outputFormat">
          <option value="csv">CSV</option>
          <option value="tsv">TSV</option>
          <option value="json2d">JSON配列（二次元配列）</option>
          <option value="jsonobj">JSON配列（連想配列）</option>
          <option value="java">Java配列</option>
          <option value="html">HTML Table</option>
          <option value="markdown" selected>Markdownテーブル</option>
        </select>
        <label><input id="opt-outputHeader" type="checkbox" checked> ヘッダ行有り</label>
      </div>
      <div>
        <label><input id="opt-skipEmpty" type="checkbox"> 空行スキップ</label>
      </div>
    </div>
  `,
  async convert(text, opts) {
    const inputFormat  = (opts.inputFormat  as TableFormat) ?? 'csv';
    const outputFormat = (opts.outputFormat as TableFormat) ?? 'markdown';
    const inputHeader  = opts.inputHeader  === true;
    const outputHeader = opts.outputHeader === true;
    const skipEmpty    = opts.skipEmpty    === true;

    const table  = parseInput(text, inputFormat, inputHeader, skipEmpty);
    const output = serializeOutput(table, outputFormat, outputHeader);
    return ConverterResult.success(output);
  },
};
