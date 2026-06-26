# suconv

いろいろ文字列変換ツール。

## 開発セットアップ

### 1. 依存関係をインストール

```bash
npm install
```

### 2. TypeScript を esbuild でバンドル

```bash
npm run build
```

`src/ts/main.ts` を `target/app.${hash}.js` に出力し、
`src/scss` を `target/app.css` にコンパイルし、
`src/html/index.html` から `target/index.html` を生成します。

※`npm : このシステムではスクリプトの実行が無効になっているため`のエラーになった場合、以下のコマンドで権限が付与できます。

```cmd
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### 3. 型チェック

```operation
Ctrl + Shift + P
Tasks: Run Task
TypeScript Type Check
```

```bash
npm run typecheck
```

### 4. 変更監視しながらバンドル

```bash
npm run watch
```

出力先は `target` ディレクトリです。

## APIドキュメント生成

`src/ts` 配下のJSDocコメントをもとに、APIドキュメントを生成します。

```bash
npm run doc:api
```

出力先は `doc/api` ディレクトリです。
