import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function collectFiles(directory: string): string[] {
  const entries = readdirSync(directory).sort();
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      files.push(...collectFiles(path));
    } else if (path.endsWith('.ts')) {
      files.push(path);
    }
  }

  return files;
}

describe('PURE source boundary', () => {
  it('does not include forbidden runtime source patterns under src/pure', () => {
    const root = join(process.cwd(), 'src', 'pure');
    const forbiddenPatterns = [
      ['Math', '.', 'random'].join(''),
      ['Date', '.', 'now'].join(''),
      ['cla', 'mp'].join(''),
      ['max', 'Delta'].join(''),
      ['amplitude', 'Clamp'].join(''),
      ['max', '(', 'nu', ',', ' ', '0', ')'].join(''),
      ['max', '(', 'ν', ',', ' ', '0', ')'].join(''),
      ['make', 'Alive'].join(''),
      ['make', 'Conscious'].join(''),
      ['force', 'Recovery'].join(''),
      ['desired', 'Target'].join(''),
    ];

    const matches: string[] = [];
    for (const file of collectFiles(root)) {
      const source = readFileSync(file, 'utf8');
      for (const pattern of forbiddenPatterns) {
        if (source.includes(pattern)) {
          matches.push(`${file}: ${pattern}`);
        }
      }
    }

    expect(matches).toEqual([]);
  });
});
