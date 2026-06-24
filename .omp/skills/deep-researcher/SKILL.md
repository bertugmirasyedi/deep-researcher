---
name: deep-researcher
description: Produce a structured, citation-backed research report on a topic. Use when the user explicitly asks to research a topic, produce a research report, or do a deep dive on a subject. Triggers include "research", "deep dive", "research report", "investigate", or "report on".
---

# Deep Researcher

Mastra-orchestrated, OMP-backed research pipeline for structured, citation-backed reports.

## Quick Start

```text
/skill:deep-researcher <topic>
/skill:deep-researcher <topic> --depth quick|deep
/skill:deep-researcher <topic> --format brief|full|academic
```

Arguments after the command are parsed as:

- First positional argument: research topic (required)
- `--depth`: **deep** (default — Mastra workflow + OMP ACP stages, discovery-first planning, parallel foreach research, reviews, repair, archive) or **quick** (3 grounded sub-questions, faster source target)
- `--format`: brief (summary only), full (default), academic (formal citations)

## Canonical Runner

For `deep`, run the deterministic Mastra + OMP ACP runner when available:

```bash
bun run research -- --topic "<topic>" --depth deep --format <format>
```

Canonical `deep` runs use the Mastra + OMP ACP runner and must not be manually approximated by ad-hoc prompts if the runner is available. OMP still owns model/tool execution through `omp acp`; Mastra owns stage order, typed handoffs, concurrency, review gates, repair, final audit, and archive writing.

## Pipeline

Execute these stages in order:

1. **Discovery Scan** — Run neutral discovery queries before planning. Extract entities and dimensions only from observed search/read evidence.
2. **Evidence-Grounded Plan** — Build sub-questions only from `DiscoveryMap.entities` and `DiscoveryMap.dimensions`.
3. **Parallel Mastra foreach Research over OMP ACP** — Fan out one typed OMP ACP researcher per sub-question with concurrency 4.
4. **Draft Synthesis** — Write only from the discovery map and researcher findings.
5. **Coverage Review** — Fail missing high-signal entities/dimensions or thin Tier A/B coverage.
6. **Bias Review** — Fail incumbent/vendor/model-prior overrepresentation relative to discovery.
7. **Citation Audit** — Fail uncited claims, absent source IDs, and unread/failed sources.
8. **One Repair Round** — Address only failed reviewer actions with targeted search/read evidence.
9. **Final Audit** — Run deterministic citation checks and source-minimum gates.
10. **Archive** — Save Markdown under `researches/YYYY-MM-DD-<topic-slug>.md`.

Present the discovery map and evidence-grounded plan before research dispatch; planning before discovery is non-compliant for deep.

## Depth Controls

- **Quick**: exactly 3 sub-questions, minimum 5 sources, single workflow path without manual task fan-out.
- **Deep**: 6–8 sub-questions, minimum 30 sources, full-source reads, at least one refinement round per researcher, review gates, and one repair round.

If the minimum source count cannot be met after the workflow exhausts searches, disclose the shortfall in **Knowledge Gaps**, lower affected confidence grades, and keep `Review status: passed_with_disclosed_gaps` unless deterministic citations fail.

## Fallback / Manual Mode

Use the project `researcher` task agent only when the Mastra + OMP ACP runner is unavailable or for ad-hoc subquestion investigation. In fallback mode, preserve discovery-first planning: do a neutral discovery scan before creating sub-questions, and do not name entities absent from the discovery evidence.

## Critical Rules

1. **Discovery first** — `deep` no longer plans from model priors.
2. **Cite everything** — Every factual claim must link to a source.
3. **Evaluate before trusting** — No source is used without tier and score.
4. **Synthesize, don't summarize** — Cross-reference, identify agreements/conflicts/gaps.
5. **Declare confidence** — Every conclusion gets a grade with reasoning.
6. **Validate the plan** — Every named entity in a subquestion must appear in `DiscoveryMap.entities`.
7. **Keep OMP as runtime substrate** — OMP ACP agents use OMP auth, Codex subscription, `web_search`, and `read`.
8. **Save final report to `researches/`** — Archive before summarizing to the user.

Output format details: see [output-format.md](references/output-format.md).
Source quality details: see [source-quality.md](references/source-quality.md).
