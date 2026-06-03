---
name: deep-researcher
description: Produce a structured, citation-backed research report on a topic. Use when the user explicitly asks to research a topic, produce a research report, or do a deep dive on a subject. Triggers include "research", "deep dive", "research report", "investigate", or "report on".
---

# Deep Researcher

Multi-source research pipeline that produces structured, citation-backed reports.

## Quick Start

```
/skill:deep-researcher <topic>
/skill:deep-researcher <topic> --depth shallow|standard|deep
/skill:deep-researcher <topic> --format brief|full|academic
```

Arguments after the command are parsed as:
- First positional argument: research topic (required)
- `--depth`: shallow (3 sub-Qs, fast), standard (5 sub-Qs, thorough), deep (7–8 sub-Qs, comprehensive)
- `--format`: brief (summary only), full (default), academic (formal citations)

## Pipeline

The research follows four sequential stages. Execute them in order.

> **Required orchestration**: For `standard` and `deep` research, Stages 2–3 (Search + Evaluate) **must** be parallelised by dispatching one **Orca worker terminal** per sub-question via `orca orchestration`. Each worker runs `ORCA_ROLE=worker pi` with its system prompt set to `.pi/agents/researcher.md` (loaded via `--system-prompt`) to handle Search + Evaluate for its assigned sub-question. Single-threaded execution (researcher agent runs inline in the planner pi) is **only** for `shallow` depth. The `researcher.md` file itself is unchanged — only the dispatch envelope changes.

### Stage 1: Plan

Decompose the topic into 3–8 sub-questions:

1. Identify the core question and its key dimensions
2. Generate focused, researchable sub-questions
3. Order by importance (foundational first)
4. Assign expected source types per sub-question

Depth controls:
- **Shallow**: 3 sub-questions, 2 searches each, **minimum 5**, target 5–8 sources
- **Standard**: 5 sub-questions, 3 searches each, **minimum 10**, target 10–15 sources
- **Deep**: 7–8 sub-questions, 4 searches each, **minimum 200**, target 200–300 sources

If the minimum source count for the selected depth cannot be met after all searches are exhausted, the report must disclose this in **Knowledge Gaps** and every affected conclusion must have its confidence grade lowered and justified.

### Worker Dispatch Plan

As part of the plan, produce a dispatch map:

```
Worker terminal   Sub-question    Searches
researcher-sq1    SQ1: <title>    3
researcher-sq2    SQ2: <title>    3
researcher-sq3    SQ3: <title>    3
...
```

Present the full plan (sub-questions + dispatch map) to the user before proceeding.

### Stage 2: Search

**Parallel execution is the default for standard and deep research.** Dispatch one Orca worker terminal per sub-question. Each worker runs `ORCA_ROLE=worker pi` with the isolation envelope (see snippet below). The worker's system prompt **is** `.pi/agents/researcher.md`, loaded via `--system-prompt`; the worker is not 'told to activate' an agent — pi has no such mechanism, so the agent file is wired in as the system prompt directly. Workers run Stages 2–3 (Search + Evaluate) for their assigned sub-question independently. Workers report back via `orca orchestration send --type worker_done` with a JSON payload containing scored sources and credibility tiers. The planner collects all findings and proceeds to Stage 4 (Write).

```bash
# Orca worker dispatch loop (planner side)
HANDLES=()
for i in 1 2 3; do
  TASK=$(orca orchestration task-create \
    --spec "Search + Evaluate SQ${i}: <sub-question>. The worker's system prompt is .pi/agents/researcher.md (loaded via --system-prompt). Use bash only for orchestration/Linear CLIs, not for file mutation." \
    --json)
  TASK_ID=$(echo "$TASK" | jq -r '.result.task.id')

  # Per-sub-question worker dispatch.
  # Matches the standard Orca worker dispatch pattern in orca-linear-workflow:
  # interactive pi → wait for tui-idle → dispatch --inject → wait for worker_done.
  # What's different here: the isolation envelope flags after `pi` make this worker
  # a sealed Researcher process instead of a full coding agent.
  # --model and --thinking keep in sync with .pi/agents/researcher.md frontmatter.
  HANDLE=$(orca terminal create \
    --worktree active \
    --title "researcher-sq${i}" \
    --command "ORCA_ROLE=worker pi --system-prompt /Users/bertugmirasyedi/projects/deep-researcher/.pi/agents/researcher.md --append-system-prompt /dev/null --no-context-files --no-skills --no-prompt-templates --no-extensions --extension /opt/homebrew/lib/node_modules/pi-web-access/index.ts --tools read,grep,find,ls,web_search,fetch_content,bash --model zai/glm-5.1 --thinking high" \
    --json | jq -r '.result.terminal.handle')
  HANDLES+=("$HANDLE")

  orca terminal wait --terminal "$HANDLE" --for tui-idle --timeout-ms 60000 --json

  orca orchestration dispatch --task "$TASK_ID" --to "$HANDLE" --inject --json
done

# Wait for all workers to finish
orca orchestration check --wait \
  --types worker_done,escalation \
  --timeout-ms 600000 --json

# Close terminals after collection
for h in "${HANDLES[@]}"; do
  orca terminal close --terminal "$h" --json
done
```

> Single-threaded (sequential) search is **only** for `shallow` depth — run the researcher agent inline in the planner pi.

**Why `bash` is in the tools allowlist**: `bash` is whitelisted only so the worker can call `orca orchestration send --type worker_done` (and `linear issue show` if the dispatch preamble references the issue). The per-task preamble explicitly instructs the worker not to use `bash` for file mutation, code editing, or any other mutation operation. All research-worker tooling is read-only (`read`, `grep`, `find`, `ls`, `web_search`, `fetch_content`).

The envelope uses `--no-extensions` to disable global extension auto-discovery, then re-enables `pi-web-access` explicitly via `--extension`. Without this, the worker has no `web_search` or `fetch_content` because they are not built-in pi tools. Adjust the path if your install differs (run `pi list` or `npm root -g` to find it).

Each `researcher` subagent performs these steps internally:

1. Craft 2–4 queries per sub-question with varied phrasing
   - Vary scope (broad → specific)
   - Vary angle (technical → business → social)
   - Vary recency (historical → recent)
2. If a search/content tool (`web_search`, `fetch_content`, etc.) is available, use it for live web research. If no search tool is installed, rely on user-provided sources, local files, and the agent's training knowledge — but **never fabricate citations**; state explicitly which claims lack verifiable sources.
3. Use content-fetching tools for the most promising URLs (if available)
4. Collect metadata: author, date, domain, publication type, URL

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

1. **Parallel execution is the default** — For `standard` and `deep` research, always dispatch Orca worker terminals (one per sub-question) via `orca orchestration`. Each worker runs `ORCA_ROLE=worker pi` with its system prompt set to `.pi/agents/researcher.md` (loaded via `--system-prompt`) and handles Search + Evaluate for its assigned sub-question. Single-threaded execution is only for `shallow` depth.
2. **Cite everything** — Every factual claim must link to a source
3. **Evaluate before trusting** — No source is used without quality scoring
4. **Synthesize, don't summarize** — Cross-reference, identify agreements/conflicts/gaps
5. **Declare confidence** — Every conclusion gets a grade with reasoning
6. **Present the plan first** — Show the research plan (including worker dispatch map) and get implicit/explicit go-ahead before searching
7. **Create a Linear issue for tracking** — **Always** for `deep` runs, **recommended** for `standard` runs, **skip** for `shallow`. Use `linear issue update <id> --check ...` against sub-question checklist items as workers complete. The Linear issue provides durable intent across sessions.
8. **Enforce minimum source counts** — Each depth level has a minimum (shallow: 5, standard: 10, deep: 200). If unmet, disclose in Knowledge Gaps and lower/justify confidence on affected conclusions
9. **Save final report to `researches/`** — After synthesis, write the Markdown report to `researches/YYYY-MM-DD-<topic-slug>.md` before summarizing to the user

## Decision Log

For non-obvious choices made during research (e.g., excluding a source, resolving a conflict), note them inline or append to the repo decision log at [docs/decisions.md](../../../docs/decisions.md).
