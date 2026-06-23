# AGENTS.md

## Project

Deep Researcher is a **context-and-skills pack** for **Oh My Pi (`omp`)**. It provides a research skill, a project `researcher` task-agent prompt, pipeline documentation, and quality standards — no application code.

The heavy lifting is done by OMP-native tools:

- **`task`** — parallel `researcher` subagent dispatch for `deep` research
- **`web_search`** — live source discovery
- **`read`** — local file reads and full-text URL/document extraction
- **`agent://` / `history://`** — worker output and transcript recovery when needed

## Quick Start

Inside **omp** interactive mode:

```text
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
| Researcher agent | [.omp/agents/researcher.md](.omp/agents/researcher.md) | Project-level OMP task agent for sub-question research |
| Deep Researcher skill | [.omp/skills/deep-researcher/SKILL.md](.omp/skills/deep-researcher/SKILL.md) | Skill entry point and workflow contract |

## Orchestration with OMP task agents

**Parallel execution is the default for `deep`.** Spawn one OMP `researcher` task agent per sub-question in a single `task` batch. Each worker runs Search + Evaluate for its sub-question, reads full source text with `read <url>`, runs at least one refinement round, and returns structured findings.

1. **Plan** in the main OMP session — decompose topic, produce sub-questions + dispatch map
2. **Dispatch** OMP task agents — one `researcher` worker per sub-question
3. **Collect** task outputs / `agent://` artifacts and synthesize the final report, saved under `researches/`

> Single-threaded execution is the **exception**, reserved for `quick` depth only.

## Tracking and artifacts

Do **not** create per-run Linear issues for research. Research-run state lives in:

- the active OMP session and `task` results
- `agent://<id>` worker output artifacts when inline output is truncated
- `history://<id>` transcripts when debugging or auditing worker behavior
- the final archived Markdown report under `researches/`

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
