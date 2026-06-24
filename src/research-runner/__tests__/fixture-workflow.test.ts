import { describe, expect, test } from 'bun:test';
import { readFileSync, rmSync } from 'node:fs';
import { runDeepResearch } from '../workflow';

describe('fixture workflow', () => {
  test('runs the Mastra graph without model or network access', async () => {
    const result = await runDeepResearch({
      fixture: 'agent-frameworks',
      topic: 'latest agentic frameworks',
      depth: 'deep',
      format: 'full',
      dateIso: '2026-06-24T00:00:00.000Z',
      maxReviewRepairRounds: 1,
    });

    expect(result.outputPath).toBe('researches/2026-06-24-latest-agentic-frameworks.md');
    expect(result.reviewStatus).not.toBe('failed');
    expect(result.markdown).toContain('Workflow: mastra-omp-acp');
    expect(result.markdown).not.toMatch(/^## .*LangChain/m);
    expect(result.markdown).not.toContain('How does LangChain');
    expect(readFileSync(result.outputPath, 'utf8')).toContain('Discovery-first plan: yes');
    rmSync(result.outputPath);
  });

  test('adaptive review controller can request an extra discovery-grounded subquestion', async () => {
    const result = await runDeepResearch({
      fixture: 'agent-frameworks-adaptive-review',
      topic: 'latest agentic frameworks',
      depth: 'quick',
      format: 'brief',
      dateIso: '2026-06-24T00:00:00.000Z',
      maxReviewRepairRounds: 1,
    });

    expect(result.outputPath).toBe('researches/2026-06-24-latest-agentic-frameworks.md');
    expect(result.reviewStatus).toBe('passed');
    expect(result.sourcesConsulted).toBe(20);
    expect(result.reviewResults.every((review) => review.passed)).toBe(true);
    rmSync(result.outputPath);
  });
});
