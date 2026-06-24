# Deep Researcher

A **Mastra workflow runner plus OMP skill wrapper** that produces structured, citation-backed research reports.

## What It Does

Given a research topic, Deep Researcher runs a discovery-first workflow:

1. **Discovery Scan** — Neutral queries surface observed entities, dimensions, sources, and gaps.
2. **Evidence-Grounded Plan** — Sub-questions may only name entities present in the DiscoveryMap.
3. **Parallel Research** — Mastra `foreach` fans out OMP ACP researchers with concurrency 4.
4. **Draft Synthesis** — Writer uses only DiscoveryMap and findings.
5. **Review Gates** — Coverage, bias, and citation reviewers run in parallel.
6. **Adaptive Review Control** — A controller chooses finalize, targeted repair, additional research, or replan, bounded by `maxReviewRepairRounds`.
7. **Final Audit + Archive** — Deterministic citation checks and source-minimum gates write `researches/YYYY-MM-DD-<topic-slug>.md`.

The runner uses OMP ACP (`omp acp`) so model/tool execution stays inside OMP and can use the user's Codex subscription, OMP auth, `web_search`, and `read`. Post-review control is agent-mediated but bounded by `maxReviewRepairRounds` and deterministic Zod validation.

## Setup

```bash
bun install
bun test
bun run typecheck
bun run dev
```

## Usage

Inside **omp** interactive mode:

```text
/skill:deep-researcher "impact of RISC-V on embedded systems"
/skill:deep-researcher "quantum error correction" --depth deep --format academic
```

Canonical `deep` runner command:

```bash
bun run research -- --topic "latest agentic frameworks" --depth deep --format full
```

Fixture regression command, no live model or network required:

```bash
bun run research -- --fixture agent-frameworks --topic "latest agentic frameworks" --depth deep --format full
```

Mastra Studio:

```bash
bun run dev
```

Then open `http://localhost:4112/`. The registered workflow is `deepResearch` (`deep-researcher-mastra-omp-acp`).

Studio fixture input:

```text
Topic: latest agentic frameworks
Date Iso: 2026-06-24T00:00:00.000Z
Fixture: agent-frameworks
```

Leave `Fixture` empty for a live OMP ACP run. The Run button requires at least `Topic`; otherwise Studio marks the field required and does not start a run.

### Options

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--depth` | `quick`, `deep` | `deep` | `quick` = 3 grounded sub-questions, min 5 sources. `deep` = discovery-first workflow, 6–8 sub-questions, full reads, refinement, review gates, min 30 sources. |
| `--format` | `brief`, `full`, `academic` | `full` | Output report format |
| `--fixture` | fixture name | none | Test fixture mode; avoids OMP ACP, network, and model calls |

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
| [.omp/agents/researcher.md](.omp/agents/researcher.md) | Fallback `researcher` task-agent definition |

## Report Archive

Final reports are saved as Markdown files under `researches/` with the naming convention `YYYY-MM-DD-<topic-slug>.md`. See [researches/README.md](researches/README.md) for details.

## Status

Functional Mastra + OMP ACP research runner with OMP-facing skill wrapper and fixture regression tests.
