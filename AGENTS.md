# AGENTS.md

## Project

Deep Researcher is a **Mastra workflow runner plus context-and-skills pack** for **Oh My Pi (`omp`)**. It provides a deterministic CLI research runner, a prompt-orchestrated OMP TUI skill, stage-specific project agents, pipeline documentation, and quality standards.

The heavy lifting is split between:

- **Mastra Workflows** — deterministic stage order, typed handoffs, workflow state, foreach concurrency, parallel review gates, repair, final audit, and archiving
- **OMP ACP (`omp acp`)** — model/tool execution through OMP auth, the user's Codex subscription, OMP `web_search`, and OMP `read`
- **OMP TUI task agents** — prompt-driven stage execution mirroring the Mastra graph through named `.omp/agents/` roles
- **TypeScript/Zod** — schemas, discovery-plan validation, source thresholds, citation audit, and fixture regression tests

## Quick Start

Inside **omp** interactive mode:

```text
/skill:deep-researcher <topic>
/skill:deep-researcher <topic> --depth quick|deep
/skill:deep-researcher <topic> --format brief|full|academic
```

Canonical runner:

```bash
bun install
bun test
bun run typecheck
bun run research -- --topic "<topic>" --depth deep --format full
```

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for pipeline stages and data flow.

**Key constraint**: Every factual claim in output must trace to a cited source.

## Navigation

|Area|Location|Description|
|---|---|---|
|Research workflow|[docs/research-workflow.md](docs/research-workflow.md)|Discovery-first pipeline through final audit/archive|
|Source quality|[docs/source-quality.md](docs/source-quality.md)|Trust tiers, credibility scoring, source selection|
|Output format|[docs/output-format.md](docs/output-format.md)|Report structure, citation format, confidence grades|
|Decisions log|[docs/decisions.md](docs/decisions.md)|Design decisions with rationale|
|Execution plans|[docs/exec-plans/README.md](docs/exec-plans/README.md)|Active/completed plans, tech debt tracker|
|Report archive|[researches/README.md](researches/README.md)|Saved research reports (`YYYY-MM-DD-<slug>.md`)|
|Research runner|[src/research-runner/](src/research-runner/)|Mastra + OMP ACP TypeScript runner|
|OMP TUI stage agents|[.omp/agents/](.omp/agents/)|Named discovery, planning, research, writing, review, repair, and finalization roles|
|Deep Researcher skill|[.omp/skills/deep-researcher/SKILL.md](.omp/skills/deep-researcher/SKILL.md)|Interactive TUI orchestration contract|

## Orchestration Paths

The project has two distinct execution paths:

1. **CLI: Mastra + OMP ACP** — the reproducible runner owns deterministic stage
   order, typed Zod handoffs, concurrency, adaptive review, final audit, and
   archive.
2. **OMP TUI: prompt-orchestrated stage agents** — the `deep-researcher` skill
   keeps the main TUI agent as coordinator and dispatches matching named agents
   from `.omp/agents/`. Explicit JSON contracts and coordinator validation mimic
   the Mastra graph without claiming Mastra execution.

Both paths require discovery before planning, 3 quick or 6–8 deep subquestions,
research concurrency capped at four, parallel coverage/bias/citation gates, one
bounded adaptive round, citation audit, and archive.

## Tracking and artifacts

Do **not** create per-run Linear issues for research. Research-run state lives in:

- the active OMP session and runner output
- Mastra workflow state during CLI execution
- transient `local://` handoffs during interactive TUI execution
- `agent://<id>` stage outputs and `history://<id>` transcripts
- the final archived Markdown report under `researches/`

## Critical Rules

1. **Discovery first** — canonical `deep` does not plan from model priors.
2. **Cite everything** — Every factual claim must link to a verifiable source.
3. **Evaluate before trusting** — Apply source-quality tiers before including any source.
4. **Synthesize, don't summarize** — Cross-reference findings; identify agreements, conflicts, gaps.
5. **Declare confidence** — Every conclusion gets a confidence grade (high / medium / low).
6. **Validate plans** — Subquestions may only name entities present in `DiscoveryMap.entities`.
7. **Log decisions** — Non-obvious choices go into [docs/decisions.md](docs/decisions.md).
8. **Archive reports** — Save final report to `researches/` before summarizing to the user.

## How to Work in This Repo

1. **Read this file first** — it's the map
2. **Follow pointers** — each doc owns its domain; don't duplicate
3. **Use the skill** — `/skill:deep-researcher` loads the full workflow
4. **Keep docs in sync** — if a change invalidates a doc, fix both in the same commit
5. **Keep AGENTS.md lean** — if this file exceeds ~100 lines, extract to `docs/`
