import type { Converter } from '../converter';
import { ConverterResult } from '../converter-result';
import prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';
import * as htmlPlugin from 'prettier/plugins/html';
import * as yamlPlugin from 'prettier/plugins/yaml';
import xmlPlugin from '@prettier/plugin-xml';
import { format as formatSql } from 'sql-formatter';
import * as TOML from '@ltd/j-toml';

type PrettierInputFormat = 'html' | 'xml' | 'json' | 'javascript' | 'sql' | 'yaml' | 'toml';

const PRETTIER_PLUGINS = [babelPlugin, estreePlugin, htmlPlugin, yamlPlugin, xmlPlugin];

export const prettierFormatConverter: Converter = {
  id: 'prettier-format',
  name: 'Prettier整形',
  description: () => `
    <p>Prettier および SQL 整形ライブラリで入力テキストを整形します。</p>
    <div class="converter-options">
      <div>
        <label for="opt-inputFormat">入力形式</label>
        <select id="opt-inputFormat">
          <option value="html">HTML</option>
          <option value="xml">XML</option>
          <option value="json" selected>JSON</option>
          <option value="javascript">Javascript</option>
          <option value="sql">SQL</option>
          <option value="yaml">YAML</option>
          <option value="toml">TOML</option>
        </select>
      </div>
      <div id="grp-sql-leading-comma" hidden>
        <label><input id="opt-sqlCommaBefore" type="checkbox"> 区切り文字を列名の前に配置</label>
      </div>
    </div>
  `,
  setupDescription(container: HTMLElement): void {
    const inputFormatSelect = container.querySelector<HTMLSelectElement>('#opt-inputFormat');
    const sqlCommaGroup = container.querySelector<HTMLElement>('#grp-sql-leading-comma');
    if (!inputFormatSelect) return;

    const update = (): void => {
      if (sqlCommaGroup) {
        sqlCommaGroup.hidden = inputFormatSelect.value !== 'sql';
      }
    };

    inputFormatSelect.addEventListener('change', update);
    update();
  },
  async convert(text, opts) {
    const inputFormat = (opts.inputFormat as PrettierInputFormat) ?? 'json';

    if (inputFormat === 'sql') {
      return ConverterResult.success(formatSql(text, {
        language: 'sql',
        tabWidth: 2,
        commaPosition: opts.sqlCommaBefore === true ? 'before' : 'after',
      }));
    }

    if (inputFormat === 'toml') {
      const parsed = TOML.parse(text, { joiner: '\n', bigint: false });
      return ConverterResult.success(TOML.stringify(parsed, {
        newline: '\n',
        indent: '  ',
        forceInlineArraySpacing: false,
        newlineAround: 'section',
        xNull: false,
      }));
    }

    const parserMap: Record<Exclude<PrettierInputFormat, 'sql' | 'toml'>, 'html' | 'xml' | 'json' | 'babel' | 'yaml'> = {
      html: 'html',
      xml: 'xml',
      json: 'json',
      javascript: 'babel',
      yaml: 'yaml',
    };

    const parser = parserMap[inputFormat as Exclude<PrettierInputFormat, 'sql' | 'toml'>];
    return ConverterResult.success(await prettier.format(text, {
      parser,
      plugins: PRETTIER_PLUGINS,
      tabWidth: 2,
      useTabs: false,
      printWidth: 100,
      singleQuote: true,
    }));
  },
};
