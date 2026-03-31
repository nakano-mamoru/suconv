import type { Converter } from './converter';
import type { ConverterParams } from './converter-params';
import { ConverterResult } from './converter-result';
import { defaultParams } from '../storage/default-params';

/**
 * ConvertEngineクラスは、指定されたConverterを使用して文字列の変換処理を実行するためのエンジンです。
 * このクラスは、ConverterのpreProcess、convert、postProcessの各処理を適切な順序で呼び出し、変換結果を管理します。
 * また、lineByLineオプションをサポートしており、入力を行ごとに分割して変換することもできます。 
 */
export class ConvertEngine {
  private converter: Converter;
  private static readonly USER_ERROR_MESSAGE = 'エラーが発生しました。';

  constructor(initialConverter: Converter) {
    this.converter = initialConverter;
  }

  setConverter(conv: Converter): void {
    this.converter = conv;
  }

  getConverter(): Converter {
    return this.converter;
  }

  getOptions(container: ParentNode = document): ConverterParams {
    const options: ConverterParams = {};
    const elements = container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[id^="opt-"]');

    elements.forEach((element) => {
      const optionKey = element.id.replace(/^opt-/, '');
      if (!optionKey) {
        return;
      }

      if (element instanceof HTMLInputElement) {
        if (element.type === 'checkbox') {
          options[optionKey] = element.checked;
          return;
        }

        options[optionKey] = element.value;
        return;
      }

      options[optionKey] = element.value;
    });

    return options;
  }

  /**
   * lineByLine が true の場合は、入力を行ごとに分割して各行に対して runSingle を実行し、結果を改行で結合して返します。
   * lineByLine が false の場合は、入力全体に対して runSingle を実行します。
   * lineByLine が true の場合は、いずれかの行で変換に失敗した場合に lineErrors=true を返します。
   * @returns 変換後の文字列と、行ごとに変換した際のエラーの有無を返します。 
   * @param input 処理対象の文字列
   * @param opts  コンバータオプションの値のマップ
   * @param lineByLine 行ごとに変換するかどうかのフラグ
   * @returns 変換結果と行ごとのエラー情報
   */
  async run(
    input: string,
    opts: ConverterParams,
    lineByLine: boolean,
    saveDefaultParams = false,
  ): Promise<ConverterResult> {
    let result: ConverterResult;

    if (lineByLine) {
      const lines = input.split('\n');
      const results = await Promise.all(lines.map((line) => this.runSingle(line, opts)));
      const output = results.map((r) => r.output).join('\n');
      const lineErrors = results.some((r) => !r.success);
      result = lineErrors ? ConverterResult.failure(output) : ConverterResult.success(output);
    } else {
      result = await this.runSingle(input, opts);
    }

    if (saveDefaultParams && result.success) {
      await defaultParams.merge(opts);
    }

    return result;
  }

  applyDefaultParamsToDescription(): void {
    const params = defaultParams.value;
    Object.entries(params).forEach(([key, value]) => {
      const element = document.getElementById(`opt-${key}`);
      if (!element) {
        return;
      }

      if (element instanceof HTMLInputElement) {
        if (element.type === 'checkbox') {
          element.checked = value === true;
        } else if (typeof value === 'string') {
          element.value = value;
        }
        return;
      }

      if (element instanceof HTMLSelectElement && typeof value === 'string') {
        element.value = value;
      }
    });
  }

  /**
   * 1行の入力に対して、preProcess → convert → postProcess の順で処理を実行します。
   * preProcess や postProcess が未実装の場合はスキップされます。
   * @param input 処理対象の文字列（1行）
   * @param opts  コンバータオプションの値のマップ  
   * @returns   処理結果。preProcess や convert のいずれかが失敗した場合は success=false で返されます。
   *            postProcess が失敗しても success=true のまま出力されます（変換自体は成功しているため）。 
   */
  private async runSingle(
    input: string,
    opts: ConverterParams,
  ): Promise<ConverterResult> {
    const fail = (detail: unknown): ConverterResult => {
      console.error(detail);
      return ConverterResult.failure(ConvertEngine.USER_ERROR_MESSAGE);
    };

    const pre = this.converter.preProcess
      ? await this.converter.preProcess(input, opts)
      : { success: true as const, output: input };
    if (!pre.success) {
      return fail(pre.output);
    }

    let converted: ConverterResult;
    try {
      converted = await this.converter.convert(pre.output, opts);
    } catch (error) {
      return fail(error);
    }
    if (!converted.success) {
      return fail(converted.output);
    }

    const post = this.converter.postProcess
      ? await this.converter.postProcess(converted.output, opts)
      : converted;
    return post.success ? post : fail(post.output);
  }
}
