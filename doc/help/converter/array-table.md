# 二次元配列変換

CSV・TSV・JSON 配列・Java 配列・HTML Table・Markdown テーブルの相互変換を行います。

## 入力形式
- CSV
- TSV
- JSON配列（二次元配列）
- JSON配列（連想配列）
- Java配列
- HTML Table
- Markdownテーブル

## 出力形式
- CSV
- TSV
- JSON配列（二次元配列）
- JSON配列（連想配列）
- Java配列
- HTML Table
- Markdownテーブル

## オプション
- ヘッダ行有り: 入力側では先頭行を見出しとして扱い、出力側では見出し行を含めます。
- 空行スキップ: 空行を読み飛ばして変換します。

## 補足
- JSON配列（連想配列）は、ヘッダ行をキー名として扱います。
- Markdown テーブル出力では、出力ヘッダ行有りが有効な場合に区切り行も生成します。
