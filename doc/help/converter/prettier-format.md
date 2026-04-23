# Prettier整形

Prettier および SQL 整形ライブラリを使用して、入力テキストを整形します。

## 入力形式
- HTML
- XML
- JSON
- Javascript
- SQL
- YAML
- TOML

## オプション
- 区切り文字を列名の前に配置: SQL 整形時のみ表示されます。`SELECT` の列挙などでカンマを行頭に配置します。

## 補足
- HTML / XML / JSON / Javascript / YAML は Prettier で整形します。
- SQL は `sql-formatter` で整形します。
- TOML は `@ltd/j-toml` を利用して整形します。
