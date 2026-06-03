# Research Reports Archive

This directory stores final research reports produced by the Deep Researcher skill.

## Naming Convention

```
YYYY-MM-DD-<topic-slug>.md
```

- **Date**: The date research was completed (ISO 8601 date prefix).
- **Topic slug**: Lowercase, hyphenated, concise representation of the research topic.

Examples:

```
2026-05-05-risc-v-embedded-systems.md
2026-05-10-quantum-error-correction.md
2026-06-01-llm-inference-optimization.md
```

## Required Report Sections

Every report saved here must include:

1. **Header** — Title, date, depth, sources consulted, source minimum met (yes/no with counts), overall confidence
2. **Executive Summary** — 2–4 paragraph synthesis that stands alone
3. **Findings** — Per sub-question synthesis with citations and confidence grades
4. **Areas of Agreement / Disagreement** — Cross-source convergence and conflict
5. **Knowledge Gaps** — What the research could not determine; must disclose if source minimum for the depth was not met, with justification for confidence adjustments
6. **Source Inventory** — Full table with tier, credibility, recency per source
7. **Methodology** — Depth, queries per sub-question, tools used

See [docs/output-format.md](../docs/output-format.md) for the complete format specification.

## Purpose

- **Persistent record** — Reports are version-controlled and available for future reference.
- **Cross-research linking** — Later research can cite earlier reports in this directory.
- **No generated content** — This directory contains only final reports, not intermediate artifacts.
