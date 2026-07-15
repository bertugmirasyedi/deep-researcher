# Architecture

## System Overview

Deep Researcher has two execution paths over the same discovery-first research
contract:

1. **CLI runner** — Mastra owns deterministic orchestration and OMP ACP owns model
   authentication, Codex execution, `web_search`, and `read`.
2. **OMP TUI skill** — the main interactive agent owns prompt-driven orchestration
   and dispatches named stage agents from `.omp/agents/`.

```text
CLI: Topic -> Mastra graph -> OMP ACP stage agents -> deterministic audit -> archive
TUI: Topic -> OMP coordinator -> named task agents -> coordinator audit -> archive
```

Both paths follow discovery, grounded planning, research fan-out capped at four,
draft synthesis, parallel coverage/bias/citation gates, one bounded adaptive
round, final writing, citation audit, and archive.

## Responsibility Split

| Layer | Owner | Responsibilities |
|---|---|---|
| CLI control plane | Mastra Workflows | Stage order, typed handoffs, workflow state, foreach concurrency, parallel review fan-out, adaptive review loop, final audit/archive |
| CLI model/tool runtime | OMP ACP | OMP auth, Codex model execution, `web_search`, URL/document extraction through `read`, project/user context |
| TUI control plane | Main OMP agent + skill | Stage dispatch, JSON handoff validation, local state, bounded fan-out/repair, audit/archive |
| TUI stage runtime | Named `.omp/agents/` roles | Discovery, planning, research, writing, reviews, controller, repair/replan, final writing |
| Deterministic CLI guards | TypeScript | Zod schemas, discovery-plan validation, source thresholds, citation audit, archive path |

No Mastra supervisor LLM decides the whole workflow. Each step has an explicit schema and calls an OMP ACP agent for the model/tool work needed at that stage; post-review control is delegated to a bounded review controller and validated with Zod.

## Pipeline Stages

### 0. Discovery Scan

**Input**: User topic + depth/format/date  
**Output**: `DiscoveryMap`

- Builds neutral discovery queries from the topic and current year.
- Uses OMP `web_search` and `read` through ACP.
- Extracts entities and dimensions only from observed evidence.
- Records gaps before planning.

### 1. Evidence-Grounded Plan

**Input**: `DiscoveryMap`  
**Output**: `ResearchPlan`

- Produces 3 sub-questions for `quick` or 6–8 for `deep`.
- Every named entity in a sub-question must exist in `DiscoveryMap.entities`.
- Dimension-level questions are used when evidence is too thin.
- `validatePlanAgainstDiscovery` fails model-prior entities before research starts.

### 2. Parallel Research

**Input**: One `ResearchTaskPayload` per sub-question  
**Output**: ordered `SubquestionFinding[]`

Mastra `.foreach(research-subquestion, { concurrency: 4 })` is the fan-out/fan-in point. Each OMP ACP researcher uses `web_search` and `read`, performs full-source reads for `deep`, and runs one refinement query round seeded by first-pass evidence.

### 3. Draft Synthesis

**Input**: Discovery map, plan, findings  
**Output**: `DraftReport`

The writer uses only supplied inputs and maps each factual claim to source IDs.

### 4. Parallel Review Gates

**Input**: Draft report + workflow state  
**Output**: coverage, bias, and citation `ReviewResult`s

- Coverage review checks high-signal entity/dimension coverage and Tier A/B source depth.
- Bias review checks incumbent/vendor/model-prior overrepresentation relative to discovery.
- Citation audit checks missing claims, absent source IDs, and unread/failed sources.

### 5. Review Controller + Adaptive Cycle

The review controller chooses `finalize`, `targeted_repair`, `additional_research`, or `replan`. Mastra models the loop with a bounded `.dountil()` cycle capped by `maxReviewRepairRounds`. Additional research adds 1-3 DiscoveryMap-grounded subquestions; replanning cannot mutate already researched subquestion content under the same `SQ` id.

### 6. Final Audit and Archive

TypeScript computes unique source count, source-minimum status (`quick >= 5`, `deep >= 30`), deterministic citation failures, review status, required workflow headers, and archive path.

## OMP TUI Stage-Agent Flow

The interactive `deep-researcher` skill mirrors every model-driven CLI stage with
a named project agent under `.omp/agents/`. The main TUI agent remains the
coordinator, passes accepted state through `local://` JSON artifacts, validates
each agent's explicit JSON field contract, caps research batches at four, runs the
three review agents in parallel, allows one adaptive round, audits citations, and
archives the report. This path is prompt-orchestrated and labels reports
`omp-tui-native`; it does not claim Mastra execution.

## Technology Choices

| Area | Choice | Why |
|------|--------|-----|
| Orchestration | Mastra Workflows + OMP TUI skill | Deterministic CLI graph plus a prompt-driven interactive analogue |
| Model/tool execution | OMP ACP + OMP task agents | Keeps OMP auth, Codex execution, `web_search`, and `read` in both paths |
| Validation | Zod/TypeScript in CLI; coordinator JSON checks in TUI | Strong deterministic runner guarantees with explicit interactive handoffs |
| Fixture testing | Bun test fixture runner | Exercises the real workflow graph without OMP, network, or model credentials |
| Output | Markdown | Universal, versionable, archived under `researches/` |

Full decision log: [docs/decisions.md](docs/decisions.md)
