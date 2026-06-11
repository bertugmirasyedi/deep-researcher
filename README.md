# Deep Researcher

A **context-and-skills pack** for [pi-coding-agent](https://github.com/MarioZechner/pi-coding-agent) that produces structured, citation-backed research reports. No application code — just a skill definition, pipeline docs, and quality standards.

## What It Does

Given a research topic, the deep-researcher skill guides the agent to:

1. **Plan** — Decompose the topic into researchable sub-questions
2. **Search** — Query multiple sources (web, academic, news, technical docs)
3. **Evaluate** — Apply credibility scoring and source-quality tiers
4. **Synthesize** — Cross-reference findings, identify agreements/conflicts/gaps
5. **Report** — Produce a structured report with citations and confidence grades

For `deep` research, sub-questions are searched in parallel by **`researcher` subagents** running in dedicated Orca worker terminals, dispatched via `orca orchestration`; each worker reads full source content and runs at least one refinement round. Multi-session research is tracked with a per-run **Linear issue**.

## Usage

Inside **pi** interactive mode:

```
/skill:deep-researcher "impact of RISC-V on embedded systems"
/skill:deep-researcher "quantum error correction" --depth deep --format academic
```

### Options

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--depth` | `quick`, `deep` | `deep` | `quick` = fast snippet scan (min 5 sources, inline). `deep` = parallel workers + required full-text reads + ≥1 refinement round (min 30 sources). |
| `--format` | `brief`, `full`, `academic` | `full` | Output report format |

## Documentation

| Document | Purpose |
|----------|---------|
| [AGENTS.md](AGENTS.md) | Agent context map — start here |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Pipeline design and orchestration |
| [docs/research-workflow.md](docs/research-workflow.md) | Step-by-step research pipeline |
| [docs/source-quality.md](docs/source-quality.md) | Source credibility scoring |
| [docs/output-format.md](docs/output-format.md) | Report structure and citation format |
| [docs/decisions.md](docs/decisions.md) | Design decisions and rationale |
| [docs/exec-plans/README.md](docs/exec-plans/README.md) | Execution plans index |
| [researches/README.md](researches/README.md) | Report archive — naming convention and structure |
| [.pi/agents/researcher.md](.pi/agents/researcher.md) | Project-level `researcher` subagent definition |

## Report Archive

Final reports are saved as Markdown files under `researches/` with the naming convention `YYYY-MM-DD-<topic-slug>.md`. See [researches/README.md](researches/README.md) for details.

## Status

Skills-and-docs pack — functional as a pi skill. No build step or application code needed.
