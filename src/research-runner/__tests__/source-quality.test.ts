import { describe, expect, test } from 'bun:test';
import { calculateCredibilityScore, isCitableSource, passesSourceThreshold } from '../source-quality';

describe('source quality gates', () => {
  test('calculates weighted credibility score', () => {
    expect(
      calculateCredibilityScore({
        authorAuthority: 5,
        publicationReputation: 4,
        recencyRelevance: 3,
        corroboration: 3,
        methodologyTransparency: 4,
      }),
    ).toBe(4.0);
  });

  test('applies citable source thresholds', () => {
    expect(passesSourceThreshold(2.9)).toBe(false);
    expect(passesSourceThreshold(3.0)).toBe(true);
    expect(isCitableSource({ tier: 'D', score: 4, readStatus: 'read' })).toBe(false);
    expect(isCitableSource({ tier: 'A', score: 2.9, readStatus: 'read' })).toBe(false);
    expect(isCitableSource({ tier: 'A', score: 4, readStatus: 'failed' })).toBe(false);
  });
});
