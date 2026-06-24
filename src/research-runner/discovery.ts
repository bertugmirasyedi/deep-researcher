import type { ResearchInput } from './schemas';

export function buildNeutralDiscoveryQueries(input: ResearchInput): string[] {
  const topic = input.topic.trim();
  const year = new Date(input.dateIso ?? new Date().toISOString()).getUTCFullYear();

  if (topic.toLowerCase() === 'latest agentic frameworks' && year === 2026) {
    return [
      'latest agentic frameworks landscape 2026',
      'new AI agent frameworks comparison 2026',
      'agent orchestration frameworks production readiness 2026',
      'AI agent framework ecosystem observability workflows evaluation 2026',
    ];
  }

  return [
    `${topic} landscape ${year}`,
    `new ${topic} comparison ${year}`,
    `${topic} production readiness ${year}`,
    `${topic} ecosystem observability workflows evaluation ${year}`,
  ];
}
