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
            <div class="mode-trigger-group">
              <button id="toInputBtn" class="secondary-button" type="button">入力へ転送</button>
              <div class="mode-select-wrapper" id="toInputModeWrapper">
                <button id="toInputModeToggleBtn" class="secondary-button mode-toggle-button" type="button" aria-label="転送モード選択">▼</button>
                <div id="toInputModeMenu" class="mode-select-popup mode-menu visually-hidden" role="menu" aria-label="転送モード">
                  <button type="button" class="mode-menu-button is-active" data-mode="copy">そのまま</button>
                  <button type="button" class="mode-menu-button" data-mode="swap">モード入替</button>
                </div>
              </div>
            </div>
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
      <button id="helpBtn" class="icon-button" type="button" aria-label="ヘルプ"><svg xmlns="http://www.w3.org/2000/svg" class="help-icon" viewBox="0 0 358.094 355.5" aria-hidden="true" focusable="false"><path fill="currentColor" d="M358.094,91.826c0,15.427-3.049,29.256-9.114,41.473c-6.083,12.231-14.688,22.863-25.803,31.898c-10.928,8.88-24.058,16.818-39.406,23.83c-15.35,7.011-45.229,13.403-60.725,19.164v53.279h-85.154v-78.282c9.299-2.333,19.639-5.529,31.031-9.588c11.393-4.047,23.394-9.047,33.965-14.976c11.182-6.083,20.313-13.171,27.429-21.291c7.115-8.106,10.675-17.695,10.675-28.778c0-15.44-6.456-26.666-19.332-33.689c-12.875-7.011-30.767-10.529-53.655-10.529c-17.179,0-35.136,3.56-54.755,8.802c-37.581,10.04-93.327,38.983-104.356,44.848H0V47.412C22.484,33.4,61.729,19.053,91.124,11.341C118.481,4.164,170.99,0,197.552,0c25.819,0,48.641,2.307,68.43,6.895c19.787,4.601,36.645,11.032,50.588,19.28c13.52,8.249,23.82,17.953,30.901,29.088C354.553,66.398,358.094,78.591,358.094,91.826z M227.472,355.5h-92.23v-61.861h92.23V355.5z"/></svg></button>
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

<div id="helpDialogBackdrop" class="dialog-backdrop visually-hidden" aria-hidden="true">
  <div class="dialog-panel dialog-panel--help" role="dialog" aria-modal="true" aria-labelledby="helpDialogTitle">
    <div class="dialog-panel__header">
      <h2 id="helpDialogTitle">ヘルプ</h2>
      <button id="helpDialogCloseBtn" class="secondary-button" type="button">閉じる</button>
    </div>
    <div class="dialog-body help-dialog-body" id="helpDialogBody"></div>
  </div>
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
