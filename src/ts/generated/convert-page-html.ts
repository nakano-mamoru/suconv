export const convertPageHtml = `<div id="splitRoot" class="split-root">
  <main id="mainStage" class="main-stage">
    <div id="workspace" class="workspace">
      <section id="inputPane" class="pane">
      <div class="card pane-card">
        <div class="card-header">
          <label for="inputText">入力</label>
          <div class="header-actions">
            <button id="clearInputBtn" class="secondary-button" type="button">クリア</button>
            <button id="copyInputBtn" class="secondary-button" type="button">コピー</button>
            <div class="mode-trigger-group">
              <button id="loadBtn" class="secondary-button" type="button">ロード</button>
              <div class="mode-select-wrapper" id="inputModeWrapper">
                <button id="inputModeToggleBtn" class="secondary-button mode-toggle-button" type="button" aria-label="入力モード選択">▼</button>
                <div id="inputModeMenu" class="mode-select-popup mode-menu visually-hidden" role="menu" aria-label="入力モード">
                  <button type="button" class="mode-menu-button is-active" data-mode="text">テキスト</button>
                  <button type="button" class="mode-menu-button" data-mode="binary-hex">バイナリ(HEX)</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <textarea id="inputText" rows="8" placeholder="変換するテキストを入力してください"></textarea>
        <input id="loadFileInput" class="visually-hidden" type="file">
      </div>
      </section>

      <div id="verticalSplitter" class="splitter splitter-vertical" aria-label="入力と結果の境界"></div>

      <section id="outputPane" class="pane">
      <div class="card pane-card">
        <div class="card-header">
          <label for="outputText">結果</label>
          <div class="header-actions">
            <button id="toInputBtn" class="secondary-button" type="button">入力へ転送</button>
            <button id="copyOutputBtn" class="secondary-button" type="button">コピー</button>
            <div class="mode-trigger-group">
              <button id="downloadBtn" class="secondary-button" type="button">ダウンロード</button>
              <div class="mode-select-wrapper" id="outputModeWrapper">
                <button id="outputModeToggleBtn" class="secondary-button mode-toggle-button" type="button" aria-label="出力モード選択">▼</button>
                <div id="outputModeMenu" class="mode-select-popup mode-menu visually-hidden" role="menu" aria-label="出力モード">
                  <button type="button" class="mode-menu-button is-active" data-mode="text">テキスト</button>
                  <button type="button" class="mode-menu-button" data-mode="binary-hex">バイナリ(HEX)</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <textarea id="outputText" rows="8" readonly placeholder="変換結果がここに表示されます"></textarea>
        <div class="error-msg" id="errorMsg"></div>
      </div>
      </section>
    </div>
  </main>

  <div id="horizontalSplitter" class="splitter splitter-horizontal" aria-label="メインとコンバータの境界"></div>

  <aside id="converterPane" class="converter-pane">
    <div class="card">
    <div class="converter-select-row">
      <label for="converterSelect">コンバータ</label>
      <select id="converterSelect"></select>
      <button id="helpBtn" class="icon-button" type="button" aria-label="ヘルプ"><svg xmlns="http://www.w3.org/2000/svg" class="help-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path fill="currentColor" d="M11.25 14.5v-.46c0-.98.26-1.72 1.36-2.52.87-.62 1.14-1.02 1.14-1.68 0-.78-.58-1.28-1.5-1.28-.9 0-1.54.48-1.7 1.3l-1.5-.32C9.38 8.3 10.46 7.25 12.25 7.25c1.9 0 3.1 1.07 3.1 2.65 0 1.1-.5 1.84-1.7 2.66-.9.62-1.15 1.07-1.15 1.9v.04h-1.25zm-.1 2.5a.85.85 0 1 1 1.7 0 .85.85 0 0 1-1.7 0z"/></svg></button>
    </div>
    <div class="description" id="converterDescription"></div>
    <div class="options-area" id="converterOptions"></div>
    <div class="actions">
      <button id="convertBtn">変換</button>
      <label class="action-option">
        <input type="checkbox" id="autoConvertCheck">
        自動変換
      </label>
      <label class="action-option">
        <input type="checkbox" id="lineByLineCheck">
        行単位
      </label>
      <label class="action-option">
        <input type="checkbox" id="lineWrapCheck" checked>
        折り返し
      </label>
      <label class="action-option">
        <input type="checkbox" id="monospaceFontCheck" checked>
        等幅フォント
      </label>
    </div>
    </div>
  </aside>
</div>

<div id="preferenceDialogBackdrop" class="dialog-backdrop visually-hidden" aria-hidden="true">
  <div class="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="preferenceDialogTitle">
    <h2 id="preferenceDialogTitle">Preference</h2>
    <div class="dialog-body">
      <label for="preferenceThemeSelect">テーマ</label>
      <select id="preferenceThemeSelect"></select>
      
      <hr style="margin: 1em 0;">
      
      <div id="buildInfoSection" style="font-size: 0.875em; color: #666;">
        <p><strong>ビルド情報</strong></p>
        <div>ビルド日時: <span id="buildDateDisplay">-</span></div>
        <div>Gitブランチ: <span id="gitBranchDisplay">-</span></div>
        <div>コミット: <span id="gitCommitDisplay">-</span></div>
      </div>
    </div>
    <div class="dialog-actions">
      <button id="preferenceCancelBtn" class="secondary-button" type="button">キャンセル</button>
      <button id="preferenceClearDefaultsBtn" class="secondary-button" type="button">初期値クリア</button>
      <button id="preferenceSaveBtn" class="secondary-button" type="button">保存</button>
    </div>
  </div>
</div>
`;
