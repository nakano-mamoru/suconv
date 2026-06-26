# TODO

- ファイル名の見直し（ファイル名とクラス名の不一致等）
- Pritter整形/XMLで行単位がチェックされているとエラー
- Pritter整形/XMLでタグで上手に改行しない
- Pritter整形/HTMLで改行なしの文書のインデントもなんかおかしい\
構造化データ変換でXML→XMLのほうがきれい\
&#60;customers&#62;&#60;customer id=&#34;55000&#34;&#62;&#60;name&#62;Charter Group&#60;/name&#62;&#60;address&#62;&#60;street&#62;100 Main&#60;/street&#62;&#60;city&#62;Framingham&#60;/city&#62;&#60;state&#62;MA&#60;/state&#62;&#60;zip&#62;01701&#60;/zip&#62;&#60;/address&#62;&#60;address&#62;&#60;street&#62;720 Prospect&#60;/street&#62;&#60;city&#62;Framingham&#60;/city&#62;&#60;state&#62;MA&#60;/state&#62;&#60;zip&#62;01701&#60;/zip&#62;&#60;/address&#62;&#60;address&#62;&#60;street&#62;120 Ridge&#60;/street&#62;&#60;state&#62;MA&#60;/state&#62;&#60;zip&#62;01760&#60;/zip&#62;&#60;/address&#62;&#60;/customer&#62;&#60;/customers&#62;

## 日時関連

### パーサーによる自動判定

` parse(datetime_string):number `

datetime_stringを解析してミリ秒を返す。\
（文字列が日付の場合はエポックミリ秒）\
datetime_stringの対応形式

| 形式 | フォーマット | 例 | 備考 |
| --- | --- | --- | --- |
| C# Timespan形式 | d.hh:mm:ss.fff | 123.34:46:56.123 | |
| ISO8601形式 | P\d+T\d{1-2}H\d{1-2}M\d{1-2}\.\d{3}S | P123DT34H46M56.123S | |
| 独自書式 年 | \d+y | 2026y | |
| 独自書式 月 | \d+(mo\|M) | 6mo | |
| 独自書式 日 | \d+(d\|D) | 123d | |
| 独自書式 時 | \d+(h\|H) | 34h | |
| 独自書式 分 | \d+m | 46m | |
| 独自書式 秒 | \d+s | 56d | |
| 独自書式 ミリ秒 | \d+(f\|ms) | 123ms | |

独自書式=年:y, 月:mo/M, 日:d, 時:h, 分:m, 秒:s, ミリ秒:f/ms, μ秒:us\
エポックタイム=独自書式 s を使うか？\
エポックミリ秒=独自書式 ms を使うか？\
エクセルシリアル日時=独自書式 ex を使うか？\

優先スイッチはつける
