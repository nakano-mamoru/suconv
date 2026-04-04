import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';

type EscapeType = 'html' | 'xml' | 'url' | 'literal';
type EscapeMode = 'escape' | 'unescape';

const ENTITY_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const NUMERIC_ESCAPE_MAP: Record<string, string> = {
  '&': '&#38;',
  '<': '&#60;',
  '>': '&#62;',
  '"': '&#34;',
  "'": '&#39;',
};

function escapeMarkup(text: string, useNumericReference: boolean, replaceSpaceToNbsp: boolean): string {
  const table = useNumericReference ? NUMERIC_ESCAPE_MAP : ENTITY_ESCAPE_MAP;
  let escaped = text.replace(/[&<>"']/g, (char) => table[char]);
  if (replaceSpaceToNbsp) {
    escaped = escaped.replace(/ /g, '&nbsp;');
  }
  return escaped;
}

function decodeNumericEntity(text: string): string {
  return text.replace(/&#(x?[0-9a-fA-F]+);/g, (_all, body) => {
    const codePoint = body.startsWith('x') || body.startsWith('X')
      ? Number.parseInt(body.slice(1), 16)
      : Number.parseInt(body, 10);
    return String.fromCodePoint(codePoint);
  });
}

function unescapeMarkup(text: string): string {
  return decodeNumericEntity(
    text
      .replace(/&nbsp;/g, String.fromCodePoint(0xa0))
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&'),
  );
}

function escapeAsUxLiteral(text: string): string {
  return Array.from(text)
    .map((char) => `\\ux${(char.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`)
    .join('');
}

function unescapeUxLiteral(text: string): string {
  return text.replace(/\\ux([0-9a-fA-F]{1,6})/g, (_all, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
}

function escapeAsUxXml(text: string): string {
  return Array.from(text)
    .map((char) => `&ux${(char.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')};`)
    .join('');
}

function unescapeUxXml(text: string): string {
  return text.replace(/&ux([0-9a-fA-F]{1,6});?/g, (_all, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
}

function unwrapStringLiteral(text: string): string {
  if (text.length < 2) {
    return text;
  }

  if (text.startsWith('@"') && text.endsWith('"')) {
    return text.slice(2, -1);
  }

  const first = text[0];
  const last = text[text.length - 1];
  if ((first === '"' || first === "'" || first === '`') && last === first) {
    return text.slice(1, -1);
  }

  return text;
}

function escapeLiteral(text: string, replaceSpaceToNbsp: boolean): string {
  let escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/\u0008/g, '\\b')
    .replace(/\u000c/g, '\\f')
    .replace(/\u000b/g, '\\v')
    .replace(/\0/g, '\\0')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'");

  if (replaceSpaceToNbsp) {
    escaped = escaped.replace(/ /g, '\\u00A0');
  }

  return escaped;
}

function unescapeLiteral(text: string): string {
  return unwrapStringLiteral(text)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_all, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_all, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\u0008')
    .replace(/\\f/g, '\u000c')
    .replace(/\\v/g, '\u000b')
    .replace(/\\0/g, '\0')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

export const escapeStringConverter: Converter = {
  id: 'escape-string',
  name: '文字列エスケープ/アンエスケープ',
  description: () => `
    <p>文字列のエスケープ/アンエスケープを行います。</p>
    <div class="converter-options">
      <div>
        <label for="opt-escapeMode">処理</label>
        <select id="opt-escapeMode">
          <option value="escape" selected>エスケイプ</option>
          <option value="unescape">アンエスケイプ</option>
        </select>
      </div>
      <div>
        <label for="opt-escapeType">エスケイプ種別</label>
        <select id="opt-escapeType">
          <option value="html" selected>HTML</option>
          <option value="xml">XML</option>
          <option value="url">URLEncode</option>
          <option value="literal">JSON/Java/C#リテラル文字列</option>
        </select>
      </div>
      <div>
        <label><input id="opt-useEntityReference" type="checkbox"> 数値文字参照を使用</label>
      </div>
      <div>
        <label><input id="opt-replaceSpaceToNbsp" type="checkbox"> 半角空白(0x20)を&amp;nbsp;(0xA0)に置換する</label>
      </div>
    </div>
  `,
  async convert(text, opts) {
    const { escapeMode, escapeType, useEntityReference, replaceSpaceToNbsp } = opts;

    if ((escapeMode as EscapeMode) === 'unescape') {
      switch (escapeType as EscapeType) {
        case 'html':
          return ConverterResult.success(unescapeMarkup(text));
        case 'xml':
          return ConverterResult.success(unescapeMarkup(text));
        case 'url':
          return ConverterResult.success(decodeURIComponent(text));
        default:
          return ConverterResult.success(useEntityReference === true ? unescapeUxLiteral(unwrapStringLiteral(text)) : unescapeLiteral(text));
      }
    }

    switch (escapeType as EscapeType) {
      case 'html':
        return ConverterResult.success(escapeMarkup(text, useEntityReference === true, replaceSpaceToNbsp === true));
      case 'xml':
        return ConverterResult.success(escapeMarkup(text, useEntityReference === true, replaceSpaceToNbsp === true));
      case 'url':
        return ConverterResult.success(encodeURIComponent(text));
      default:
        return ConverterResult.success(useEntityReference === true
          ? escapeAsUxLiteral(text)
          : escapeLiteral(text, replaceSpaceToNbsp === true));
    }
  },
};
