import { describe, expect, it } from 'vitest';
import { structuredDataConverter } from '../../../../src/ts/converter/format/structured-data';

const SIMPLE_JSON = '{"name":"Alice","age":30,"active":true}';
const NESTED_JSON = '{"server":{"host":"localhost","port":8080},"tags":["web","api"]}';

async function convert(text: string, opts: Record<string, unknown>) {
  return structuredDataConverter.convert(text, opts);
}

describe('structuredDataConverter', () => {
  it('disableMultilineがtrueである', () => {
    expect(structuredDataConverter.disableMultiline).toBe(true);
  });

  it('setupDescriptionが定義されている', () => {
    expect(typeof structuredDataConverter.setupDescription).toBe('function');
  });

  describe('インデントなし → 改行なし', () => {
    it('JSON noneは改行なし', async () => {
      const result = await convert(SIMPLE_JSON, { inputFormat: 'json', outputFormat: 'json', indentMode: 'none' });
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('\n');
    });

    it('JavaScript noneは改行なし', async () => {
      const result = await convert(SIMPLE_JSON, { inputFormat: 'json', outputFormat: 'javascript', indentMode: 'none' });
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('\n');
    });

    it('XML noneは改行なし', async () => {
      const result = await convert(NESTED_JSON, { inputFormat: 'json', outputFormat: 'xml', indentMode: 'none' });
      expect(result.success).toBe(true);
      expect(result.output).not.toContain('\n');
    });
  });

  describe('JSON → 各形式', () => {
    it('JSON → JSON（インデントなし）', async () => {
      const result = await convert(SIMPLE_JSON, { inputFormat: 'json', outputFormat: 'json', indentMode: 'none' });
      expect(result.success).toBe(true);
      expect(JSON.parse(result.output)).toEqual({ name: 'Alice', age: 30, active: true });
      expect(result.output).not.toContain('\n');
    });

    it('JSON → JSON（空白2文字）', async () => {
      const result = await convert(SIMPLE_JSON, { inputFormat: 'json', outputFormat: 'json', indentMode: '2' });
      expect(result.success).toBe(true);
      expect(result.output).toContain('  "name"');
    });

    it('JSON → JSON（空白4文字）', async () => {
      const result = await convert(SIMPLE_JSON, { inputFormat: 'json', outputFormat: 'json', indentMode: '4' });
      expect(result.success).toBe(true);
      expect(result.output).toContain('    "name"');
    });

    it('JSON → JSON（Tab）', async () => {
      const result = await convert(SIMPLE_JSON, { inputFormat: 'json', outputFormat: 'json', indentMode: 'tab' });
      expect(result.success).toBe(true);
      expect(result.output).toContain('\t"name"');
    });

    it('JSON → YAML', async () => {
      const result = await convert(SIMPLE_JSON, { inputFormat: 'json', outputFormat: 'yaml', indentMode: '2' });
      expect(result.success).toBe(true);
      expect(result.output).toContain('name: Alice');
      expect(result.output).toContain('age: 30');
    });

    it('JSON → TOML', async () => {
      const result = await convert(NESTED_JSON, { inputFormat: 'json', outputFormat: 'toml', indentMode: '2' });
      expect(result.success).toBe(true);
      expect(result.output).toContain('[server]');
      expect(result.output).toContain("host = 'localhost'");
    });

    it('JSON → XML', async () => {
      const result = await convert(NESTED_JSON, { inputFormat: 'json', outputFormat: 'xml', indentMode: '2' });
      expect(result.success).toBe(true);
      expect(result.output).toContain('<server>');
      expect(result.output).toContain('<host>localhost</host>');
    });

    it('JSON → JavaScript', async () => {
      const result = await convert(SIMPLE_JSON, { inputFormat: 'json', outputFormat: 'javascript', indentMode: '2' });
      expect(result.success).toBe(true);
      expect(result.output).toContain('name:');
      expect(result.output).toContain('"Alice"');
    });
  });

  describe('YAML → 各形式', () => {
    const YAML_SRC = 'server:\n  host: localhost\n  port: 8080\n';

    it('YAML → JSON', async () => {
      const result = await convert(YAML_SRC, { inputFormat: 'yaml', outputFormat: 'json', indentMode: '2' });
      expect(result.success).toBe(true);
      const obj = JSON.parse(result.output);
      expect(obj.server.host).toBe('localhost');
      expect(obj.server.port).toBe(8080);
    });

    it('YAML → TOML', async () => {
      const result = await convert(YAML_SRC, { inputFormat: 'yaml', outputFormat: 'toml', indentMode: '2' });
      expect(result.success).toBe(true);
      expect(result.output).toContain('[server]');
    });
  });

  describe('TOML → 各形式', () => {
    const TOML_SRC = '[server]\nhost = "localhost"\nport = 8080\n';

    it('TOML → JSON', async () => {
      const result = await convert(TOML_SRC, { inputFormat: 'toml', outputFormat: 'json', indentMode: '2' });
      expect(result.success).toBe(true);
      const obj = JSON.parse(result.output);
      expect(obj.server.host).toBe('localhost');
      expect(obj.server.port).toBe(8080);
    });

    it('TOML → YAML', async () => {
      const result = await convert(TOML_SRC, { inputFormat: 'toml', outputFormat: 'yaml', indentMode: '2' });
      expect(result.success).toBe(true);
      expect(result.output).toContain('server:');
      expect(result.output).toContain('host: localhost');
    });
  });

  describe('XML → 各形式', () => {
    const XML_SRC = '<root><name>Alice</name><age>30</age></root>';

    it('XML → JSON', async () => {
      const result = await convert(XML_SRC, { inputFormat: 'xml', outputFormat: 'json', indentMode: '2' });
      expect(result.success).toBe(true);
      const obj = JSON.parse(result.output);
      expect(obj.root.name).toBe('Alice');
    });

    it('XML → YAML', async () => {
      const result = await convert(XML_SRC, { inputFormat: 'xml', outputFormat: 'yaml', indentMode: '2' });
      expect(result.success).toBe(true);
      expect(result.output).toContain('root:');
    });
  });

  describe('JavaScript → 各形式', () => {
    it('JavaScript（クォートなしキー）→ JSON', async () => {
      const result = await convert('{ name: "Alice", age: 30 }', { inputFormat: 'javascript', outputFormat: 'json', indentMode: 'none' });
      expect(result.success).toBe(true);
      expect(JSON.parse(result.output)).toEqual({ name: 'Alice', age: 30 });
    });

    it('JavaScript（末尾カンマ）→ JSON', async () => {
      const result = await convert('{ name: "Alice", age: 30, }', { inputFormat: 'javascript', outputFormat: 'json', indentMode: 'none' });
      expect(result.success).toBe(true);
      expect(JSON.parse(result.output)).toEqual({ name: 'Alice', age: 30 });
    });
  });

  describe('往復変換', () => {
    it('JSON → YAML → JSON でデータが保たれる', async () => {
      const toYaml = await convert(NESTED_JSON, { inputFormat: 'json', outputFormat: 'yaml', indentMode: '2' });
      expect(toYaml.success).toBe(true);
      const backToJson = await convert(toYaml.output, { inputFormat: 'yaml', outputFormat: 'json', indentMode: 'none' });
      expect(backToJson.success).toBe(true);
      expect(JSON.parse(backToJson.output)).toEqual(JSON.parse(NESTED_JSON));
    });

    it('JSON → TOML → JSON でデータが保たれる', async () => {
      const toToml = await convert(NESTED_JSON, { inputFormat: 'json', outputFormat: 'toml', indentMode: '2' });
      expect(toToml.success).toBe(true);
      const backToJson = await convert(toToml.output, { inputFormat: 'toml', outputFormat: 'json', indentMode: 'none' });
      expect(backToJson.success).toBe(true);
      const parsed = JSON.parse(backToJson.output);
      expect(parsed.server.host).toBe('localhost');
      expect(parsed.server.port).toBe(8080);
    });
  });

  describe('XML 属性優先', () => {
    const PERSON_JSON = '{"person":{"name":"Alice","age":30,"active":true}}';
    const MIXED_JSON  = '{"server":{"host":"localhost","port":8080},"tags":["web","api"]}';

    it('オブジェクト要素のスカラー値が属性として出力される', async () => {
      const result = await convert(PERSON_JSON, {
        inputFormat: 'json', outputFormat: 'xml', indentMode: '2', xmlAttributeFirst: true,
      });
      expect(result.success).toBe(true);
      expect(result.output).toMatch(/name="Alice"/);
      expect(result.output).toMatch(/age="30"/);
      expect(result.output).toMatch(/active="true"/);
      // 属性に昇格したので子要素はない
      expect(result.output).not.toContain('<name>');
      expect(result.output).not.toContain('<age>');
    });

    it('ネストしたオブジェクトのスカラーも属性になる', async () => {
      const result = await convert(MIXED_JSON, {
        inputFormat: 'json', outputFormat: 'xml', indentMode: '2', xmlAttributeFirst: true,
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('<server');
      expect(result.output).toMatch(/host="localhost"/);
      expect(result.output).toMatch(/port="8080"/);
      expect(result.output).not.toContain('<host>');
    });

    it('配列の要素は子要素のまま', async () => {
      const result = await convert(MIXED_JSON, {
        inputFormat: 'json', outputFormat: 'xml', indentMode: '2', xmlAttributeFirst: true,
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('<tags>');
    });

    it('ルートレベルのスカラー要素はそのまま子要素として出力される', async () => {
      const result = await convert(SIMPLE_JSON, {
        inputFormat: 'json', outputFormat: 'xml', indentMode: '2', xmlAttributeFirst: true,
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('<name>Alice</name>');
    });

    it('xmlAttributeFirstがfalseの場合はデフォルト動作', async () => {
      const result = await convert(PERSON_JSON, {
        inputFormat: 'json', outputFormat: 'xml', indentMode: '2', xmlAttributeFirst: false,
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('<name>Alice</name>');
      expect(result.output).not.toMatch(/name="Alice"/);
    });

    it('XML（属性あり）→ XML（属性優先なし）で子要素として出力', async () => {
      const XML_WITH_ATTRS = '<person name="Alice" age="30"/>';
      const result = await convert(XML_WITH_ATTRS, {
        inputFormat: 'xml', outputFormat: 'xml', indentMode: '2', xmlAttributeFirst: false,
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain('<name>Alice</name>');
      expect(result.output).toContain('<age>30</age>');
      expect(result.output).not.toMatch(/name="Alice"/);
      expect(result.output).not.toMatch(/age="30"/);
    });
  });
});
