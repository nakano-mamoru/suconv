import { describe, expect, it } from 'vitest';
import { arrayTableConverter } from '../../../../src/ts/converter/format/array-table';

async function convert(text: string, opts: Record<string, unknown>) {
  return arrayTableConverter.convert(text, opts);
}

const CSV_WITH_HEADER = `name,age,city
Alice,30,Tokyo
Bob,25,Osaka`;

const CSV_NO_HEADER = `Alice,30,Tokyo
Bob,25,Osaka`;

const MARKDOWN_TABLE = `| name  | age | city  |
| ----- | --- | ----- |
| Alice | 30  | Tokyo |
| Bob   | 25  | Osaka |`;

describe('arrayTableConverter', () => {
  it('disableMultilineがtrueである', () => {
    expect(arrayTableConverter.disableMultiline).toBe(true);
  });

  // ---- CSV parsing ----

  describe('CSV 入力', () => {
    it('ヘッダあり → ヘッダ分離してデータ2行', async () => {
      const r = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'json2d', inputHeader: true, outputHeader: true,
      });
      expect(r.success).toBe(true);
      const parsed = JSON.parse(r.output) as string[][];
      expect(parsed[0]).toEqual(['name', 'age', 'city']);
      expect(parsed[1]).toEqual(['Alice', '30', 'Tokyo']);
      expect(parsed).toHaveLength(3);
    });

    it('ヘッダなし → 全行データ', async () => {
      const r = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'json2d', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      const parsed = JSON.parse(r.output) as string[][];
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toEqual(['name', 'age', 'city']);
    });

    it('ダブルクォート内のカンマはフィールド区切りにならない', async () => {
      const r = await convert('"a,b","c,d"\n1,2', {
        inputFormat: 'csv', outputFormat: 'json2d', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      const parsed = JSON.parse(r.output) as string[][];
      expect(parsed[0]).toEqual(['a,b', 'c,d']);
    });

    it('ダブルクォート内の改行をサポート（Excel形式）', async () => {
      const r = await convert('"line1\nline2",val', {
        inputFormat: 'csv', outputFormat: 'json2d', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      const parsed = JSON.parse(r.output) as string[][];
      expect(parsed[0][0]).toBe('line1\nline2');
    });

    it('ダブルクォート内の "" は " に変換される', async () => {
      const r = await convert('"say ""hello""",val', {
        inputFormat: 'csv', outputFormat: 'json2d', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      const parsed = JSON.parse(r.output) as string[][];
      expect(parsed[0][0]).toBe('say "hello"');
    });
  });

  // ---- TSV parsing ----

  describe('TSV 入力', () => {
    it('タブ区切りで分割される', async () => {
      const r = await convert('a\tb\nc\td', {
        inputFormat: 'tsv', outputFormat: 'json2d', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      const parsed = JSON.parse(r.output) as string[][];
      expect(parsed[0]).toEqual(['a', 'b']);
      expect(parsed[1]).toEqual(['c', 'd']);
    });
  });

  // ---- JSON 二次元配列 parsing ----

  describe('JSON二次元配列 入力', () => {
    it('2次元配列をパース', async () => {
      const r = await convert('[["h1","h2"],["v1","v2"]]', {
        inputFormat: 'json2d', outputFormat: 'csv', inputHeader: true, outputHeader: true,
      });
      expect(r.success).toBe(true);
      expect(r.output).toBe('h1,h2\nv1,v2');
    });
  });

  // ---- JSON 連想配列 parsing ----

  describe('JSON連想配列 入力', () => {
    it('オブジェクト配列 → キーがヘッダになる', async () => {
      const r = await convert('[{"name":"Alice","age":30},{"name":"Bob","age":25}]', {
        inputFormat: 'jsonobj', outputFormat: 'csv', inputHeader: true, outputHeader: true,
      });
      expect(r.success).toBe(true);
      expect(r.output).toContain('name,age');
      expect(r.output).toContain('Alice,30');
    });

    it('配列内の配列を入力するとエラーが投げられる', async () => {
      await expect(
        convert('[["a"],["b"]]', {
          inputFormat: 'jsonobj', outputFormat: 'csv', inputHeader: false, outputHeader: false,
        }),
      ).rejects.toThrow();
    });
  });

  // ---- Java array parsing ----

  describe('Java配列 入力', () => {
    it('初期化子 {{...},{...}} をパース', async () => {
      const r = await convert('{\n  {"name", "age"},\n  {"Alice", "30"}\n}', {
        inputFormat: 'java', outputFormat: 'csv', inputHeader: true, outputHeader: true,
      });
      expect(r.success).toBe(true);
      expect(r.output).toBe('name,age\nAlice,30');
    });

    it('型宣言付きをパース', async () => {
      const r = await convert('String[][] d = {{"a","b"},{"c","d"}};', {
        inputFormat: 'java', outputFormat: 'json2d', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      const parsed = JSON.parse(r.output) as string[][];
      expect(parsed[0]).toEqual(['a', 'b']);
    });

    it('バックスラッシュエスケープ \\n が改行になる', async () => {
      const r = await convert('{{"line1\\nline2"}}', {
        inputFormat: 'java', outputFormat: 'json2d', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      const parsed = JSON.parse(r.output) as string[][];
      expect(parsed[0][0]).toBe('line1\nline2');
    });
  });

  // ---- HTML Table parsing ----

  describe('HTML Table 入力', () => {
    it('<thead>/<tbody> 構造をパース', async () => {
      const html = `<table>
  <thead><tr><th>name</th><th>age</th></tr></thead>
  <tbody>
    <tr><td>Alice</td><td>30</td></tr>
    <tr><td>Bob</td><td>25</td></tr>
  </tbody>
</table>`;
      const r = await convert(html, {
        inputFormat: 'html', outputFormat: 'csv', inputHeader: true, outputHeader: true,
      });
      expect(r.success).toBe(true);
      expect(r.output).toBe('name,age\nAlice,30\nBob,25');
    });

    it('HTMLエンティティをデコードする', async () => {
      const html = '<table><tbody><tr><td>a &amp; b</td><td>&lt;c&gt;</td></tr></tbody></table>';
      const r = await convert(html, {
        inputFormat: 'html', outputFormat: 'json2d', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      const parsed = JSON.parse(r.output) as string[][];
      expect(parsed[0]).toEqual(['a & b', '<c>']);
    });
  });

  // ---- Markdown table parsing ----

  describe('Markdown テーブル 入力', () => {
    it('ヘッダ行とデータ行をパース', async () => {
      const r = await convert(MARKDOWN_TABLE, {
        inputFormat: 'markdown', outputFormat: 'csv', inputHeader: true, outputHeader: true,
      });
      expect(r.success).toBe(true);
      expect(r.output).toBe('name,age,city\nAlice,30,Tokyo\nBob,25,Osaka');
    });

    it('区切り行はスキップされる', async () => {
      const r = await convert(MARKDOWN_TABLE, {
        inputFormat: 'markdown', outputFormat: 'json2d', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      const parsed = JSON.parse(r.output) as string[][];
      // separator is not included in rows
      expect(parsed.every(row => !row.some(c => /^[-:]+$/.test(c)))).toBe(true);
    });
  });

  // ---- CSV serialization ----

  describe('CSV 出力', () => {
    it('カンマを含むフィールドはクォートされる', async () => {
      const r = await convert('[["a,b","c"]]', {
        inputFormat: 'json2d', outputFormat: 'csv', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      expect(r.output).toBe('"a,b",c');
    });

    it('ダブルクォートを含むフィールドは "" でエスケープされる', async () => {
      const r = await convert('[["say \\"hi\\"","x"]]', {
        inputFormat: 'json2d', outputFormat: 'csv', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      expect(r.output).toBe('"say ""hi""",x');
    });

    it('outputHeader=false でヘッダ行を除外', async () => {
      const r = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'csv', inputHeader: true, outputHeader: false,
      });
      expect(r.success).toBe(true);
      expect(r.output).toBe('Alice,30,Tokyo\nBob,25,Osaka');
    });
  });

  // ---- Java serialization ----

  describe('Java配列 出力', () => {
    it('ヘッダ・データを {{...}} 形式で出力', async () => {
      const r = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'java', inputHeader: true, outputHeader: true,
      });
      expect(r.success).toBe(true);
      expect(r.output).toContain('{"name", "age", "city"}');
      expect(r.output).toContain('{"Alice", "30", "Tokyo"}');
    });

    it('最後の行末にカンマがない', async () => {
      const r = await convert(CSV_NO_HEADER, {
        inputFormat: 'csv', outputFormat: 'java', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      expect(r.output).not.toMatch(/,\s*\n\}/);
    });
  });

  // ---- HTML serialization ----

  describe('HTML Table 出力', () => {
    it('outputHeader=true で <thead><th> を出力', async () => {
      const r = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'html', inputHeader: true, outputHeader: true,
      });
      expect(r.success).toBe(true);
      expect(r.output).toContain('<thead>');
      expect(r.output).toContain('<th>name</th>');
      expect(r.output).toContain('<td>Alice</td>');
    });

    it('outputHeader=false で <thead> なし', async () => {
      const r = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'html', inputHeader: true, outputHeader: false,
      });
      expect(r.success).toBe(true);
      expect(r.output).not.toContain('<thead>');
      expect(r.output).not.toContain('<th>');
    });

    it('< > & をHTMLエスケープする', async () => {
      const r = await convert('[["<b>","a&b"]]', {
        inputFormat: 'json2d', outputFormat: 'html', inputHeader: false, outputHeader: false,
      });
      expect(r.success).toBe(true);
      expect(r.output).toContain('&lt;b&gt;');
      expect(r.output).toContain('a&amp;b');
    });
  });

  // ---- Markdown serialization ----

  describe('Markdown テーブル 出力', () => {
    it('outputHeader=true で区切り行を含む', async () => {
      const r = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'markdown', inputHeader: true, outputHeader: true,
      });
      expect(r.success).toBe(true);
      const lines = r.output.split('\n');
      expect(lines[0]).toContain('name');
      expect(lines[1]).toMatch(/^\|[\s|-]+\|$/);
      expect(lines[2]).toContain('Alice');
    });

    it('outputHeader=false で区切り行なし', async () => {
      const r = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'markdown', inputHeader: true, outputHeader: false,
      });
      expect(r.success).toBe(true);
      expect(r.output).not.toMatch(/^\|[-\s|]+\|$/m);
    });
  });

  // ---- 空行スキップ ----

  describe('空行スキップ', () => {
    it('skipEmpty=true で空行が除去される', async () => {
      const r = await convert('a,b\n\nc,d', {
        inputFormat: 'csv', outputFormat: 'json2d', inputHeader: false, outputHeader: false, skipEmpty: true,
      });
      expect(r.success).toBe(true);
      const parsed = JSON.parse(r.output) as string[][];
      expect(parsed).toHaveLength(2);
    });

    it('skipEmpty=false で空行が保持される', async () => {
      const r = await convert('a,b\n\nc,d', {
        inputFormat: 'csv', outputFormat: 'json2d', inputHeader: false, outputHeader: false, skipEmpty: false,
      });
      expect(r.success).toBe(true);
      const parsed = JSON.parse(r.output) as string[][];
      expect(parsed).toHaveLength(3);
    });
  });

  // ---- 往復変換 ----

  describe('往復変換', () => {
    it('CSV → Markdown → CSV', async () => {
      const md = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'markdown', inputHeader: true, outputHeader: true,
      });
      expect(md.success).toBe(true);

      const back = await convert(md.output, {
        inputFormat: 'markdown', outputFormat: 'csv', inputHeader: true, outputHeader: true,
      });
      expect(back.success).toBe(true);
      expect(back.output).toBe(CSV_WITH_HEADER);
    });

    it('CSV → JSON二次元配列 → CSV', async () => {
      const json = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'json2d', inputHeader: true, outputHeader: true,
      });
      expect(json.success).toBe(true);

      const back = await convert(json.output, {
        inputFormat: 'json2d', outputFormat: 'csv', inputHeader: true, outputHeader: true,
      });
      expect(back.success).toBe(true);
      expect(back.output).toBe(CSV_WITH_HEADER);
    });

    it('CSV → JSON連想配列 → CSV', async () => {
      const json = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'jsonobj', inputHeader: true, outputHeader: true,
      });
      expect(json.success).toBe(true);
      const parsed = JSON.parse(json.output) as Record<string, string>[];
      expect(parsed[0]).toEqual({ name: 'Alice', age: '30', city: 'Tokyo' });

      const back = await convert(json.output, {
        inputFormat: 'jsonobj', outputFormat: 'csv', inputHeader: true, outputHeader: true,
      });
      expect(back.success).toBe(true);
      expect(back.output).toBe(CSV_WITH_HEADER);
    });

    it('CSV → Java → CSV', async () => {
      const java = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'java', inputHeader: true, outputHeader: true,
      });
      expect(java.success).toBe(true);

      const back = await convert(java.output, {
        inputFormat: 'java', outputFormat: 'csv', inputHeader: true, outputHeader: true,
      });
      expect(back.success).toBe(true);
      expect(back.output).toBe(CSV_WITH_HEADER);
    });

    it('CSV → HTML → CSV', async () => {
      const html = await convert(CSV_WITH_HEADER, {
        inputFormat: 'csv', outputFormat: 'html', inputHeader: true, outputHeader: true,
      });
      expect(html.success).toBe(true);

      const back = await convert(html.output, {
        inputFormat: 'html', outputFormat: 'csv', inputHeader: true, outputHeader: true,
      });
      expect(back.success).toBe(true);
      expect(back.output).toBe(CSV_WITH_HEADER);
    });
  });
});
