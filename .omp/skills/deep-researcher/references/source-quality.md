# Source Quality Reference

Full source evaluation criteria. See parent SKILL.md for the workflow summary.

## Quality Tiers

### Tier A — Authoritative

- Peer-reviewed academic papers
- Official documentation from authoritative bodies
- Preprints from recognized researchers (with caveat)
- Established technical documentation (RFCs, W3C specs)
- Primary data sources

### Tier B — Reliable

- Reputable news outlets with editorial standards
- Industry reports from established firms
- Books from academic presses
- Official engineering blogs
- Conference talks (with speaker credentials)

### Tier C — Supplemental

- Expert blog posts (verifiable credentials)
- Wikipedia (pointer to primaries, not terminal source)
- Forum discussions (perspectives, not evidence)
- Press releases (identified as self-reported)

### Tier D — Unsupported

- Anonymous content
- Social media without verifiable identity
- No publication date
- AI-generated without human verification
- Retracted or debunked content

## Scoring Matrix

| Dimension | Weight | 5 (Excellent) | 3 (Adequate) | 1 (Poor) |
|-----------|--------|---------------|--------------|----------|
| Author authority | 30% | Recognized expert | Professional in field | Anonymous |
| Publication reputation | 25% | Peer-reviewed / top-tier | Established outlet | Self-published |
| Recency relevance | 20% | Within relevant window | Within 2× window | Outdated |
| Corroboration | 15% | 3+ independent sources | 1–2 sources | Uncorroborated |
| Methodology | 10% | Full disclosure | Partial | None |

**Minimum threshold**: 3.0 weighted average. Below = flagged in report.

## Recency Rules

| Topic type | Relevant recency | Stale after |
|------------|-----------------|-------------|
| Breaking news | Days | Weeks |
| Technology | Months | 2–3 years |
| Academic | Years | 5–10 years |
| Historical | Decades OK | Only if superseded |
| Regulatory | Current statute | New regulation |

## Conflict Resolution

1. Compare tiers → prefer higher
2. Compare recency → prefer recent (unless historical)
3. Compare corroboration → prefer more confirmation
4. Unresolved → present both sides with confidence grades
