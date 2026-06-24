import { describe, expect, test } from 'bun:test';
import { validatePlanAgainstDiscovery, validateSubQuestionsAgainstDiscovery } from '../plan-validation';
import type { DiscoveryMap, ResearchPlan } from '../schemas';

const discovery: DiscoveryMap = {
  topic: 'latest agentic frameworks',
  neutralQueries: ['latest agentic frameworks landscape 2026', 'new AI agent frameworks comparison 2026'],
  searchResults: [],
  sourceReads: [],
  entities: [
    {
      id: 'E1',
      name: 'Mastra',
      kind: 'framework',
      evidenceSourceIds: ['S1'],
      firstSeenQuery: 'latest agentic frameworks landscape 2026',
      mentionCount: 1,
    },
    {
      id: 'E2',
      name: 'Pydantic AI',
      kind: 'framework',
      evidenceSourceIds: ['S2'],
      firstSeenQuery: 'new AI agent frameworks comparison 2026',
      mentionCount: 1,
    },
  ],
  dimensions: [{ name: 'workflow orchestration', evidenceSourceIds: ['S1'], explanation: 'Workflow control evidence.' }],
  gaps: [],
};

function subQuestion(id: string, entityName: string) {
  return {
    id,
    question: `How does ${entityName} support deterministic workflows?`,
    rationale: 'Tests discovery grounding.',
    expectedSourceTypes: ['docs'],
    seededByEntityIds: ['E1'],
    seededByDimensionNames: ['workflow orchestration'],
    allNamedEntitiesInQuestion: [entityName],
    initialQueries: [`${entityName} workflows`, `${entityName} production`],
  };
}

describe('validatePlanAgainstDiscovery', () => {
  test('rejects entity names absent from discovery evidence', () => {
    const plan: ResearchPlan = {
      topic: discovery.topic,
      depth: 'deep',
      scope: 'framework landscape',
      subQuestions: [
        subQuestion('SQ1', 'LangChain'),
        subQuestion('SQ2', 'Mastra'),
        subQuestion('SQ3', 'Mastra'),
        subQuestion('SQ4', 'Mastra'),
        subQuestion('SQ5', 'Mastra'),
        subQuestion('SQ6', 'Mastra'),
      ],
      sourceMinimum: 30,
      targetSources: { min: 30, max: 50 },
    };

    expect(validatePlanAgainstDiscovery(plan, discovery).join('\n')).toContain('LangChain');
  });

  test('validates discovery-grounded subquestions without depth cardinality', () => {
    expect(validateSubQuestionsAgainstDiscovery([subQuestion('SQ7', 'Mastra')], discovery)).toEqual([]);
  });
});
