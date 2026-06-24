import { describe, expect, test } from 'bun:test';
import { getStructuredOutputToolName } from '../structured-output-tools';
import { buildOmpAcpArgs, extractFirstJsonObject, extractStructuredOutputToolInputFromChunks } from '../omp-acp';

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

  test('maps schema names to structured output tool names', () => {
    expect(getStructuredOutputToolName('ReviewResult')).toBe('submit_review_result');
    expect(() => getStructuredOutputToolName('Nope')).toThrow('structured_output_tool_unknown_schema:Nope');
  });

  test('extracts structured output tool input from matching chunks', () => {
    expect(extractStructuredOutputToolInputFromChunks([
      { type: 'tool-call', payload: { toolName: 'submit_review_result', args: { reviewer: 'coverage' } } },
    ], 'ReviewResult')).toEqual({ reviewer: 'coverage' });
  });

  test('rejects missing structured output tool call chunks', () => {
    expect(() => extractStructuredOutputToolInputFromChunks([], 'ReviewResult')).toThrow('structured_output_tool_call_count:submit_review_result:0');
  });

  test('rejects duplicate structured output tool call chunks', () => {
    const chunks = [
      { type: 'tool-call', payload: { toolName: 'submit_review_result', args: { reviewer: 'coverage' } } },
      { type: 'tool-call', payload: { toolName: 'submit_review_result', args: { reviewer: 'bias' } } },
    ];

    expect(() => extractStructuredOutputToolInputFromChunks(chunks, 'ReviewResult')).toThrow('structured_output_tool_call_count:submit_review_result:2');
  });
});
