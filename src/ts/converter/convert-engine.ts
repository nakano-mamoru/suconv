import type { Converter, ConverterResult, OptionValue } from './types';

export type ConvertEngineResult = {
  output: string;
  lineErrors: boolean;
};

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

  async run(
    input: string,
    opts: Record<string, OptionValue>,
    lineByLine: boolean,
  ): Promise<ConvertEngineResult> {
    if (lineByLine) {
      const lines = input.split('\n');
      const results = await Promise.all(lines.map((line) => this.runSingle(line, opts)));
      return {
        output: results.map((r) => r.output).join('\n'),
        lineErrors: results.some((r) => !r.success),
      };
    }

    const result = await this.runSingle(input, opts);
    return { output: result.output, lineErrors: false };
  }

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
