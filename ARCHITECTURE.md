# Architecture

## System Overview

Deep Researcher is a **context-and-skills pack** for **Oh My Pi (`omp`)** — not a standalone application. The skill defines a pipeline-based research workflow; OMP's `task` tool handles parallel `researcher` subagent dispatch; OMP `read` handles both local files and full-text URL extraction; `web_search` handles source discovery.

```text
                            ┌──────────────────────────────────────────────┐
┌─────────┐    ┌──────────┐ │ ResearcherSQ1 ─ Search + Evaluate ─┐       │  ┌──────────┐
│  Topic  │───>│ Planner  │ │ ResearcherSQ2 ─ Search + Evaluate ─┤       │──>│ Writer   │
│ (input) │    │ (main)   │ │ ResearcherSQ3 ─ Search + Evaluate ─┤  ...  │  │ (main)   │
└─────────┘    └──────────┘ │ ResearcherSQN ─ Search + Evaluate ─┘       │  └──────────┘
                    │        └──────────────────────────────────────────────┘        │
                    v                  ‖ parallel task agents ‖                v
              Sub-questions         Scored sources + trust grades          Final report
              + strategy            (per sub-question, merged)              → researches/
```

## Pipeline Stages

### 1. Planner (main OMP session)

**Input**: User topic + depth/flags  
**Output**: Ordered list of sub-questions + task dispatch map

- Decomposes topic into 3–8 researchable sub-questions
- Identifies likely source types per sub-question (academic, news, technical, etc.)
- Determines search breadth based on `--depth`
- Produces dispatch map: one `researcher` task agent per sub-question for `deep`

### 2. Researcher subagents (OMP task agents)

**Input**: One sub-question + search strategy (seeded from dispatch map)  
**Output**: Scored, tiered sources for that sub-question

Each `researcher` subagent is a project OMP task agent at [`.omp/agents/researcher.md`](.omp/agents/researcher.md). The planner dispatches workers with one `task` call using `agent: "researcher"` and a `tasks[]` batch. OMP creates child sessions, runs them in parallel under the session concurrency limit, and returns results as task outputs/artifacts.

Each worker performs both search and evaluation for its assigned sub-question:

- **Search** — Executes multi-query searches (2–4 varied queries), reads full source text from promising URLs with `read`, collects source metadata (author, date, domain, type)
- **Evaluate** — Applies source-quality tiers (see [docs/source-quality.md](docs/source-quality.md)), deduplicates across sources, flags conflicting information, assigns credibility and recency scores

The coordinator consumes the returned task outputs directly. Full worker output remains available through OMP internal URLs such as `agent://<id>` and transcripts through `history://<id>`.

### 3. Writer (main OMP session)

**Input**: Merged scored sources from all researcher workers + sub-questions + original topic  
**Output**: Structured report

- Synthesizes across sources (not just summarizes)
- Identifies agreements, conflicts, and knowledge gaps
- Assigns confidence grades to conclusions
- Formats per requested output style (see [docs/output-format.md](docs/output-format.md))
- Saves the final Markdown report under `researches/`

## Data Flow

```text
User Topic
  → Planner (sub-questions[] + OMP task dispatch map)
    → ResearcherSQ1 ‖ ResearcherSQ2 ‖ … ‖ ResearcherSQN  (parallel OMP task agents: Search + Evaluate)
      → scored_sources[] (merged from task outputs / agent:// artifacts)
        → Writer (report → researches/)
```

Each stage emits structured data consumed by the next. Stages do not reach backward.

## OMP task-agent isolation

Deep Researcher no longer shells out to Orca worker terminals and no longer depends on Linear for per-run state. Isolation now comes from OMP's task subsystem:

- Child sessions do **not** inherit conversation history.
- The project `researcher` agent declares its own system prompt and read-only tool surface.
- Worker outputs are captured as task results and `agent://` artifacts.
- Worker transcripts are inspectable through `history://<id>` when needed.
- Follow-up coordination, when needed, uses OMP `irc` to message an existing idle/parked agent rather than spawning an ad-hoc terminal.

The `researcher` tool surface is intentionally small: `read`, `search`, `find`, and `web_search`. URL full-text extraction uses `read <url>`; local text lookup uses OMP `search`; directory/file discovery uses `find` and `read` directory listings.

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pipeline model | Main OMP planner → OMP `task` fan-out (researcher per SQ) → main OMP writer | Planner and writer stay in the main session; researcher workers are isolated task subagents |
| Multi-query search | 2–4 queries per sub-question per researcher worker | Varying phrasing maximizes source coverage |
| Full-source reading | `read` on URLs for top results | OMP `read` already converts URLs, PDFs, docs, feeds, and HTML into readable text |
| Source evaluation | Explicit quality tiers inside each researcher worker | Prevents low-quality sources from polluting synthesis |
| Confidence grading | Three-tier (high/medium/low) | Simple, actionable, avoids false precision |

Full decision log: [docs/decisions.md](docs/decisions.md)

## Technology Choices

| Area | Choice | Why |
|------|--------|-----|
| Runtime | OMP | Agent orchestration, tool access, skill system, task subagents, internal artifacts |
| Parallel execution | OMP `task` batch with project `researcher` agent | Built-in child sessions replace Orca terminal orchestration and manual worker lifecycle management |
| Per-run state | OMP task outputs, `agent://`, `history://`, final report in `researches/` | Keeps research state inside the active OMP session and archived report; no per-run Linear issue required |
| Search | Built-in `web_search` | OMP provider chain covers multiple search backends |
| Content extraction | Built-in `read` on URLs/documents | Replaces legacy `fetch_content` extension dependency |
| Output | Markdown | Universal, versionable, human-readable, archived under `researches/` |
