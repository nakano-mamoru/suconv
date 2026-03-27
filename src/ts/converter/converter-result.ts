
/**
 * 変換処理の結果を表すクラス
 * ConverterResultクラスは、変換処理の成功や失敗を表すためのプロパティと、変換の出力内容を保持するプロパティを持っています。
 * また、成功結果や失敗結果を生成するためのユーティリティメソッドも提供しています。 
 */
export class ConverterResult {
    /**
     * 変換の成功を表すフラグ。成功の場合はtrue、失敗の場合はfalseになります。
     * 初期値はfalseで、成功結果を生成する際にはsuccess()メソッドを使用してtrueに設定されます。
     * 失敗結果を生成する際にはfailure()メソッドを使用してfalseに設定されます。
     * このプロパティは、変換処理の結果が成功か失敗かを簡単に判定するために使用されます。
     * 成功の場合はtrue、失敗の場合はfalseになります。
     */
    public success = false;

    /**
     * 変換の出力内容を表すプロパティ。成功した場合は変換後の文字列などが格納され、失敗した場合はエラーメッセージなどが格納されます。
     * 初期値は空文字列で、成功結果を生成する際にはsuccess()メソッドを使用して変換後の内容を設定します。
     * 失敗結果を生成する際にはfailure()メソッドを使用してエラーメッセージなどの内容を設定します。
     * このプロパティは、変換処理の結果の内容を保持するために使用されます。
     * 成功した場合は変換後の文字列などが格納され、失敗した場合はエラーメッセージなどが格納されます。
     */
    public output = '';

    /**
     * 成功結果を生成するユーティリティメソッド
     * @param output 変換後の文字列などの出力内容
     * @returns 成功を表すConverterResultインスタンス
     */
    public static success(output: string): ConverterResult {
        const result = new ConverterResult();
        result.success = true;
        result.output = output;
        return result;
    }

    /**
     * エラー結果を生成するユーティリティメソッド
     * @param output エラーメッセージなどの出力内容
     * @returns  失敗を表すConverterResultインスタンス
     */
    public static failure(output: string): ConverterResult {
        const result = new ConverterResult();
        result.success = false;
        result.output = output;
        return result;
    }
}