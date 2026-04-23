# 構造化データ変換

XML・JSON・JavaScript・YAML・TOML の相互変換を行います。

## 入力形式
- JSON
- JavaScript オブジェクトリテラル
- YAML
- TOML
- XML

## 出力形式
- JSON
- JavaScript オブジェクトリテラル
- YAML
- TOML
- XML

## オプション
- インデント: JSON / JavaScript / YAML / XML の出力時に使用するインデントを選択します。
- 属性優先: XML 出力時にスカラー値を属性として出力します。

## 注意
- TOML 出力ではインデント設定は使用されません。
- YAML 出力では `なし` と `Tab` は使用できません。
- XML 入力時の属性は、設定に応じて属性または子要素として出力されます。
