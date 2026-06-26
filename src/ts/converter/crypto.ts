import type { Converter } from './converter';
import { ConverterResult } from './converter-result';
import { secrets } from '../storage/secrets';

const ACTION_MODES = [
  { value: 'encrypt', label: '暗号化' },
  { value: 'decrypt', label: '復号化' },
  { value: 'addKey', label: '鍵追加' },
] as const;

const ALGORITHMS = [
  { value: 'AES256CBC', label: 'AES256CBC' },
  { value: 'AES256GCM', label: 'AES256GCM' },
  { value: 'DES256', label: 'DES256' },
] as const;

type ActionMode = (typeof ACTION_MODES)[number]['value'];
type AlgorithmMode = (typeof ALGORITHMS)[number]['value'];

function normalizeHex(text: string): string {
  return text.replace(/\s+/g, '').trim();
}

function hexToUint8Array(hex: string): Uint8Array {
  const normalized = normalizeHex(hex);
  if (normalized.length === 0) {
    return new Uint8Array();
  }
  if (!/^[0-9a-fA-F]+$/.test(normalized)) {
    throw new Error('HEXは16進数文字列で指定してください。');
  }
  if (normalized.length % 2 !== 0) {
    throw new Error('HEX文字列の長さは偶数でなければなりません。');
  }
  const result = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    result[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return result;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function decodeText(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

function getSecretKeyNames(): string[] {
  return Object.keys(secrets.secretMap)
    .filter((key) => key !== 'lastupdate')
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function getCipherSettings(algorithm: AlgorithmMode): { name: string; ivLength: number; keyLength: number } {
  if (algorithm === 'AES256CBC') {
    return { name: 'AES-CBC', ivLength: 16, keyLength: 32 };
  }
  if (algorithm === 'AES256GCM') {
    return { name: 'AES-GCM', ivLength: 12, keyLength: 32 };
  }
  if (algorithm === 'DES256') {
    return { name: 'AES-CBC', ivLength: 16, keyLength: 32 };
  }
  throw new Error(`未サポートのアルゴリズムです: ${algorithm}`);
}

async function deriveKey(algorithm: AlgorithmMode, secretValue: string): Promise<CryptoKey> {
  const secretHash = await crypto.subtle.digest('SHA-256', encodeText(secretValue));
  const hashBytes = new Uint8Array(secretHash);
  const settings = getCipherSettings(algorithm);
  const rawKey = hashBytes.slice(0, settings.keyLength);

  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: settings.name },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function deriveHmacKey(secretValue: string): Promise<CryptoKey> {
  const rawKey = await crypto.subtle.digest('SHA-256', encodeText(secretValue));
  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function getPreferredOutput(data: Uint8Array, outputMode: string): string {
  if (outputMode === 'binary-hex') {
    return uint8ArrayToHex(data);
  }
  return uint8ArrayToBase64(data);
}

function parseInputBytes(input: string, inputMode: string): Uint8Array {
  if (inputMode === 'binary-hex') {
    return hexToUint8Array(input);
  }
  return encodeText(input);
}

function parseSignature(signature: string, outputMode: string): Uint8Array {
  if (outputMode === 'binary-hex') {
    return hexToUint8Array(signature);
  }
  return base64ToUint8Array(signature);
}

function getDescription(): string {
  return `
    <div class="converter-field" id="cryptoActionModeRow">
      <label for="opt-actionMode">動作モード</label>
      <select id="opt-actionMode">
        ${ACTION_MODES.map((item) => `<option value="${item.value}">${item.label}</option>`).join('')}
      </select>
    </div>
    <div class="converter-field" id="cryptoAlgorithmRow">
      <label for="opt-algorithm">アルゴリズム</label>
      <select id="opt-algorithm">
        ${ALGORITHMS.map((item) => `<option value="${item.value}">${item.label}</option>`).join('')}
      </select>
    </div>
    <div class="converter-field" id="cryptoInputModeRow">
      <label for="opt-inputMode">入力モード</label>
      <select id="opt-inputMode">
        <option value="text">テキスト</option>
        <option value="binary-hex">バイナリ(HEX)</option>
      </select>
    </div>
    <div class="converter-field" id="cryptoOutputModeRow">
      <label for="opt-outputMode">出力モード</label>
      <select id="opt-outputMode">
        <option value="text">テキスト(Base64/UTF-8)</option>
        <option value="binary-hex">バイナリ(HEX)</option>
      </select>
    </div>
    <div class="converter-field" id="cryptoKeySelectRow">
      <label for="opt-keyName">鍵名</label>
      <select id="opt-keyName">
        <option value="">鍵を選択してください</option>
      </select>
    </div>
    <div class="converter-field visually-hidden" id="cryptoNewKeyNameRow">
      <label for="opt-newKeyName">鍵名</label>
      <input id="opt-newKeyName" type="text" placeholder="登録する鍵名を入力してください">
    </div>
    <div class="converter-field visually-hidden" id="cryptoAutoGenerateRow">
      <label>
        <input id="opt-generateKey" type="checkbox">
        鍵の自動生成
      </label>
    </div>
    <div class="converter-field visually-hidden" id="cryptoKeyInputRow">
      <label for="opt-keyData">鍵</label>
      <input id="opt-keyData" type="text" placeholder="鍵を入力してください">
    </div>
    <div class="converter-field visually-hidden" id="cryptoIvRow">
      <label for="opt-iv">IV (HEX)</label>
      <input id="opt-iv" type="text" placeholder="AESの場合は16バイトIVを16進数で指定">
    </div>
    <div class="converter-field visually-hidden" id="cryptoRegisterRow">
      <button id="cryptoRegisterBtn" type="button">鍵の登録</button>
    </div>
    <div class="converter-field">
      <p>暗号化・復号化では、入力データをAESアルゴリズムで暗号化・復号化します。</p>
    </div>
    <div class="converter-field visually-hidden" id="cryptoUnlockRow">
      <button id="cryptoUnlockBtn" type="button">ロック解除</button>
      ロック中です。鍵を選択するにはロックキーによる解除が必要です。
    </div>
  `;
}

export const cryptoConverter: Converter = {
  id: 'cryptoCipher',
  name: '暗号化 / 鍵管理',
  description: getDescription,
  setupDescription: (container: HTMLElement) => {
    const actionMode = container.querySelector<HTMLSelectElement>('#opt-actionMode');
    const algorithmSelect = container.querySelector<HTMLSelectElement>('#opt-algorithm');
    const actionModeRow = container.querySelector<HTMLElement>('#cryptoActionModeRow');
    const algorithmRow = container.querySelector<HTMLElement>('#cryptoAlgorithmRow');
    const inputModeRow = container.querySelector<HTMLElement>('#cryptoInputModeRow');
    const outputModeRow = container.querySelector<HTMLElement>('#cryptoOutputModeRow');
    const inputModeSelect = container.querySelector<HTMLSelectElement>('#opt-inputMode');
    const outputModeSelect = container.querySelector<HTMLSelectElement>('#opt-outputMode');
    const keySelect = container.querySelector<HTMLSelectElement>('#opt-keyName');
    const keySelectRow = container.querySelector<HTMLElement>('#cryptoKeySelectRow');
    const keyNewNameRow = container.querySelector<HTMLElement>('#cryptoNewKeyNameRow');
    const keyNewNameInput = container.querySelector<HTMLInputElement>('#opt-newKeyName');
    const autoGenerateRow = container.querySelector<HTMLElement>('#cryptoAutoGenerateRow');
    const autoGenerateCheckbox = container.querySelector<HTMLInputElement>('#opt-generateKey');
    const keyInputRow = container.querySelector<HTMLElement>('#cryptoKeyInputRow');
    const keyInput = container.querySelector<HTMLInputElement>('#opt-keyData');
    const ivRow = container.querySelector<HTMLElement>('#cryptoIvRow');
    const registerRow = container.querySelector<HTMLElement>('#cryptoRegisterRow');
    const registerBtn = container.querySelector<HTMLButtonElement>('#cryptoRegisterBtn');
    const keyUnlockRow = container.querySelector<HTMLElement>('#cryptoUnlockRow');
    const unlockBtn = container.querySelector<HTMLButtonElement>('#cryptoUnlockBtn');

    const populateKeySelect = () => {
      if (!keySelect) {
        return;
      }
      const current = keySelect.value;
      const keys = getSecretKeyNames();
      keySelect.innerHTML = '<option value="">鍵を選択してください</option>';
      keys.forEach((name) => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        keySelect.appendChild(option);
      });
      if (keys.includes(current)) {
        keySelect.value = current;
      }
    };

    const updateVisibility = (): void => {
      const action = actionMode?.value;
      const algorithm = algorithmSelect?.value;
      const isAddKey = action === 'addKey';
      const isAes = algorithm === 'AES256CBC' || algorithm === 'AES256GCM';
      const isEncryptDecrypt = action === 'encrypt' || action === 'decrypt';
      const isLocked = isEncryptDecrypt && !secrets.unused && !secrets.isAuthenticated;
      const autoGenerate = autoGenerateCheckbox?.checked === true;

      if (actionModeRow) {
        actionModeRow.classList.toggle('visually-hidden', isLocked);
      }
      if (algorithmRow) {
        algorithmRow.classList.toggle('visually-hidden', isLocked);
      }
      if (inputModeRow) {
        inputModeRow.classList.toggle('visually-hidden', isLocked);
      }
      if (outputModeRow) {
        outputModeRow.classList.toggle('visually-hidden', isAddKey || isLocked);
      }
      if (keySelectRow) {
        keySelectRow.classList.toggle('visually-hidden', isAddKey || isLocked);
      }
      if (keyNewNameRow) {
        keyNewNameRow.classList.toggle('visually-hidden', !isAddKey || isLocked);
      }
      if (autoGenerateRow) {
        autoGenerateRow.classList.toggle('visually-hidden', !isAddKey || isLocked);
      }
      if (keyInputRow) {
        keyInputRow.classList.toggle('visually-hidden', !isAddKey || isLocked);
      }
      if (registerRow) {
        registerRow.classList.toggle('visually-hidden', !isAddKey || isLocked);
      }
      if (ivRow) {
        ivRow.classList.toggle('visually-hidden', isAddKey || !isAes || isLocked);
      }
      if (keyUnlockRow) {
        keyUnlockRow.classList.toggle('visually-hidden', !isLocked);
      }

      if (keySelect) {
        keySelect.disabled = isAddKey || isLocked;
      }
      if (keyInput) {
        keyInput.disabled = autoGenerate || isLocked;
      }
      if (inputModeSelect) {
        inputModeSelect.disabled = autoGenerate || isLocked;
      }
      if (outputModeSelect) {
        outputModeSelect.disabled = isAddKey || isLocked;
      }
      if (keyNewNameInput) {
        keyNewNameInput.disabled = isLocked;
      }
      if (autoGenerateCheckbox) {
        autoGenerateCheckbox.disabled = isLocked;
      }

      if (!isLocked && isAddKey && outputModeSelect) {
        outputModeSelect.value = 'text';
      }

      if (!isLocked && isEncryptDecrypt && secrets.isAuthenticated) {
        populateKeySelect();
      }
    };

    if (actionMode) {
      actionMode.addEventListener('change', () => {
        updateVisibility();
      });
    }
    if (algorithmSelect) {
      algorithmSelect.addEventListener('change', () => {
        updateVisibility();
      });
    }
    if (keySelect) {
      keySelect.addEventListener('change', () => {
        keySelect.dispatchEvent(new Event('change'));
      });
    }
    if (autoGenerateCheckbox) {
      autoGenerateCheckbox.addEventListener('change', () => {
        updateVisibility();
      });
    }
    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        const event = new CustomEvent('crypto-request-register');
        container.dispatchEvent(event);
      });
    }
    if (unlockBtn) {
      unlockBtn.addEventListener('click', () => {
        const event = new CustomEvent('crypto-request-unlock');
        container.dispatchEvent(event);
      });
    }

    populateKeySelect();
    updateVisibility();
  },

  convert: async (text, opts) => {
    const action = (opts.actionMode as string) ?? 'encrypt';
    const algorithm = (opts.algorithm as string) ?? 'AES256CBC';
    const inputMode = (opts.inputMode as string) ?? 'text';
    const outputMode = (opts.outputMode as string) ?? 'text';
    const keyName = (opts.keyName as string) ?? '';
    const keyData = (opts.keyData as string) ?? '';
    const ivHex = (opts.iv as string) ?? '';

    if (action === 'addKey') {
      if (!secrets.isAuthenticated) {
        if (secrets.unused) {
          throw new Error('SECRETS_REGISTER_REQUIRED');
        }
        throw new Error('SECRETS_AUTH_REQUIRED');
      }
      const newKeyName = (opts.newKeyName as string) ?? '';
      const generateKey = opts.generateKey === true || opts.generateKey === 'true';
      if (!newKeyName.trim()) {
        return ConverterResult.failure('鍵名を入力してください。');
      }

      let storedKeyValue: string;
      const cipherInfo = getCipherSettings(algorithm as AlgorithmMode);
      if (generateKey) {
        const randomBytes = crypto.getRandomValues(new Uint8Array(cipherInfo.keyLength));
        storedKeyValue = uint8ArrayToHex(randomBytes);
      } else {
        if (!keyData) {
          return ConverterResult.failure('登録する鍵を入力してください。');
        }
        if (inputMode === 'binary-hex') {
          try {
            storedKeyValue = uint8ArrayToHex(hexToUint8Array(keyData));
          } catch (err) {
            return ConverterResult.failure(err instanceof Error ? err.message : '鍵の解析に失敗しました。');
          }
        } else {
          const hash = await crypto.subtle.digest('SHA-256', encodeText(keyData));
          storedKeyValue = uint8ArrayToHex(new Uint8Array(hash));
        }
      }

      secrets.put(newKeyName, 'Crypto key', storedKeyValue);
      await secrets.save();
      return ConverterResult.success(`鍵を登録しました: ${newKeyName}`);
    }

    if (!secrets.isAuthenticated) {
      if (secrets.unused) {
        return ConverterResult.failure('鍵を登録してください。');
      }
      throw new Error('SECRETS_AUTH_REQUIRED');
    }

    if (!keyName) {
      return ConverterResult.failure('鍵を選択してください。');
    }

    const secret = secrets.get(keyName);
    if (!secret) {
      return ConverterResult.failure('指定された鍵が見つかりません。');
    }

    const data = parseInputBytes(text, inputMode);
    const cipherInfo = getCipherSettings(algorithm as AlgorithmMode);
    let iv = ivHex ? hexToUint8Array(ivHex) : undefined;

    if (action === 'decrypt' && cipherInfo.ivLength > 0 && !iv) {
      return ConverterResult.failure('復号にはIVを指定してください。');
    }

    if (action === 'encrypt' && !iv && cipherInfo.ivLength > 0) {
      iv = crypto.getRandomValues(new Uint8Array(cipherInfo.ivLength));
    }

    if (algorithm.startsWith('AES') && iv && iv.length !== cipherInfo.ivLength) {
      return ConverterResult.failure(`IVの長さが正しくありません。${cipherInfo.ivLength}バイトのHEX文字列を指定してください。`);
    }

    const key = await deriveKey(algorithm as AlgorithmMode, secret.data);

    if (action === 'encrypt') {
      const algorithmParams = { name: cipherInfo.name, iv } as AesCbcParams | AesGcmParams | any;
      const encrypted = await crypto.subtle.encrypt(algorithmParams, key, data);
      const outputBytes = new Uint8Array(encrypted);
      return ConverterResult.success(getPreferredOutput(outputBytes, outputMode));
    }

    if (action === 'decrypt') {
      let encryptedBytes: Uint8Array;
      try {
        encryptedBytes = parseInputBytes(text, inputMode);
      } catch (err) {
        return ConverterResult.failure(err instanceof Error ? err.message : '暗号文の解析に失敗しました。');
      }
      try {
        const algorithmParams = { name: cipherInfo.name, iv } as AesCbcParams | AesGcmParams | any;
        const decrypted = await crypto.subtle.decrypt(algorithmParams, key, encryptedBytes);
        const decryptedBytes = new Uint8Array(decrypted);
        if (outputMode === 'binary-hex') {
          return ConverterResult.success(uint8ArrayToHex(decryptedBytes));
        }
        return ConverterResult.success(decodeText(decryptedBytes));
      } catch (error) {
        return ConverterResult.failure('復号に失敗しました。鍵、IV、アルゴリズムを確認してください。');
      }
    }

    return ConverterResult.failure('未対応の動作モードです。');
  },
};
