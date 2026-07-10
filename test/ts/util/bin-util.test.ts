import { describe, expect, it } from 'vitest';
import { decodeInput, encodeOutput, getSelectHtml } from '../../../src/ts/util/bin-util';

describe('bin-util', () => {
  it('getSelectHtml: selectタグを生成する', () => {
    const html = getSelectHtml('opt-mode', ['utf8-text']);

    expect(html).toContain('<select id="opt-mode">');
    expect(html).not.toContain('value="utf8-text"');
    expect(html).toContain('value="hex-string" selected');
  });

  it('decodeInput/encodeOutput: Base64URLを往復変換できる', () => {
    const bytes = decodeInput('aGVsbG8', 'base64url-string');
    const output = encodeOutput(bytes, 'utf8-text');

    expect(output).toBe('hello');
  });

  it('encodeOutput: decimal-commaで16バイト単位改行できる', () => {
    const bytes = Uint8Array.from({ length: 20 }, (_, i) => i);
    const output = encodeOutput(bytes, 'decimal-comma', { csvLineBreak: 'line' });

    const lines = output.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[0].split(',').filter(Boolean).length).toBe(16);
    expect(lines[1].split(',').filter(Boolean).length).toBe(4);
  });
});
