import type { DraftReport, FinalReport } from './schemas';

const CITATION_TOKEN_PATTERN = /\[S\d+\]/g;
const SOURCE_ID_PATTERN = /\bS\d+\b/g;

export function findCitationAuditFailures(report: DraftReport | FinalReport): string[] {
  if ('claimMap' in report) {
    const sourceIds = new Set(report.sources.map((source) => source.id));
    return report.claimMap.flatMap((claim) =>
      claim.sourceIds
        .filter((sourceId) => !sourceIds.has(sourceId))
        .map((sourceId) => `claim ${claim.claimId} cites absent source ${sourceId}`),
    );
  }

  const failures: string[] = [];
  const sourceInventoryIds = new Set(extractSourceInventoryIds(report.markdown));
  const citationTokens = report.markdown.match(SOURCE_ID_PATTERN) ?? [];

  for (const sourceId of citationTokens) {
    if (!sourceInventoryIds.has(sourceId)) {
      failures.push(`citation references absent source inventory id ${sourceId}`);
    }
  }

  for (const paragraph of paragraphsUnderAuditedSections(report.markdown)) {
    if (!CITATION_TOKEN_PATTERN.test(paragraph)) {
      failures.push(`uncited paragraph under audited section: ${paragraph.slice(0, 120)}`);
    }
    CITATION_TOKEN_PATTERN.lastIndex = 0;
  }

  return failures;
}

function extractSourceInventoryIds(markdown: string): string[] {
  const sourceInventory = sectionBody(markdown, 'Source Inventory');
  return sourceInventory.match(SOURCE_ID_PATTERN) ?? [];
}

function paragraphsUnderAuditedSections(markdown: string): string[] {
  return ['Findings', 'Areas of Agreement', 'Areas of Disagreement'].flatMap((heading) => {
    const body = sectionBody(markdown, heading);
    return body
      .split(/\n\s*\n/g)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0 && !paragraph.startsWith('#') && !paragraph.startsWith('|'));
  });
}

function sectionBody(markdown: string, heading: string): string {
  const match = markdown.match(new RegExp(`(^|\\n)## ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=\\n## |$)`));
  return match?.[2] ?? '';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
