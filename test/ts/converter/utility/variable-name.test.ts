import { describe, expect, it } from 'vitest';
import { variableNameConverter } from '../../../../src/ts/converter/utility/variable-name';

function opts(
  inputMode: string,
  outputMode: string,
  abbrevUppercase = false,
) {
  return { inputMode, outputMode, abbrevUppercase };
}

describe('variableNameConverter', () => {
  // --- 空入力 ---
  it('空入力 → 空出力', async () => {
    const result = await variableNameConverter.convert('', opts('snake', 'camel'));
    expect(result).toEqual({ success: true, output: '' });
  });

  // --- snake_case 入力 ---
  it('snake → camel', async () => {
    const result = await variableNameConverter.convert('user_name', opts('snake', 'camel'));
    expect(result.output).toBe('userName');
  });

  it('snake → pascal', async () => {
    const result = await variableNameConverter.convert('user_name', opts('snake', 'pascal'));
    expect(result.output).toBe('UserName');
  });

  it('snake → CONSTANT', async () => {
    const result = await variableNameConverter.convert('user_name', opts('snake', 'constant'));
    expect(result.output).toBe('USER_NAME');
  });

  it('snake → kebab', async () => {
    const result = await variableNameConverter.convert('user_name', opts('snake', 'kebab'));
    expect(result.output).toBe('user-name');
  });

  it('snake → snake (同一形式)', async () => {
    const result = await variableNameConverter.convert('user_name', opts('snake', 'snake'));
    expect(result.output).toBe('user_name');
  });

  // --- camelCase 入力 ---
  it('camel → snake', async () => {
    const result = await variableNameConverter.convert('userName', opts('camel', 'snake'));
    expect(result.output).toBe('user_name');
  });

  it('camel → pascal', async () => {
    const result = await variableNameConverter.convert('userName', opts('camel', 'pascal'));
    expect(result.output).toBe('UserName');
  });

  it('camel → CONSTANT', async () => {
    const result = await variableNameConverter.convert('userName', opts('camel', 'constant'));
    expect(result.output).toBe('USER_NAME');
  });

  it('camel → kebab', async () => {
    const result = await variableNameConverter.convert('userName', opts('camel', 'kebab'));
    expect(result.output).toBe('user-name');
  });

  // --- PascalCase 入力 ---
  it('pascal → camel', async () => {
    const result = await variableNameConverter.convert('UserName', opts('pascal', 'camel'));
    expect(result.output).toBe('userName');
  });

  it('pascal → snake', async () => {
    const result = await variableNameConverter.convert('UserName', opts('pascal', 'snake'));
    expect(result.output).toBe('user_name');
  });

  // --- CONSTANT_CASE 入力 ---
  it('CONSTANT → camel', async () => {
    const result = await variableNameConverter.convert('USER_NAME', opts('constant', 'camel'));
    expect(result.output).toBe('userName');
  });

  it('CONSTANT → pascal', async () => {
    const result = await variableNameConverter.convert('USER_NAME', opts('constant', 'pascal'));
    expect(result.output).toBe('UserName');
  });

  // --- kebab-case 入力 ---
  it('kebab → camel', async () => {
    const result = await variableNameConverter.convert('user-name', opts('kebab', 'camel'));
    expect(result.output).toBe('userName');
  });

  it('kebab → pascal', async () => {
    const result = await variableNameConverter.convert('user-name', opts('kebab', 'pascal'));
    expect(result.output).toBe('UserName');
  });

  it('kebab → CONSTANT', async () => {
    const result = await variableNameConverter.convert('user-name', opts('kebab', 'constant'));
    expect(result.output).toBe('USER_NAME');
  });

  // --- 単語1つ ---
  it('単語1つ: snake → pascal', async () => {
    const result = await variableNameConverter.convert('name', opts('snake', 'pascal'));
    expect(result.output).toBe('Name');
  });

  it('単語1つ: snake → camel', async () => {
    const result = await variableNameConverter.convert('name', opts('snake', 'camel'));
    expect(result.output).toBe('name');
  });

  // --- 2文字略語: 仕様例 ---
  it('2文字略語 未チェック: snake→pascal "id" → "Id"', async () => {
    const result = await variableNameConverter.convert('id', opts('snake', 'pascal', false));
    expect(result.output).toBe('Id');
  });

  it('2文字略語 チェック: snake→pascal "id" → "ID"', async () => {
    const result = await variableNameConverter.convert('id', opts('snake', 'pascal', true));
    expect(result.output).toBe('ID');
  });

  it('2文字略語 未チェック: pascal→snake "ID" → "i_d"', async () => {
    const result = await variableNameConverter.convert('ID', opts('pascal', 'snake', false));
    expect(result.output).toBe('i_d');
  });

  it('2文字略語 チェック: pascal→snake "ID" → "id"', async () => {
    const result = await variableNameConverter.convert('ID', opts('pascal', 'snake', true));
    expect(result.output).toBe('id');
  });

  // --- 複合: 2文字略語を含む変換 ---
  it('チェック: snake→pascal "user_id" → "UserID"', async () => {
    const result = await variableNameConverter.convert('user_id', opts('snake', 'pascal', true));
    expect(result.output).toBe('UserID');
  });

  it('未チェック: snake→pascal "user_id" → "UserId"', async () => {
    const result = await variableNameConverter.convert('user_id', opts('snake', 'pascal', false));
    expect(result.output).toBe('UserId');
  });

  it('チェック: camel→snake "userIDName" → "user_id_name"', async () => {
    const result = await variableNameConverter.convert('userIDName', opts('camel', 'snake', true));
    expect(result.output).toBe('user_id_name');
  });

  it('未チェック: camel→snake "userIDName" → "user_i_d_name"', async () => {
    const result = await variableNameConverter.convert('userIDName', opts('camel', 'snake', false));
    expect(result.output).toBe('user_i_d_name');
  });

  it('チェック: pascal→snake "UserIDName" → "user_id_name"', async () => {
    const result = await variableNameConverter.convert('UserIDName', opts('pascal', 'snake', true));
    expect(result.output).toBe('user_id_name');
  });

  it('チェック: CONSTANT→pascal "USER_ID_NAME" → "UserIDName"', async () => {
    const result = await variableNameConverter.convert('USER_ID_NAME', opts('constant', 'pascal', true));
    expect(result.output).toBe('UserIDName');
  });

  it('チェック: camel→camel 先頭2文字略語は小文字のまま "idName" → "idName"', async () => {
    const result = await variableNameConverter.convert('id_name', opts('snake', 'camel', true));
    expect(result.output).toBe('idName');
  });

  // --- 3語以上 ---
  it('3語: snake → camel "first_name_last" → "firstNameLast"', async () => {
    const result = await variableNameConverter.convert('first_name_last', opts('snake', 'camel'));
    expect(result.output).toBe('firstNameLast');
  });

  it('3語: pascal → kebab "GetUserName" → "get-user-name"', async () => {
    const result = await variableNameConverter.convert('GetUserName', opts('pascal', 'kebab'));
    expect(result.output).toBe('get-user-name');
  });

  // --- camelCase の先頭語は小文字のまま ---
  it('camel→camel は変形しない "getUser" → "getUser"', async () => {
    const result = await variableNameConverter.convert('getUser', opts('camel', 'camel'));
    expect(result.output).toBe('getUser');
  });

  // --- 連続した大文字略語（abbrevUppercase=true）---
  it('チェック: pascal→snake "HTMLParser" → "html_parser"', async () => {
    const result = await variableNameConverter.convert('HTMLParser', opts('pascal', 'snake', true));
    expect(result.output).toBe('html_parser');
  });

  it('未チェック: pascal→snake "HTMLParser" → "h_t_m_l_parser"', async () => {
    const result = await variableNameConverter.convert('HTMLParser', opts('pascal', 'snake', false));
    expect(result.output).toBe('h_t_m_l_parser');
  });

  it('チェック: snake→pascal "parse_xml_doc" → "ParseXmlDoc"（3文字は大文字化しない）', async () => {
    const result = await variableNameConverter.convert('parse_xml_doc', opts('snake', 'pascal', true));
    expect(result.output).toBe('ParseXmlDoc');
  });

  // --- 先頭/末尾の空白や非識別子文字の保持 ---
  it('先頭空白が保持される', async () => {
    const result = await variableNameConverter.convert('  user_name', opts('snake', 'camel'));
    expect(result.output).toBe('  userName');
  });

  it('末尾空白が保持される', async () => {
    const result = await variableNameConverter.convert('user_name  ', opts('snake', 'camel'));
    expect(result.output).toBe('userName  ');
  });

  it('前後空白が保持される', async () => {
    const result = await variableNameConverter.convert('  user_name  ', opts('snake', 'camel'));
    expect(result.output).toBe('  userName  ');
  });

  // --- テキスト中の複数マッチ ---
  it('1行に複数の変数名が含まれる場合それぞれ変換される', async () => {
    const result = await variableNameConverter.convert('user_name, first_name', opts('snake', 'camel'));
    expect(result.output).toBe('userName, firstName');
  });

  it('代入文のような記述も変換される', async () => {
    const result = await variableNameConverter.convert('user_id = get_user_id()', opts('snake', 'camel'));
    expect(result.output).toBe('userId = getUserId()');
  });

  it('改行を含む複数行もそれぞれ変換される', async () => {
    const result = await variableNameConverter.convert('user_name\nfirst_name', opts('snake', 'camel'));
    expect(result.output).toBe('userName\nfirstName');
  });
});
