import { describe, expect, test } from 'bun:test';
import { buildNeutralDiscoveryQueries } from '../discovery';

describe('buildNeutralDiscoveryQueries', () => {
  test('builds exact neutral queries for latest agentic frameworks in 2026', () => {
    expect(
      buildNeutralDiscoveryQueries({
        topic: 'latest agentic frameworks',
        depth: 'deep',
        format: 'full',
        dateIso: '2026-06-24T00:00:00.000Z',
        maxReviewRepairRounds: 1,
      }),
    ).toEqual([
      'latest agentic frameworks landscape 2026',
      'new AI agent frameworks comparison 2026',
      'agent orchestration frameworks production readiness 2026',
      'AI agent framework ecosystem observability workflows evaluation 2026',
    ]);
  });

  test('does not inject vendor names absent from the topic', () => {
    const forbiddenNames = ['LangChain', 'CrewAI', 'AutoGen', 'Mastra', 'Pydantic', 'OpenAI'];
    const topic = 'latest agentic frameworks';
    const queries = buildNeutralDiscoveryQueries({
      topic,
      depth: 'deep',
      format: 'full',
      dateIso: '2026-06-24T00:00:00.000Z',
      maxReviewRepairRounds: 1,
    });

    for (const forbiddenName of forbiddenNames) {
      if (!topic.toLowerCase().includes(forbiddenName.toLowerCase())) {
        expect(queries.some((query) => query.includes(forbiddenName))).toBe(false);
      }
    }
  });
});
