import type { Converter, OptionValue } from './types';
import { ConverterResult } from './converter-result';

/**
 * ConvertEngineクラスは、指定されたConverterを使用して文字列の変換処理を実行するためのエンジンです。
 * このクラスは、ConverterのpreProcess、convert、postProcessの各処理を適切な順序で呼び出し、変換結果を管理します。
 * また、lineByLineオプションをサポートしており、入力を行ごとに分割して変換することもできます。 
 */
export class ConvertEngine {
  private converter: Converter;

  constructor(initialConverter: Converter) {
    this.converter = initialConverter;
  }

  setConverter(conv: Converter): void {
    this.converter = conv;
  }

  getConverter(): Converter {
    return this.converter;
  }

  /**
   *  lineByLine が true の場合は、入力を行ごとに分割して各行に対して runSingle を実行し、結果を改行で結合して返します。
   *  lineByLine が false の場合は、入力全体に対して runSingle を実行します。
   *  lineByLine が true の場合は、いずれかの行で変換に失敗した場合に lineErrors=true を返します。
   * @returns 変換後の文字列と、行ごとに変換した際のエラーの有無を返します。 
   * @param input 処理対象の文字列
   * @param opts  コンバータオプションの値のマップ
   * @param lineByLine 行ごとに変換するかどうかのフラグ
   * @returns 変換結果と行ごとのエラー情報
   */
  async run(
    input: string,
    opts: Record<string, OptionValue>,
    lineByLine: boolean,
  ): Promise<ConverterResult> {
    if (lineByLine) {
      const lines = input.split('\n');
      const results = await Promise.all(lines.map((line) => this.runSingle(line, opts)));
      const output = results.map((r) => r.output).join('\n');
      const lineErrors = results.some((r) => !r.success);
      return lineErrors ? ConverterResult.failure(output) : ConverterResult.success(output);
    }

    return await this.runSingle(input, opts);
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
    opts: Record<string, OptionValue>,
  ): Promise<ConverterResult> {
    const pre = this.converter.preProcess
      ? await this.converter.preProcess(input, opts)
      : { success: true as const, output: input };
    if (!pre.success) {
      return pre;
    }

    const converted = await this.converter.convert(pre.output, opts);
    if (!converted.success) {
      return converted;
    }

    return this.converter.postProcess
      ? await this.converter.postProcess(converted.output, opts)
      : converted;
  }
}
