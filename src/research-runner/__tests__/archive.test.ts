import { describe, expect, test } from 'bun:test';
import { readFileSync, rmSync } from 'node:fs';
import { slugifyTopic, writeReportArchive } from '../archive';

describe('archive utilities', () => {
  test('slugifies topic', () => {
    expect(slugifyTopic('Latest Agentic Frameworks?')).toBe('latest-agentic-frameworks');
  });

  test('writes reports under researches', () => {
    const path = writeReportArchive({ topic: 'Latest Agentic Frameworks?', markdown: '# Report' }, '2026-06-24T00:00:00.000Z');

    expect(path).toBe('researches/2026-06-24-latest-agentic-frameworks.md');
    expect(readFileSync(path, 'utf8')).toBe('# Report');
    rmSync(path);
  });
});
