import { describe, expect, it } from 'vitest';
import { datetimeConverter } from '../../../../src/ts/converter/utility/datetime';

// Fixed timestamp: 2024-03-15T12:34:56.789Z
const UTC_MS = Date.UTC(2024, 2, 15, 12, 34, 56, 789);
const UTC_MS_NO_MS = Date.UTC(2024, 2, 15, 12, 34, 56, 0);

describe('datetimeConverter', () => {
  // --- ISO-8601 input ---
  it('convert: ISO-8601入力 → エポックミリ秒出力', async () => {
    const result = await datetimeConverter.convert('2024-03-15T12:34:56.789Z', {
      'inputMode': 'iso8601',
      'outputMode': 'epochms',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(result).toEqual({ success: true, output: String(UTC_MS) });
  });

  it('convert: ISO-8601入力 タイムゾーン付きはinputUtcを無視する', async () => {
    const result = await datetimeConverter.convert('2024-03-15T12:34:56.789Z', {
      'inputMode': 'iso8601',
      'outputMode': 'epochms',
      'inputUtc': false,
      'outputUtc': true,
      'showMs': true,
    });
    expect(result).toEqual({ success: true, output: String(UTC_MS) });
  });

  it('convert: ISO-8601入力 ログ文字列からの抽出', async () => {
    const result = await datetimeConverter.convert('[2024-03-15T12:34:56.789Z] ERROR: something failed', {
      'inputMode': 'iso8601',
      'outputMode': 'epochms',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(result).toEqual({ success: true, output: String(UTC_MS) });
  });

  // --- エポックミリ秒 input/output ---
  it('convert: エポックミリ秒入力 → ISO-8601出力 (UTC, ミリ秒あり)', async () => {
    const result = await datetimeConverter.convert(String(UTC_MS), {
      'inputMode': 'epochms',
      'outputMode': 'iso8601',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(result).toEqual({ success: true, output: '2024-03-15T12:34:56.789Z' });
  });

  it('convert: エポックミリ秒入力 → ISO-8601出力 (UTC, ミリ秒なし)', async () => {
    const result = await datetimeConverter.convert(String(UTC_MS), {
      'inputMode': 'epochms',
      'outputMode': 'iso8601',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': false,
    });
    expect(result).toEqual({ success: true, output: '2024-03-15T12:34:56Z' });
  });

  // --- UNIX時間 ---
  it('convert: UNIX時間入力 → エポックミリ秒出力', async () => {
    const unixSec = Math.floor(UTC_MS_NO_MS / 1000);
    const result = await datetimeConverter.convert(String(unixSec), {
      'inputMode': 'unixtime',
      'outputMode': 'epochms',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(result).toEqual({ success: true, output: String(UTC_MS_NO_MS) });
  });

  it('convert: エポックミリ秒入力 → UNIX時間出力', async () => {
    const result = await datetimeConverter.convert(String(UTC_MS), {
      'inputMode': 'epochms',
      'outputMode': 'unixtime',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(result).toEqual({ success: true, output: String(Math.floor(UTC_MS / 1000)) });
  });

  // --- yyyy/mm/dd ---
  it('convert: yyyy/mm/dd入力 → ISO-8601出力 (UTC)', async () => {
    const result = await datetimeConverter.convert('2024/03/15 12:34:56.789', {
      'inputMode': 'yyyymmdd',
      'outputMode': 'iso8601',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(result).toEqual({ success: true, output: '2024-03-15T12:34:56.789Z' });
  });

  it('convert: yyyy/mm/dd入力 秒省略', async () => {
    const result = await datetimeConverter.convert('2024/03/15 12:34', {
      'inputMode': 'yyyymmdd',
      'outputMode': 'epochms',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(result).toEqual({ success: true, output: String(Date.UTC(2024, 2, 15, 12, 34, 0, 0)) });
  });

  // --- Excel シリアル値 ---
  it('convert: エポックミリ秒 → Excel シリアル値 → エポックミリ秒 ラウンドトリップ', async () => {
    const excelResult = await datetimeConverter.convert(String(UTC_MS), {
      'inputMode': 'epochms',
      'outputMode': 'excel',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(excelResult.success).toBe(true);
    const backResult = await datetimeConverter.convert(excelResult.output as string, {
      'inputMode': 'excel',
      'outputMode': 'epochms',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(backResult.success).toBe(true);
    // Allow 1ms rounding
    expect(Math.abs(parseInt(backResult.output as string) - UTC_MS)).toBeLessThanOrEqual(1);
  });

  // --- C#/.NET Ticks ---
  it('convert: エポックミリ秒 → .NET Ticks → エポックミリ秒 ラウンドトリップ', async () => {
    const ticksResult = await datetimeConverter.convert(String(UTC_MS), {
      'inputMode': 'epochms',
      'outputMode': 'dotnet',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(ticksResult.success).toBe(true);
    const backResult = await datetimeConverter.convert(ticksResult.output as string, {
      'inputMode': 'dotnet',
      'outputMode': 'epochms',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(backResult).toEqual({ success: true, output: String(UTC_MS) });
  });

  it('convert: 既知の.NET Ticks値', async () => {
    // ticks = BigInt(UTC_MS) * 10000 + 621355968000000000
    // = 1710506096789 * 10000 + 621355968000000000 = 638461028967890000
    const result = await datetimeConverter.convert('638461028967890000', {
      'inputMode': 'dotnet',
      'outputMode': 'epochms',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(result).toEqual({ success: true, output: String(UTC_MS) });
  });

  // --- yyyymmdd 出力フォーマット ---
  it('convert: エポックミリ秒入力 → yyyymmdd出力 (UTC, ミリ秒あり)', async () => {
    const result = await datetimeConverter.convert(String(UTC_MS), {
      'inputMode': 'epochms',
      'outputMode': 'yyyymmdd',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(result).toEqual({ success: true, output: '2024/03/15 12:34:56.789' });
  });

  it('convert: エポックミリ秒入力 → yyyymmdd出力 (UTC, ミリ秒なし)', async () => {
    const result = await datetimeConverter.convert(String(UTC_MS), {
      'inputMode': 'epochms',
      'outputMode': 'yyyymmdd',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': false,
    });
    expect(result).toEqual({ success: true, output: '2024/03/15 12:34:56' });
  });

  it('convert: yyyymmdd出力 ゼロサプレスなし (1月1日 00:00:00.001)', async () => {
    const ms = Date.UTC(2024, 0, 1, 0, 0, 0, 1);
    const result = await datetimeConverter.convert(String(ms), {
      'inputMode': 'epochms',
      'outputMode': 'yyyymmdd',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(result).toEqual({ success: true, output: '2024/01/01 00:00:00.001' });
  });

  // --- ブランク入力 ---
  it('convert: ブランク入力 → ブランク出力', async () => {
    const result = await datetimeConverter.convert('', {
      'inputMode': 'iso8601',
      'outputMode': 'iso8601',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': true,
    });
    expect(result).toEqual({ success: true, output: '' });
  });

  it('convert: スペースのみ入力 → ブランク出力', async () => {
    const result = await datetimeConverter.convert('   ', {
      'inputMode': 'epochms',
      'outputMode': 'yyyymmdd',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': false,
    });
    expect(result).toEqual({ success: true, output: '' });
  });

  // --- 入力エラー ---
  it('convert: 入力に日時が見つからない場合はエラー', async () => {
    await expect(
      datetimeConverter.convert('no date here', {
        'inputMode': 'epochms',
        'outputMode': 'iso8601',
        'inputUtc': true,
        'outputUtc': true,
        'showMs': true,
      })
    ).rejects.toThrow();
  });

  // --- ISO-8601 日付のみ・年月のみ ---
  it('convert: ISO-8601 日付のみ (YYYY-MM-DD)', async () => {
    const result = await datetimeConverter.convert('2024-03-15', {
      'inputMode': 'iso8601',
      'outputMode': 'yyyymmdd',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': false,
    });
    expect(result).toEqual({ success: true, output: '2024/03/15 00:00:00' });
  });

  it('convert: ISO-8601 年月のみ (YYYY-MM)', async () => {
    const result = await datetimeConverter.convert('2024-03', {
      'inputMode': 'iso8601',
      'outputMode': 'yyyymmdd',
      'inputUtc': true,
      'outputUtc': true,
      'showMs': false,
    });
    expect(result).toEqual({ success: true, output: '2024/03/01 00:00:00' });
  });
});
