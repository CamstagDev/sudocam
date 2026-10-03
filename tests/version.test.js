import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { VERSION_APP } from '../src/version.js';

describe('VERSION_APP', () => {
  it('coincide con la versión de package.json', () => {
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(VERSION_APP).toBe(version);
  });
});
