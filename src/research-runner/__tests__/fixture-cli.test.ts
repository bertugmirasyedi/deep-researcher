import { describe, expect, test } from 'bun:test';
import { rmSync } from 'node:fs';

describe('fixture CLI', () => {
  test('runs fixture research command', async () => {
    const proc = Bun.spawn({
      cmd: ['bun', 'run', 'src/research-runner/cli.ts', '--fixture', 'agent-frameworks', '--topic', 'latest agentic frameworks', '--depth', 'deep', '--format', 'full'],
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout, stderr, exitCode] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);

    expect(stderr).toBe('');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('outputPath=researches/');
    expect(stdout).toMatch(/reviewStatus=(passed|passed_with_disclosed_gaps)/);
    rmSync('researches/2026-06-24-latest-agentic-frameworks.md', { force: true });
  });
});
