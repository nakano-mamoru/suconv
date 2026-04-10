# 変数名変換

変数名の命名規則（ケーススタイル）を変換します。

## 対応形式

- **camelCase** — `getUserName` のように先頭小文字・単語境界を大文字で表す形式。
- **PascalCase** — `GetUserName` のように全単語先頭を大文字にする形式。クラス名に使われます。
- **snake_case** — `get_user_name` のように単語をアンダースコアで繋ぐ形式。Pythonなどで一般的。
- **CONSTANT_CASE** — `GET_USER_NAME` のように全て大文字でアンダースコアで繋ぐ形式。定数に使われます。
- **kebab-case** — `get-user-name` のように単語をハイフンで繋ぐ形式。CSSクラス名やURLに使われます。

## オプション

### 2文字の略語を大文字にする

2文字からなる略語（`id`、`db`、`ui` など）の扱いを変更します。

**未チェック（既定）:**

```
snake → pascal: user_id → UserId
pascal → snake: ID → i_d
```

**チェックあり:**

```
snake → pascal: user_id → UserID
pascal → snake: ID → id
camel → snake: userIDName → user_id_name
```

## 複数の変数名の一括変換

入力テキストに複数の変数名が含まれる場合、それぞれ個別に変換されます。変数名以外の文字（空白、記号、改行など）はそのまま保持されます。

```
入力:
user_name = get_user_id()

snake → camel:
userName = getUserId()
```
