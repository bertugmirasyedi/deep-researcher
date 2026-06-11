# AGENTS.md

## Project

Deep Researcher is a **context-and-skills pack** for [pi-coding-agent](https://github.com/MarioZechner/pi-coding-agent). It provides a research skill, pipeline documentation, and quality standards — no application code. The heavy lifting (parallel execution, progress tracking) is done by two tools:

- **Orca orchestration** — `orca orchestration` task DAG + Orca worker terminals for parallel `researcher` subagent dispatch
- **Linear** — durable per-run intent for `deep` runs (always; skipped for `quick`)

## Quick Start

Inside **pi** interactive mode:

```
/skill:deep-researcher <topic>
/skill:deep-researcher <topic> --depth quick|deep
/skill:deep-researcher <topic> --format brief|full|academic
```

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for pipeline stages and data flow.

**Key constraint**: Every factual claim in output must trace to a cited source.

## Navigation

| Area | Location | Description |
|------|----------|-------------|
| Research workflow | [docs/research-workflow.md](docs/research-workflow.md) | Pipeline: plan → search → evaluate → synthesize |
| Source quality | [docs/source-quality.md](docs/source-quality.md) | Trust tiers, credibility scoring, source selection |
| Output format | [docs/output-format.md](docs/output-format.md) | Report structure, citation format, confidence grades |
| Decisions log | [docs/decisions.md](docs/decisions.md) | Design decisions with rationale |
| Execution plans | [docs/exec-plans/README.md](docs/exec-plans/README.md) | Active/completed plans, tech debt tracker |
| Report archive | [researches/README.md](researches/README.md) | Saved research reports (`YYYY-MM-DD-<slug>.md`) |
| Researcher agent | [.pi/agents/researcher.md](.pi/agents/researcher.md) | Project-level researcher subagent dispatched as an Orca worker terminal |

## Orchestration with Orca workers

**Parallel execution is the default.** Dispatch one Orca worker terminal per sub-question via `orca orchestration task-create` + `dispatch --inject`. Each worker runs `ORCA_ROLE=worker pi` using the `researcher` agent at `.pi/agents/researcher.md`. The coordinator (planner) waits for `worker_done` payloads via `orca orchestration check --wait --types worker_done,escalation`.

1. **Plan** in coordinator — decompose topic, produce sub-questions + dispatch map
2. **Dispatch** Orca worker terminals — each runs Search + Evaluate for its sub-question
3. **Collect** findings from `worker_done` payloads and synthesize into the final report, saved under `researches/`

> Single-threaded execution is the **exception**, reserved for `quick` depth only.

## Tracking with Linear

Use **Linear issues** to track research runs:

- **`deep`** — always create a Linear issue. **`quick`** — skip.
- Issue body should contain: topic, sub-questions as checklist (one per SQ), dispatch map, source-count target, final report path placeholder.
- As workers complete, `linear issue update <id> --check "..."` ticks each sub-question.
- Final report path is recorded in a Linear comment when archived under `researches/`.

## Critical Rules

1. **Cite everything** — Every factual claim must link to a verifiable source.
2. **Evaluate before trusting** — Apply source-quality tiers before including any source.
3. **Synthesize, don't summarize** — Cross-reference findings; identify agreements, conflicts, gaps.
4. **Declare confidence** — Every conclusion gets a confidence grade (high / medium / low).
5. **Log decisions** — Non-obvious choices go into [docs/decisions.md](docs/decisions.md).
6. **Archive reports** — Save final report to `researches/` before summarizing to the user.

## How to Work in This Repo

1. **Read this file first** — it's the map
2. **Follow pointers** — each doc owns its domain; don't duplicate
3. **Use the skill** — `/skill:deep-researcher` loads the full workflow
4. **Keep docs in sync** — if a change invalidates a doc, fix both in the same commit
5. **Keep AGENTS.md lean** — if this file exceeds ~100 lines, extract to `docs/`
