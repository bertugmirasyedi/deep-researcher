# Source Quality

Criteria for evaluating and scoring information sources. Applies during the [Evaluate stage](research-workflow.md#stage-3-evaluate).

## Quality Tiers

### Tier A — Authoritative

Directly credible sources with strong editorial or peer-review processes.

- Peer-reviewed academic papers (journals, conference proceedings)
- Official documentation from authoritative bodies (standards orgs, government agencies)
- Preprints from recognized researchers (arXiv, bioRxiv — with caveat)
- Established technical documentation (official docs, RFCs, W3C specs)
- Primary data sources (census data, SEC filings, court records)

**Default trust**: High. Verify recency and relevance, not credibility.

### Tier B — Reliable

Credible sources with some editorial oversight, but without formal peer review.

- Reputable news outlets with editorial standards (NYT, Reuters, Nature News)
- Industry reports from established firms (Gartner, McKinsey, IEEE)
- Books from academic presses
- Official company blogs / engineering blogs (with attribution)
- Technical conference talks (with speaker credentials)

**Default trust**: Medium-high. Cross-reference for contested claims.

### Tier C — Supplemental

Sources with value but limited editorial oversight or unknown credibility.

- Expert blog posts (with verifiable author credentials)
- Wikipedia (use as pointer to primary sources, not as terminal source)
- Reddit/HN/forum discussions (use to identify perspectives, not as evidence)
- Podcast transcripts
- Press releases (identify as self-reported)
- Company white papers (identify as sponsored)

**Default trust**: Medium. Use to illustrate perspectives, not establish facts.

### Tier D — Unsupported

Sources with no credibility verification pathway.

- Anonymous or unattributed content
- Social media posts without verifiable identity
- Content with no publication date
- AI-generated content without human verification
- Sources that have been retracted or debunked

**Default trust**: Low. Use only as counterpoint or to show "what people are saying."

## Scoring Dimensions

Each source is scored on five dimensions:

| Dimension | Weight | 5 (Excellent) | 3 (Adequate) | 1 (Poor) |
|-----------|--------|---------------|--------------|----------|
| Author authority | 30% | Recognized expert with publications | Professional in the field | Anonymous or no credentials |
| Publication reputation | 25% | Peer-reviewed or top-tier outlet | Established outlet with editorial standards | Self-published, no oversight |
| Recency relevance | 20% | Published within relevant timeframe | Published within 2× relevant timeframe | Outdated for the topic |
| Corroboration | 15% | Confirmed by 3+ independent sources | Confirmed by 1–2 sources | Single source, uncorroborated |
| Methodology transparency | 10% | Full methodology disclosed | Some methodology visible | No methodology, claims unsupported |

**Minimum threshold**: 3.0 weighted average. Sources below threshold are flagged in the report.

## Topic-Specific Recency Rules

| Topic type | Relevant recency | Stale after |
|------------|-----------------|-------------|
| Breaking news | Days | Weeks |
| Technology trends | Months | 2–3 years |
| Academic research | Years | 5–10 years (varies by field) |
| Historical analysis | Decades acceptable | Only if superseded |
| Regulatory/legal | Current statute | When superseded by new regulation |

## Conflict Resolution

When sources disagree:

1. **Compare tiers** — Prefer higher-tier sources
2. **Compare recency** — Prefer more recent sources, unless the topic is historical
3. **Compare corroboration** — Prefer sources with more independent confirmation
4. **If unresolved** — Present both sides with explicit confidence grades and reasoning

## Anti-Patterns

- **Citation laundering** — Don't cite Source B just because Source A cites Source B. Go to the primary source.
- **Cherry-picking** — Don't select only sources that support a preferred conclusion
- **Echo chambers** — Don't treat multiple articles from the same outlet as independent corroboration
- **Recency bias** — Don't dismiss older high-quality sources in favor of newer low-quality ones
