import { describe, expect, test } from 'bun:test';
import { buildOmpAcpArgs, extractFirstJsonObject } from '../omp-acp';

describe('OMP ACP adapter', () => {
  test('builds OMP ACP command arguments without stripping tools', () => {
    const args = buildOmpAcpArgs({ model: 'openai-codex/gpt-5.5', thinkingLevel: 'minimal' });

    expect(args).toEqual(['--model', 'openai-codex/gpt-5.5', '--thinking', 'minimal', 'acp']);
    expect(args).not.toContain('--tools');
    expect(args).not.toContain('--no-tools');
    expect(args).not.toContain('--no-lsp');
    expect(args).not.toContain('--no-skills');
    expect(args).not.toContain('--no-rules');
    expect(args).not.toContain('--no-extensions');
  });

  test('parses raw JSON objects', () => {
    expect(extractFirstJsonObject('{"ok":true}')).toEqual({ ok: true });
  });

  test('parses fenced JSON objects', () => {
    expect(extractFirstJsonObject('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  test('rejects invalid JSON with json_parse_failed prefix', () => {
    expect(() => extractFirstJsonObject('{not valid')).toThrow(/^json_parse_failed:/);
  });
});
