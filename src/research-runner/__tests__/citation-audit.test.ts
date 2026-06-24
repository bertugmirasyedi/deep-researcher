import { describe, expect, test } from 'bun:test';
import { findCitationAuditFailures } from '../citation-audit';
import type { FinalReport } from '../schemas';

const baseReport: FinalReport = {
  topic: 'topic',
  depth: 'quick',
  format: 'brief',
  markdown: '',
  outputPath: '',
  sourcesConsulted: 1,
  sourceMinimumMet: false,
  reviewStatus: 'passed_with_disclosed_gaps',
  reviewResults: [],
};

describe('findCitationAuditFailures', () => {
  test('fails uncited factual paragraphs', () => {
    const failures = findCitationAuditFailures({
      ...baseReport,
      markdown: '## Findings\nThis factual paragraph lacks a citation.\n\n## Source Inventory\n| S1 | Source | https://example.com |',
    });

    expect(failures.some((failure) => failure.includes('uncited paragraph'))).toBe(true);
  });

  test('passes cited paragraph with matching source inventory', () => {
    expect(
      findCitationAuditFailures({
        ...baseReport,
        markdown: '## Findings\nThis factual paragraph has a citation [S1].\n\n## Source Inventory\n| S1 | Source | https://example.com |',
      }),
    ).toEqual([]);
  });
});
