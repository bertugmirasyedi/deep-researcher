# Architecture

## System Overview

Deep Researcher is a **context-and-skills pack** for pi-coding-agent — not a standalone application. The skill defines a pipeline-based research workflow; Orca orchestration handles parallel `researcher` worker dispatch; Linear handles durable per-run intent for deep/standard runs.

```
                            ┌──────────────────────────────────────────────┐
┌─────────┐    ┌──────────┐ │ researcher-sq1  ─ Search + Evaluate ─┐     │  ┌──────────┐
│  Topic  │───>│ Planner  │ │ researcher-sq2  ─ Search + Evaluate ─┤     │──>│ Writer   │
│ (input) │    │ (main)   │ │ researcher-sq3  ─ Search + Evaluate ─┤ ... │  │ (main)   │
└─────────┘    └──────────┘ │ researcher-sqN  ─ Search + Evaluate ─┘     │  └──────────┘
                    │        └──────────────────────────────────────────────┘        │
                    v                  ‖ parallel ‖                             v
              Sub-questions         Scored sources + trust grades          Final report
              + strategy            (per sub-question, merged)              → researches/
```

## Pipeline Stages

### 1. Planner (main planner pi)

**Input**: User topic + depth/flags
**Output**: Ordered list of sub-questions + Orca dispatch map

- Decomposes topic into 3–8 researchable sub-questions
- Identifies likely source types per sub-question (academic, news, technical, etc.)
- Determines search breadth based on `--depth` flag
- Produces dispatch map: one `researcher` worker per sub-question

### 2. Researcher Subagents (Orca workers)

**Input**: One sub-question + search strategy (seeded from dispatch map)
**Output**: Scored, tiered sources for that sub-question

Each `researcher` subagent runs in a separate Orca worker terminal with its system prompt set to [`.pi/agents/researcher.md`](.pi/agents/researcher.md) (loaded via `--system-prompt`). Workers are dispatched via `orca orchestration task-create` + `dispatch --inject`; all execute in parallel. Each worker performs both search and evaluation for its assigned sub-question:

- **Search** — Executes multi-query searches (2–4 varied queries), extracts readable content from URLs, collects source metadata (author, date, domain, type)
- **Evaluate** — Applies source-quality tiers (see [docs/source-quality.md](docs/source-quality.md)), deduplicates across sources, flags conflicting information, assigns credibility and recency scores

The coordinator collects results from `worker_done` messages (not a worker join) and merges them back in the main planner.

### 3. Writer (main planner pi)

**Input**: Merged scored sources from all researcher workers + sub-questions + original topic
**Output**: Structured report

- Synthesizes across sources (not just summarizes)
- Identifies agreements, conflicts, and knowledge gaps
- Assigns confidence grades to conclusions
- Formats per requested output style (see [docs/output-format.md](docs/output-format.md))

## Data Flow

```
User Topic
  → Planner (sub-questions[] + Orca dispatch map)
    → researcher-sq1 ‖ researcher-sq2 ‖ … ‖ researcher-sqN  (parallel Orca workers: Search + Evaluate)
      → scored_sources[] (merged from worker_done payloads in main planner)
        → Writer (report → researches/)
```

Each stage emits structured data consumed by the next. Stages do not reach backward.

## Worker isolation envelope

Researcher workers are launched with an **isolation envelope** that prevents prompt bleed from the planner's full coding-agent context. Stock pi has no built-in `.pi/agents/*.md` loader — the upstream `subagent` extension that provides this is not installed. Without the envelope, a worker launched as bare `ORCA_ROLE=worker pi` would inherit:

- The default coding-agent system prompt ("edit code, write new files")
- `~/.pi/agent/APPEND_SYSTEM.md` (auto-discovered)
- Every `AGENTS.md` in the chain
- All discovered skills — including `deep-researcher` itself, which would recursively dispatch more workers
- All extensions and prompt templates
- All default tools (`edit`, `write`, `bash`, `process`, …) regardless of `researcher.md` frontmatter

### Loading mechanism

The flag `--system-prompt /abs/path/to/researcher.md` **replaces** (not appends) the default coding prompt with the contents of `researcher.md`. The YAML frontmatter at the top of `researcher.md` is documentary — the planner mirrors it into explicit flags (`--model`, `--thinking`, `--tools`) by hand. The frontmatter text appears verbatim in the system prompt; this is a known cosmetic bleed and is acceptable.

### Isolation flags

| Flag | Purpose |
|------|----------|
| `--system-prompt /abs/path/researcher.md` | Replace the default coding prompt. `researcher.md` becomes the entire system prompt. |
| `--append-system-prompt /dev/null` | Disables auto-discovery of `~/.pi/agent/APPEND_SYSTEM.md`. |
| `--no-context-files` | Drops the `AGENTS.md` chain. |
| `--no-skills` | Drops the `deep-researcher` skill (prevents recursion). |
| `--no-prompt-templates` | Closes prompt-template context-leak surface. |
| `--no-extensions --extension /opt/homebrew/lib/node_modules/pi-web-access/index.ts` | Disables global extension auto-discovery, then explicitly re-enables `pi-web-access` so the worker has `web_search` and `fetch_content` (which are not built-in pi tools). Verified at `pi-coding-agent/dist/core/resource-loader.js:271–273`. |
| `--tools read,grep,find,ls,web_search,fetch_content,bash` | Enforces the read-only contract that `researcher.md` frontmatter only suggests. |
| `--model zai/glm-5.1 --thinking high` | Mirrors `researcher.md` frontmatter (keep in sync). |

### Bash carve-out

`bash` is whitelisted in `--tools` **only** so the worker can call `orca orchestration send --type worker_done` (and `linear issue show` if the dispatch preamble references the issue). The per-task preamble explicitly instructs the worker: *use bash only for orchestration/Linear CLIs, not for file mutation*. All other worker tooling is read-only.

> **Lifecycle**: The worker terminal stays alive after `worker_done`; the planner closes it explicitly with `orca terminal close`.

### Environment-dependent path

The `--extension` path `/opt/homebrew/lib/node_modules/pi-web-access/index.ts` is specific to this machine's npm global install. If the package was installed differently (e.g., via a different package manager or a custom prefix), the path will differ. Run `pi list` or `npm root -g` to find the correct path for your environment.

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pipeline model | Main planner pi → Orca worker fan-out (researcher per SQ) → main planner pi writes | Planner and Writer run in the main pi process; researcher subagents run as isolated Orca worker terminals |
| Multi-query search | 2–4 queries per sub-question per researcher worker | Varying phrasing maximizes source coverage |
| Source evaluation | Explicit quality tiers inside each researcher worker | Prevents low-quality sources from polluting synthesis |
| Confidence grading | Three-tier (high/medium/low) | Simple, actionable, avoids false precision |

Full decision log: [docs/decisions.md](docs/decisions.md)

## Technology Choices

| Area | Choice | Why |
|------|--------|-----|
| Runtime | pi-coding-agent | Agent orchestration, tool access, skill system |
| Parallel execution | Orca orchestration + worker terminals with isolation envelope (`--system-prompt researcher.md`, `--no-context-files`, `--no-skills`, etc.) | Each researcher worker is a sealed process whose system prompt is `researcher.md`; context leak is blocked by the isolation flags |
| Per-run intent | Linear issue (always for `deep`, recommended for `standard`) | Sub-questions become checklist items; durable across sessions; supersedes `progress.md`/`features.json` |
| Search | web_search tool (multi-query) | Requires installed search skill or extension; not a stock pi tool |
| Content extraction | fetch_content tool | Requires installed content skill or extension; not a stock pi tool |
| Output | Markdown | Universal, versionable, human-readable, archived under `researches/` |

> **Note**: Orca orchestration and the Linear CLI are required for this skill. The search/content tools (`web_search`, `fetch_content`) come from installed pi skills/extensions and are not built into stock pi.
