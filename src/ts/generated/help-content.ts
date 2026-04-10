export const helpContent: Record<string, string> = {
  "app": `<h1>suconv ヘルプ</h1>
<p>suconv は、テキストデータをさまざまな形式に変換するためのオンラインツールです。</p>
<h2>基本的な使い方</h2>
<p>1. <strong>入力ペイン</strong>（左側）に変換したいテキストを入力またはペーストします。<br>2. <strong>コンバータペイン</strong>（下側）で使用するコンバータを選択します。<br>3. <strong>変換</strong> ボタンを押すと、結果が出力ペイン（右側）に表示されます。</p>
<p><strong>自動変換</strong> チェックボックスをオンにすると、入力が変わるたびに自動で変換が実行されます。</p>
<h2>入力・出力ペイン</h2>
<ul><li><strong>クリア</strong> — 入力テキストを消去します。</li><li><strong>コピー</strong> — テキストをクリップボードにコピーします。</li><li><strong>ロード</strong> — ファイルからテキストを読み込みます。</li><li><strong>入力へ転送</strong> — 出力内容を入力に転記します。変換を続けて適用したい場合に使います。</li><li><strong>ダウンロード</strong> — 出力内容をファイルとして保存します。</li></ul>
<h2>変換オプション</h2>
<ul><li><strong>自動変換</strong> — 入力またはオプションの変更時に即座に変換を実行します。</li><li><strong>行単位</strong> — 入力を改行で分割し、各行に対して個別に変換を実行します。</li><li><strong>折り返し</strong> — テキストエリアの横折り返し表示を切り替えます。</li><li><strong>等幅フォント</strong> — テキストエリアのフォントを等幅フォントに切り替えます。</li></ul>
<h2>バイナリ(HEX)モード</h2>
<p>入力・出力のモード切替ドロップダウンから <strong>バイナリ(HEX)</strong> を選択すると、16進数文字列としてテキストを扱います。バイナリデータを含む変換に使用します。</p>
<h2>環境設定</h2>
<p>画面右上の歯車ボタンから環境設定を開けます。</p>
<ul><li><strong>テーマ</strong> — 画面の配色テーマを変更します。</li><li><strong>初期値クリア</strong> — 各コンバータのデフォルトオプション値をリセットします。</li></ul>`,
  "byte-format-converter": `<h1>バイナリ/テキスト変換</h1>
<p>テキストとバイナリデータ（Base64・HEX）を相互に変換します。</p>
<h2>変換モード</h2>
<ul><li><strong>テキスト → Base64</strong> — UTF-8テキストをBase64エンコードします。</li><li><strong>Base64 → テキスト</strong> — Base64文字列をUTF-8テキストにデコードします。</li><li><strong>テキスト → HEX</strong> — UTF-8テキストを16進数バイト列に変換します。</li><li><strong>HEX → テキスト</strong> — 16進数バイト列をUTF-8テキストに変換します。</li></ul>
<h2>オプション</h2>
<ul><li><strong>改行を含める</strong> — Base64出力を76文字ごとに改行します（MIME形式）。</li></ul>
<h2>使用例</h2>
<pre><code>入力: Hello
テキスト → Base64 → SGVsbG8=</code></pre>`,
  "count-length": `<h1>文字数/バイト数をカウント</h1>
<p>入力テキストの文字数またはバイト数をカウントします。</p>
<h2>オプション</h2>
<ul><li><strong>カウント方式</strong></li></ul>
<p>  - <strong>文字数</strong> — Unicode文字単位でカウントします（絵文字なども1文字）。<br>  - <strong>UTF-8バイト数</strong> — UTF-8エンコード時のバイト数をカウントします。<br>  - <strong>SJISバイト数</strong> — Shift_JISエンコード時のバイト数をカウントします（全角2バイト）。</p>
<ul><li><strong>タグ除去</strong> — HTMLタグ（<code>&lt;...&gt;</code>）を除去してからカウントします。</li><li><strong>空白除去</strong> — 行頭・行末の連続した空白・タブを除去してからカウントします。</li><li><strong>改行除去</strong> — 改行文字をすべて削除してからカウントします（「行単位」が有効な場合は行単位が優先）。</li><li><strong>改行文字</strong> — カウント対象の改行文字形式を選択します（LF / CR+LF）。</li></ul>
<h2>使用例</h2>
<pre><code>入力: Hello
文字数 → 5
UTF-8バイト数 → 5

入力: こんにちは
文字数 → 5
UTF-8バイト数 → 15
SJISバイト数 → 10</code></pre>`,
  "datetime-converter": `<h1>日時変換</h1>
<p>さまざまな形式の日時を相互に変換します。</p>
<h2>入力/出力形式</h2>
<ul><li><strong>ISO-8601</strong> — <code>2024-03-15T12:34:56Z</code> 形式。ログやAPIレスポンスに広く使われます。</li><li><strong>YYYY/MM/DD</strong> — <code>2024/03/15 12:34:56</code> 形式。日本語テキストから日時を抽出できます。</li><li><strong>エポックミリ秒</strong> — 1970-01-01 UTC からのミリ秒数。JavaScript の <code>Date.getTime()</code> の値。</li><li><strong>Unixタイム</strong> — 1970-01-01 UTC からの秒数。</li><li><strong>Excelシリアル値</strong> — Excelの日付シリアル値（1900年基準）。</li><li><strong>.NET Ticks</strong> — .NETの <code>DateTime.Ticks</code>（0001-01-01から100ナノ秒単位）。</li></ul>
<h2>オプション</h2>
<ul><li><strong>入力タイムゾーン: UTC</strong> — タイムゾーン表記のない入力日時をUTCとして解釈します。オフ時はローカル時刻として解釈します。</li><li><strong>出力タイムゾーン: UTC</strong> — 出力日時をUTCで表示します。オフ時はブラウザのローカル時刻で表示します。</li><li><strong>ミリ秒を含める</strong> — ISO-8601出力時にミリ秒部分を含めます。</li></ul>
<h2>使用例</h2>
<pre><code>入力: 2024-03-15T12:34:56.789Z
ISO-8601 → エポックミリ秒 → 1710502496789

入力: 1710502496789
エポックミリ秒 → ISO-8601 (UTC) → 2024-03-15T12:34:56.789Z</code></pre>
<h2>テキストからの抽出</h2>
<p>入力テキストに日時以外の文字が含まれていても、形式にマッチする部分を自動的に抽出します。</p>
<pre><code>入力: [2024-03-15T12:34:56Z] ERROR connection refused
ISO-8601 → エポックミリ秒 → 1710502496000</code></pre>`,
  "escape-string": `<h1>文字列エスケープ/アンエスケープ</h1>
<p>特殊文字をエスケープシーケンスに変換、またはエスケープシーケンスを元の文字に戻します。</p>
<h2>変換モード</h2>
<ul><li><strong>エスケープ</strong> — 特殊文字をエスケープシーケンスに変換します。</li><li><strong>アンエスケープ</strong> — エスケープシーケンスを元の文字に戻します。</li></ul>
<h2>エスケープ形式</h2>
<ul><li><strong>JavaScript 文字列</strong> — <code>\\n</code> <code>\\t</code> <code>\\\\</code> <code>\\"</code> などJavaScript文字列リテラル用のエスケープ。</li><li><strong>JSON</strong> — JSON仕様のエスケープ。\\nや\\tに加えUnicode（\\uXXXX）形式も使用します。</li><li><strong>HTML エンティティ</strong> — <code>&amp;amp;</code> <code>&amp;lt;</code> <code>&amp;gt;</code> <code>&amp;quot;</code> などHTMLエンティティ形式。</li><li><strong>URL エンコード</strong> — パーセントエンコーディング（%XX形式）。</li><li><strong>正規表現</strong> — 正規表現のメタ文字をバックスラッシュでエスケープします。</li></ul>
<h2>使用例</h2>
<pre><code>入力: He said "Hello\\nWorld"
JavaScript エスケープ → He said \\"Hello\\\\nWorld\\"</code></pre>`,
  "generate-string": `<h1>文字列生成</h1>
<p>指定した条件で文字列を生成します。テストデータやパスワードの生成に利用できます。</p>
<h2>変換モード</h2>
<ul><li><strong>繰り返し</strong> — 入力テキストを指定長になるまで繰り返します。</li><li><strong>シャッフル</strong> — 入力テキストの文字をシャッフルして指定長の文字列を生成します。</li><li><strong>GUID</strong> — ランダムなGUID（UUID v4）を生成します。入力テキストは無視されます。</li><li><strong>パスワード</strong> — 選択した文字種からランダムなパスワードを生成します。</li></ul>
<h2>オプション</h2>
<ul><li><strong>生成する長さ</strong> — 生成する文字列の長さを指定します。</li><li><strong>数字を含める</strong> — パスワード生成時に数字（0-9）を含めます。</li><li><strong>小文字を含める</strong> — パスワード生成時に小文字（a-z）を含めます。</li><li><strong>大文字を含める</strong> — パスワード生成時に大文字（A-Z）を含めます。</li><li><strong>記号を含める</strong> — パスワード生成時に記号（<code>!@#\$%...</code>）を含めます。</li></ul>
<h2>注意</h2>
<p>パスワードはブラウザのWeb Crypto APIを使用して生成されます。入力フィールドや生成されたパスワードはサーバーに送信されません。</p>`,
  "line-break-by-length": `<h1>指定文字数で改行</h1>
<p>指定した文字数ごとに改行を挿入します。長いテキストを一定幅で折り返したい場合に使います。</p>
<h2>オプション</h2>
<ul><li><strong>折り返し文字数</strong> — この文字数を超えた位置で改行を挿入します。</li><li><strong>カウント方式</strong> — 折り返し幅のカウント方法を選択します。</li></ul>
<p>  - <strong>文字数</strong> — Unicode文字単位でカウントします。<br>  - <strong>バイト数(UTF-8)</strong> — UTF-8エンコード後のバイト数でカウントします。<br>  - <strong>バイト数(SJIS)</strong> — Shift_JISエンコード後のバイト数でカウントします。</p>
<h2>使用例</h2>
<p>折り返し文字数を10に設定した場合:</p>
<pre><code>入力: ABCDEFGHIJKLMNOPQRST
出力:
ABCDEFGHIJ
KLMNOPQRST</code></pre>`,
  "variable-name": `<h1>変数名変換</h1>
<p>変数名の命名規則（ケーススタイル）を変換します。</p>
<h2>対応形式</h2>
<ul><li><strong>camelCase</strong> — <code>getUserName</code> のように先頭小文字・単語境界を大文字で表す形式。</li><li><strong>PascalCase</strong> — <code>GetUserName</code> のように全単語先頭を大文字にする形式。クラス名に使われます。</li><li><strong>snake_case</strong> — <code>get_user_name</code> のように単語をアンダースコアで繋ぐ形式。Pythonなどで一般的。</li><li><strong>CONSTANT_CASE</strong> — <code>GET_USER_NAME</code> のように全て大文字でアンダースコアで繋ぐ形式。定数に使われます。</li><li><strong>kebab-case</strong> — <code>get-user-name</code> のように単語をハイフンで繋ぐ形式。CSSクラス名やURLに使われます。</li></ul>
<h2>オプション</h2>
<h3>2文字の略語を大文字にする</h3>
<p>2文字からなる略語（<code>id</code>、<code>db</code>、<code>ui</code> など）の扱いを変更します。</p>
<p><strong>未チェック（既定）:</strong></p>
<pre><code>snake → pascal: user_id → UserId
pascal → snake: ID → i_d</code></pre>
<p><strong>チェックあり:</strong></p>
<pre><code>snake → pascal: user_id → UserID
pascal → snake: ID → id
camel → snake: userIDName → user_id_name</code></pre>
<h2>複数の変数名の一括変換</h2>
<p>入力テキストに複数の変数名が含まれる場合、それぞれ個別に変換されます。変数名以外の文字（空白、記号、改行など）はそのまま保持されます。</p>
<pre><code>入力:
user_name = get_user_id()

snake → camel:
userName = getUserId()</code></pre>`,
  "width-convert": `<h1>全角/半角変換</h1>
<p>全角文字と半角文字を相互に変換します。</p>
<h2>変換方向</h2>
<ul><li><strong>半角を全角に</strong> — 半角文字を全角文字に変換します。</li><li><strong>全角を半角に</strong> — 全角文字を半角文字に変換します。</li></ul>
<h2>変換対象の文字種</h2>
<p>チェックボックスで変換対象を個別に指定できます。</p>
<ul><li><strong>空白文字</strong> — 半角スペース（U+0020）と全角スペース（U+3000）を相互変換します。</li><li><strong>数字</strong> — 半角数字（0-9）と全角数字（０-９）を相互変換します。</li><li><strong>アルファベット</strong> — 半角英字（A-Z, a-z）と全角英字（Ａ-Ｚ, ａ-ｚ）を相互変換します。</li><li><strong>ASCII記号</strong> — <code>!</code> <code>@</code> <code>#</code> などの半角ASCII記号と対応する全角記号を相互変換します。</li><li><strong>カタカナ</strong> — 半角カタカナと全角カタカナを相互変換します。句読点（｡｢｣､･）も対象です。</li></ul>
<h2>カタカナの変換について</h2>
<p>濁点・半濁点付きの半角カタカナは2文字→1文字の変換を行います。</p>
<pre><code>ｶﾞ → ガ（2文字を1文字に）
ﾊﾟ → パ（2文字を1文字に）</code></pre>
<p>全角から半角への変換は逆方向に1文字→2文字に展開します。</p>
<pre><code>ガ → ｶﾞ（1文字を2文字に）</code></pre>
<h2>使用例</h2>
<pre><code>入力: Hello 123!ｶﾞ
全オプションON・半角→全角 → Ｈｅｌｌｏ　１２３！ガ</code></pre>`,
};
