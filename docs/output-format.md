# Output Format

Report structure, citation format, and confidence grading for Deep Researcher output.

## Report Structure

### Full Format (default)

```markdown
Workflow: mastra-omp-acp
Discovery-first plan: yes | no
Review status: passed | passed_with_disclosed_gaps | failed

# Research Report: <topic>

**Date**: YYYY-MM-DD
**Depth**: quick | deep
**Sources consulted**: N
**Source minimum met**: yes | no (required: X, found: Y)
**Overall confidence**: high | medium | low

---

## Executive Summary

<2–4 paragraph synthesis of key findings. Must stand alone as a useful summary.>

## Findings

### <Sub-question 1>

<Synthesized answer drawing from multiple sources.>
<Confidence: high | medium | low — <one-line justification>>

### <Sub-question 2>

...

## Areas of Agreement

<Findings where multiple high-quality sources converge.>

## Areas of Disagreement

<Findings where credible sources conflict. Present both sides with reasoning.>

## Knowledge Gaps

<What this research could not determine. Recommend follow-up research angles.>

## Source Inventory

| ID | Source | Tier | Credibility | Recency | Sub-Qs addressed |
|----|--------|------|-------------|---------|-------------------|
| S1 | [Author. "Title." Publication. Date.](URL) | A | 4.2 | 2026 | SQ1, SQ3 |
| S2 | ... | | | | |

## Methodology

<Neutral discovery queries, discovered entities/dimensions, research depth, review gate results, repair queries, final citation audit, search tools used, and evaluation criteria applied.>
```

### Brief Format

Trimmed to: Executive Summary + Findings + Source Inventory + Methodology summary. Agreement/disagreement/gap sections may be merged, but factual paragraphs still need citations.

### Academic Format

Extended Full format with:

- Formal abstract (150–250 words)
- Numbered references `[1]`, `[2]`, etc.
- Inline citations: `(Author, Year)` or `[S1]`
- Appendix with neutral discovery queries and refinement queries
- Appendix with excluded sources and rationale

## Required Header Fields

| Field | Values | Requirement |
|---|---|---|
| `Workflow` | `mastra-omp-acp` or fallback identifier | Canonical deep runner uses `mastra-omp-acp` |
| `Discovery-first plan` | `yes` or `no` | Canonical deep runner must be `yes` |
| `Review status` | `passed`, `passed_with_disclosed_gaps`, `failed` | Final deterministic status |
| `Depth` | `quick`, `deep` | No other depth labels are current |

## Methodology Requirements

The Methodology section must include:

- Neutral discovery queries used before planning
- Discovered entities and dimensions that seeded the plan
- Review gate results for coverage, bias, and citation audit
- Repair queries and repair outcome, if any
- Final deterministic citation audit result
- Source-minimum requirement and actual consulted source count

## Citation Format

### Inline

- Full/Brief format: `[S1]`, `[S2]`, etc. where the ID maps to the Source Inventory `ID` column
- Academic format: `(Author, Year)` or `[S1]`

### Source Inventory Entry

```text
[Author(s)]. "Title." *Publication*. Date. URL. [Tier: A | Credibility: 4.2]
```

For sources without clear authors:

```text
"Title." *Publication*. Date. URL. [Tier: B | Credibility: 3.8]
```

### In-text Attribution

```markdown
RISC-V adoption in embedded systems grew in cited market datasets [S3].
This is contested by West (2026), who argues the figure is inflated [S7].
```

## Confidence Grades

| Grade | Meaning | Criteria |
|-------|---------|----------|
| **High** | Well-established | ≥3 Tier A/B sources agree; no credible contradiction; recent and relevant |
| **Medium** | Likely but uncertain | 1–2 quality sources OR multiple sources with some disagreement OR recency concerns |
| **Low** | Speculative | Single source OR all sources Tier C/D OR significant unresolved contradictions |

### Confidence Rules

- Every conclusion section must include a confidence grade
- If confidence is medium or low, the justification must name the specific limiting factor
- Overall report confidence is the lowest confidence grade among key conclusions

## Formatting Standards

- Use Markdown throughout
- Bold for key terms on first use
- Italic for publication names
- Code blocks for data, statistics, or technical specifications
- Tables for comparative data
- Blockquotes for direct source quotes with attribution

## Report Archival

Every final report must be saved as a Markdown file under `researches/` before being summarized to the user.

- **Path**: `researches/YYYY-MM-DD-<topic-slug>.md`
- **Naming**: Date prefix (ISO 8601), lowercase topic slug, hyphen-separated
- **Required sections**: Header, Executive Summary, Findings, Agreement/Disagreement, Knowledge Gaps, Source Inventory, Methodology
- See [researches/README.md](../researches/README.md) for full details

## Quality Checklist

Before delivering a report, verify:

- [ ] Every factual claim has a citation
- [ ] Every cited source appears in Source Inventory with tier and score
- [ ] Confidence grades appear for all conclusions
- [ ] Conflicts are presented neutrally
- [ ] Knowledge gaps are explicitly stated
- [ ] Executive summary can stand alone
- [ ] Source minimum for the requested depth is met, OR shortfall is disclosed in Knowledge Gaps with confidence adjustments
- [ ] Review gate results and final citation audit are disclosed
- [ ] Report saved to `researches/YYYY-MM-DD-<topic-slug>.md`
