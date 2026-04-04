import { describe, expect, it } from 'vitest';
import { generateStringConverter } from '../../../../src/ts/converter/utility/generate-string';

describe('generateStringConverter', () => {
  describe('repeat モード', () => {
    it('入力テキストを指定文字数分繰り返す', async () => {
      const result = await generateStringConverter.convert('abc', { mode: 'repeat', length: '7', lines: '1' });

      expect(result).toEqual({ success: true, output: 'abcabca' });
    });

    it('入力テキストの改行文字を除いてリピートする', async () => {
      const result = await generateStringConverter.convert('AB\nC', { mode: 'repeat', length: '7', lines: '1' });

      expect(result).toEqual({ success: true, output: 'ABCABCA' });
    });

    it('行数分の行を出力する', async () => {
      const result = await generateStringConverter.convert('ab', { mode: 'repeat', length: '3', lines: '2' });

      expect(result).toEqual({ success: true, output: 'aba\naba' });
    });

    it('入力テキストが空の場合は空文字列を返す', async () => {
      const result = await generateStringConverter.convert('', { mode: 'repeat', length: '5', lines: '1' });

      expect(result).toEqual({ success: true, output: '' });
    });
  });

  describe('shuffle モード', () => {
    it('指定文字数を出力する', async () => {
      const result = await generateStringConverter.convert('hello', { mode: 'shuffle', length: '8', lines: '1' });

      expect(result.success).toBe(true);
      expect((result as { success: true; output: string }).output.length).toBe(8);
    });

    it('入力テキストの改行文字を除いてシャッフルする', async () => {
      const result = await generateStringConverter.convert('ab\ncd', { mode: 'shuffle', length: '6', lines: '1' });

      expect(result.success).toBe(true);
      const output = (result as { success: true; output: string }).output;
      expect(output.length).toBe(6);
      for (const char of output) {
        expect('abcd').toContain(char);
      }
    });

    it('出力文字が入力テキストの文字のみからなる', async () => {
      const result = await generateStringConverter.convert('abc', { mode: 'shuffle', length: '6', lines: '1' });

      expect(result.success).toBe(true);
      const output = (result as { success: true; output: string }).output;
      for (const char of output) {
        expect('abc').toContain(char);
      }
    });
  });

  describe('guid モード', () => {
    it('UUID v4形式の文字列を出力する', async () => {
      const result = await generateStringConverter.convert('', { mode: 'guid', lines: '1' });

      expect(result.success).toBe(true);
      const output = (result as { success: true; output: string }).output;
      expect(output).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('指定行数分のGUIDを出力する', async () => {
      const result = await generateStringConverter.convert('', { mode: 'guid', lines: '3' });

      expect(result.success).toBe(true);
      const lines = (result as { success: true; output: string }).output.split('\n');
      expect(lines.length).toBe(3);
      for (const line of lines) {
        expect(line).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      }
    });
  });

  describe('password モード', () => {
    it('数字のみの場合、数字のみのパスワードを生成する', async () => {
      const result = await generateStringConverter.convert('', {
        mode: 'password', length: '8', lines: '1', useDigits: true,
      });

      expect(result.success).toBe(true);
      const output = (result as { success: true; output: string }).output;
      expect(output.length).toBe(8);
      expect(output).toMatch(/^[0-9]+$/);
    });

    it('複数文字種指定時、各文字種が少なくとも1文字含まれる', async () => {
      const result = await generateStringConverter.convert('', {
        mode: 'password', length: '10', lines: '1',
        useDigits: true, useLowercase: true, useUppercase: true,
      });

      expect(result.success).toBe(true);
      const output = (result as { success: true; output: string }).output;
      expect(output.length).toBe(10);
      expect(/[0-9]/.test(output)).toBe(true);
      expect(/[a-z]/.test(output)).toBe(true);
      expect(/[A-Z]/.test(output)).toBe(true);
    });

    it('記号を含む4種指定時、各文字種が含まれる', async () => {
      const result = await generateStringConverter.convert('', {
        mode: 'password', length: '12', lines: '1',
        useDigits: true, useLowercase: true, useUppercase: true, useSymbols: true,
      });

      expect(result.success).toBe(true);
      const output = (result as { success: true; output: string }).output;
      expect(output.length).toBe(12);
      expect(/[0-9]/.test(output)).toBe(true);
      expect(/[a-z]/.test(output)).toBe(true);
      expect(/[A-Z]/.test(output)).toBe(true);
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,./<>?]/.test(output)).toBe(true);
    });

    it('文字種が選択されていない場合は空文字列を返す', async () => {
      const result = await generateStringConverter.convert('', {
        mode: 'password', length: '8', lines: '1',
      });

      expect(result).toEqual({ success: true, output: '' });
    });

    it('複数行のパスワードを生成する', async () => {
      const result = await generateStringConverter.convert('', {
        mode: 'password', length: '8', lines: '3', useDigits: true,
      });

      expect(result.success).toBe(true);
      const lines = (result as { success: true; output: string }).output.split('\n');
      expect(lines.length).toBe(3);
      for (const line of lines) {
        expect(line.length).toBe(8);
      }
    });
  });
});
