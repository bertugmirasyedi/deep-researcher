# AGENTS.md

## Project

Deep Researcher is a **Mastra workflow runner plus context-and-skills pack** for **Oh My Pi (`omp`)**. It provides a deterministic research runner, an OMP-facing research skill, a fallback project `researcher` task-agent prompt, pipeline documentation, and quality standards.

The heavy lifting is split between:

- **Mastra Workflows** — deterministic stage order, typed handoffs, workflow state, foreach concurrency, parallel review gates, repair, final audit, and archiving
- **OMP ACP (`omp acp`)** — model/tool execution through OMP auth, the user's Codex subscription, OMP `web_search`, and OMP `read`
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
|Fallback researcher agent|[.omp/agents/researcher.md](.omp/agents/researcher.md)|Fallback/manual OMP task agent|
|Deep Researcher skill|[.omp/skills/deep-researcher/SKILL.md](.omp/skills/deep-researcher/SKILL.md)|Skill entry point and workflow contract|

## Orchestration with Mastra + OMP ACP

**Discovery-first execution is mandatory for canonical `deep`.** The runner performs:

1. **Discovery Scan** — neutral search/read evidence before planning
2. **Evidence-Grounded Plan** — subquestions validated against `DiscoveryMap.entities` and `DiscoveryMap.dimensions`
3. **Parallel Research** — Mastra `foreach` runs OMP ACP researchers with concurrency 4
4. **Draft + Reviews** — writer plus parallel coverage, bias, and citation gates
5. **Repair + Final Audit** — one targeted repair round, deterministic citation audit, archive write

The fallback `.omp/agents/researcher.md` task-agent flow is reserved for runner-unavailable/manual investigations and must still honor DiscoveryMap grounding when supplied.

## Tracking and artifacts

Do **not** create per-run Linear issues for research. Research-run state lives in:

- the active OMP session and runner output
- Mastra workflow state during execution
- `agent://<id>` worker output artifacts when fallback/manual OMP task mode is used
- `history://<id>` transcripts when debugging or auditing fallback workers
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
