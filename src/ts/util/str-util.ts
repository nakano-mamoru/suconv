export type CountMode = 'chars' | 'utf8-bytes' | 'sjis-bytes';

export const COUNT_MODE_MAP: Record<string, CountMode> = {
  chars: 'chars',
  'utf8-bytes': 'utf8-bytes',
  'sjis-bytes': 'sjis-bytes',
};

export function preprocessByCommonOptions(text: string, trimWhitespace: boolean, removeLineBreaks: boolean): string {
  if (trimWhitespace) {
    text = text.split('\n').map((line) => line.replace(/^[ \t　]+|[ \t　]+$/g, '')).join('\n');
  }

  if (removeLineBreaks) {
    text = text.replace(/\r\n|\r|\n/g, '');
  }

  return text;
}

export function measureCharByCountMode(char: string, countMode: CountMode): number {
  switch (countMode) {
    case 'utf8-bytes':
      return new TextEncoder().encode(char).length;
    case 'sjis-bytes': {
      const codePoint = char.codePointAt(0) ?? 0;
      if (codePoint <= 0x7f || (codePoint >= 0xff61 && codePoint <= 0xff9f)) {
        return 1;
      }
      return 2;
    }
    default:
      return 1;
  }
}

function normalizeLineBreakForByteCount(text: string, lineBreakChar: string): string {
  if (lineBreakChar === 'crlf') {
    return text.replace(/\r\n|\r|\n/g, '\r\n');
  }

  return text.replace(/\r\n|\r|\n/g, '\n');
}

export function countTextByMode(text: string, countMode: CountMode, lineBreakChar: string): number {
  if (countMode === 'chars') {
    return Array.from(text).length;
  }

  const normalized = normalizeLineBreakForByteCount(text, lineBreakChar);
  return Array.from(normalized).reduce((sum, char) => sum + measureCharByCountMode(char, countMode), 0);
}
