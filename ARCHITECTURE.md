# Architecture

## System Overview

Deep Researcher is a **Mastra workflow runner plus Oh My Pi (`omp`) skill wrapper**. Mastra owns deterministic orchestration; OMP owns model authentication, Codex subscription access, and built-in tools through ACP (`omp acp`).

```text
Topic
  -> Mastra workflow
  -> OMP ACP discovery
  -> OMP ACP planner
  -> Mastra foreach(concurrency 4) OMP ACP researchers
  -> OMP ACP writer
  -> parallel OMP ACP reviewers
  -> review controller
  -> bounded adaptive cycle(targeted repair | additional research | replan | finalize)
  -> deterministic audit/archive
  -> researches/
```

## Responsibility Split

| Layer | Owner | Responsibilities |
|---|---|---|
| Control plane | Mastra Workflows | Stage order, typed handoffs, workflow state, foreach concurrency, parallel review fan-out, adaptive review loop, final audit/archive |
| Model/tool runtime | OMP ACP | OMP auth, Codex model execution, `web_search`, URL/document extraction through `read`, project/user context |
| Deterministic guards | TypeScript | Zod schemas, discovery-plan validation, source thresholds, citation audit, archive path |

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

## Fallback OMP Task-Agent Flow

The project `.omp/agents/researcher.md` remains for fallback/manual mode only: use it when the Mastra + OMP ACP runner is unavailable or for ad-hoc subquestion investigation. Fallback runs must still follow discovery-first planning and must not invent entities absent from the discovery map.

## Technology Choices

| Area | Choice | Why |
|------|--------|-----|
| Orchestration | Mastra Workflows | Deterministic graph, typed steps, foreach and parallel primitives |
| Model/tool execution | OMP ACP | Keeps OMP auth, Codex subscription, built-in `web_search`, and `read` as runtime substrate |
| Validation | Zod + TypeScript | Reproducible handoff schemas and deterministic gates |
| Fixture testing | Bun test fixture runner | Exercises the real workflow graph without OMP, network, or model credentials |
| Output | Markdown | Universal, versionable, archived under `researches/` |

Full decision log: [docs/decisions.md](docs/decisions.md)
