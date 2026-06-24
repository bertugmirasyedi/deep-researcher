import { z } from 'zod';
import type { SourceLedgerEntry } from './schemas';

export const SOURCE_QUALITY_WEIGHTS = {
  authorAuthority: 0.30,
  publicationReputation: 0.25,
  recencyRelevance: 0.20,
  corroboration: 0.15,
  methodologyTransparency: 0.10,
} as const;

export const SourceQualityDimensionScoresSchema = z.object({
  authorAuthority: z.number().min(0).max(5),
  publicationReputation: z.number().min(0).max(5),
  recencyRelevance: z.number().min(0).max(5),
  corroboration: z.number().min(0).max(5),
  methodologyTransparency: z.number().min(0).max(5),
});
export type SourceQualityDimensionScores = z.output<typeof SourceQualityDimensionScoresSchema>;

export function calculateCredibilityScore(scores: SourceQualityDimensionScores): number {
  const weighted =
    scores.authorAuthority * SOURCE_QUALITY_WEIGHTS.authorAuthority +
    scores.publicationReputation * SOURCE_QUALITY_WEIGHTS.publicationReputation +
    scores.recencyRelevance * SOURCE_QUALITY_WEIGHTS.recencyRelevance +
    scores.corroboration * SOURCE_QUALITY_WEIGHTS.corroboration +
    scores.methodologyTransparency * SOURCE_QUALITY_WEIGHTS.methodologyTransparency;

  return Math.min(5, Math.max(0, Math.round(weighted * 10) / 10));
}

export function passesSourceThreshold(score: number): boolean {
  return score >= 3.0;
}

export function isCitableSource(entry: Pick<SourceLedgerEntry, 'tier' | 'score' | 'readStatus'>): boolean {
  return entry.readStatus === 'read' && entry.tier !== 'D' && passesSourceThreshold(entry.score);
}
