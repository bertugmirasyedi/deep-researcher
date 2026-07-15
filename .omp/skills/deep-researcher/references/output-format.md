# Output Format Reference

Report structure and formatting standards. See parent SKILL.md for workflow summary.

## Full Format (default)

```markdown
Workflow: omp-tui-native
Discovery-first plan: yes | no
Review status: passed | passed_with_disclosed_gaps | failed

# Research Report: <topic>
**Date**: YYYY-MM-DD | **Depth**: quick | deep | **Sources**: N | **Confidence**: <grade>

## Executive Summary
<2–4 paragraphs. Must stand alone.>

## Findings
### <Sub-question 1>
<Synthesis from multiple sources.>
Confidence: <grade> — <justification>

### <Sub-question 2>
...

## Areas of Agreement
<Where sources converge.>

## Areas of Disagreement
<Where sources conflict. Both sides presented.>

## Knowledge Gaps
<What could not be determined. Follow-up recommendations.>

## Source Inventory

| ID | Source | Tier | Score | Recency | Sub-Qs |
|----|--------|------|-------|---------|--------|
| S1 | ... | A | 4.2 | 2026 | SQ1, SQ3 |

## Methodology
<Neutral discovery queries, discovered entities/dimensions, review gate results, repair queries, final citation audit, depth, tools, and evaluation criteria.>
```

## Brief Format

Executive Summary + merged Findings + Source Inventory + Methodology summary. No agreement/disagreement/gap sections unless needed for disclosure.

## Academic Format

Full format extended with:

- Formal abstract (150–250 words)
- Numbered references `[1]`, `[2]`
- Inline citations: `(Author, Year)` or `[S1]`
- Appendix: neutral discovery and refinement queries used
- Appendix: excluded sources with rationale

## Header Fields

- `Workflow`: interactive skill runs use `omp-tui-native`; the separate CLI runner uses `mastra-omp-acp`
- `Discovery-first plan`: both deep workflows must be `yes`
- `Review status`: `passed`, `passed_with_disclosed_gaps`, or `failed`
- `Depth`: `quick` or `deep`

## Methodology Requirements

Include neutral discovery queries, discovered entities/dimensions, review gate results, repair queries if any, final citation audit result, source-minimum requirement, and actual source count.

## Citation Format

**Inline**: `[S1]`, `[S2]`, etc. mapping to inventory `ID` column (full/brief) or `(Author, Year)` (academic)

**Inventory entry**: `S1: [Author(s)]. "Title." *Publication*. Date. URL. [Tier: X | Score: N.N]`

## Confidence Grades

| Grade | Criteria |
|-------|----------|
| High | ≥3 Tier A/B agree, no contradiction, recent |
| Medium | 1–2 sources, some disagreement, or recency concerns |
| Low | Single source, all Tier C/D, or major contradictions |

- Every conclusion requires a confidence grade
- Medium/low must name the limiting factor
- Overall report confidence = lowest confidence among key conclusions

## Quality Checklist

- [ ] Every factual claim cited
- [ ] Every cited source in inventory with tier + score
- [ ] Confidence grades on all conclusions
- [ ] Conflicts presented neutrally
- [ ] Gaps explicitly stated
- [ ] Review gates and final citation audit disclosed
- [ ] Executive summary stands alone
