---
name: deep-researcher
description: Produce a structured, citation-backed research report on a topic. Use when the user explicitly asks to research a topic, produce a research report, or do a deep dive on a subject. Triggers include "research", "deep dive", "research report", "investigate", or "report on".
---

# Deep Researcher

Multi-source research pipeline that produces structured, citation-backed reports.

## Quick Start

```text
/skill:deep-researcher <topic>
/skill:deep-researcher <topic> --depth quick|deep
/skill:deep-researcher <topic> --format brief|full|academic
```

Arguments after the command are parsed as:

- First positional argument: research topic (required)
- `--depth`: **deep** (default — parallel task subagents, full-text reads, iteration; real research) or **quick** (3 sub-Qs, snippet scan, no required full-source reads/iteration; fast lookup). If omitted, default to **deep**.
- `--format`: brief (summary only), full (default), academic (formal citations)

The two modes differ in *behavior*, not just search count. `quick` is an honest fast lookup — a few `web_search` calls, snippets acceptable. `deep` is the real pipeline: it **must** read full source content via `read` on URLs and run **at least one refinement round** seeded by first-round findings. That mandatory read-and-iterate step is what separates research from a snippet skim.

## Pipeline

Execute four sequential stages in order.

> **Required orchestration**: For `deep` research, Stages 2–3 (Search + Evaluate) **must** be parallelised with OMP's `task` tool: spawn one project `researcher` agent per sub-question in a single `tasks[]` batch. Single-threaded execution is only for `quick` depth. Do not use Orca terminals, `orca orchestration`, `ORCA_ROLE`, or Linear issues.

### Stage 1: Plan

Decompose the topic into 3–8 sub-questions:

1. Identify the core question and its key dimensions
2. Generate focused, researchable sub-questions
3. Order by importance (foundational first)
4. Assign expected source types per sub-question

Depth controls:

- **Quick**: 3 sub-questions, 2 searches each, snippets acceptable, no required refinement round, **minimum 5**, target 5–10 sources. Runs inline in the planner.
- **Deep** (default): 6–8 sub-questions, 4 searches each, **full-source `read` required** on the top 4+ URLs per sub-question, **at least one refinement round required** (re-query seeded by first-round findings), **minimum 30**, target 30–50 sources. Runs as parallel OMP `researcher` task agents.

If the minimum source count for the selected depth cannot be met after all searches are exhausted, the report must disclose this in **Knowledge Gaps** and every affected conclusion must have its confidence grade lowered and justified.

### Worker Dispatch Plan

As part of the plan, produce a dispatch map:

```text
Worker agent     Sub-question    Searches
ResearcherSQ1    SQ1: <title>    3-4
ResearcherSQ2    SQ2: <title>    3-4
ResearcherSQ3    SQ3: <title>    3-4
...
```

Present the full plan (sub-questions + dispatch map) to the user before proceeding.

### Stage 2: Search

**Parallel execution is the default for `deep` research.** Spawn one OMP `researcher` task agent per sub-question. Use one `task` call with `agent: "researcher"`, shared `context`, and one `tasks[]` item per sub-question. Each assignment must include:

- exact sub-question and scope
- expected source types
- required number of searches
- requirement to use `web_search`
- requirement to `read` full URL content for the top 4+ promising results
- requirement to run at least one refinement query round for `deep`
- output format from this skill

The planner collects the task results (`agent://…` artifacts when needed), merges the structured findings, and proceeds to Stage 4.

> Single-threaded sequential search is **only** for `quick` depth and runs in the planner without spawning researcher agents.

Each `researcher` subagent performs these steps internally:

1. Craft 2–4 queries per sub-question with varied phrasing
   - Vary scope (broad → specific)
   - Vary angle (technical → business → social)
   - Vary recency (historical → recent)
2. Use `web_search` for live web research. If no search provider is configured, rely on user-provided sources, local files, and the agent's training knowledge — but **never fabricate citations**; state explicitly which claims lack verifiable sources.
3. Use `read` on the most promising URLs. For `deep`, this is **required** — read full content for the top 4+ results per sub-question rather than relying on search snippets. For `quick`, snippets are acceptable.
4. For `deep`, run **at least one refinement round**: after the first pass, issue follow-up queries seeded by what surfaced (named entities, contradictions, cited works) before handing off. `quick` does a single pass.
5. Collect metadata: author, date, domain, publication type, URL

### Stage 3: Evaluate

Score and tier every source:

1. **Classify** into quality tiers (A=authoritative, B=reliable, C=supplemental, D=unsupported)
2. **Score** on 5 dimensions: author authority (30%), publication reputation (25%), recency (20%), corroboration (15%), methodology (10%)
3. **Deduplicate** — merge sources on same finding; keep highest quality
4. **Map conflicts** — flag where sources disagree
5. **Identify gaps** — note sub-questions with insufficient coverage

Source quality details: see [source-quality.md](references/source-quality.md)

### Stage 4: Write

Produce the structured report:

1. Synthesize per sub-question (combine sources, don't just list them)
2. Identify cross-cutting themes
3. Assign confidence grades (high/medium/low) with justification
4. Note knowledge gaps explicitly
5. Format per requested output style
6. **Save the report** — Write the final Markdown file to `researches/YYYY-MM-DD-<topic-slug>.md` before summarizing to the user

Output format details: see [output-format.md](references/output-format.md)

## Confidence Grades

| Grade | Criteria |
|-------|----------|
| **High** | ≥3 Tier A/B sources agree, no credible contradiction |
| **Medium** | 1–2 quality sources OR some disagreement OR recency concerns |
| **Low** | Single source OR all Tier C/D OR significant contradictions |

## Critical Rules

1. **Parallel execution is the default** — For `deep` research, always spawn OMP `researcher` task agents in parallel (one per sub-question). Single-threaded execution is only for `quick` depth.
2. **Cite everything** — Every factual claim must link to a source.
3. **Evaluate before trusting** — No source is used without quality scoring.
4. **Synthesize, don't summarize** — Cross-reference, identify agreements/conflicts/gaps.
5. **Declare confidence** — Every conclusion gets a grade with reasoning.
6. **Present the plan first** — Show the research plan (including worker dispatch map) before searching.
7. **Use OMP artifacts for worker results** — Task outputs and transcripts are available through `agent://…` and `history://…`; do not create Linear issues for research-run tracking.
8. **Enforce minimum source counts** — Each depth level has a minimum (quick: 5, deep: 30). If unmet, disclose in Knowledge Gaps and lower/justify confidence on affected conclusions.
9. **`deep` must read and iterate** — A `deep` run that only skimmed snippets or did a single pass is non-compliant. Full-source `read` on top URLs and ≥1 refinement round are mandatory; if either was skipped, downgrade the run to `quick` in the report header rather than labeling it `deep`.
10. **Save final report to `researches/`** — After synthesis, write the Markdown report to `researches/YYYY-MM-DD-<topic-slug>.md` before summarizing to the user.

## Decision Log

For non-obvious choices made during research (e.g., excluding a source, resolving a conflict), note them inline or append to the repo decision log at [docs/decisions.md](../../../docs/decisions.md).
