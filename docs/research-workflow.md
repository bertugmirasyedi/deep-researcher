# Research Workflow

The complete pipeline from topic to archived report. See [ARCHITECTURE.md](../ARCHITECTURE.md) for system-level context.

> **Orchestration**: Canonical `deep` runs use the Mastra + OMP ACP runner. Mastra controls stage order, workflow state, foreach concurrency, parallel review gates, repair, audit, and archive. OMP ACP controls model/tool execution with OMP auth, `web_search`, and `read`.

## Stage 0: Discovery Scan

**Goal**: Search before planning so sub-questions are grounded in observed evidence.

### Steps

1. Build neutral discovery queries from the topic and current year.
2. Use `web_search` for broad discovery.
3. Use `read` on promising URLs to verify source content.
4. Extract `DiscoveryMap.entities` and `DiscoveryMap.dimensions` only from observed evidence.
5. Record gaps, failed reads, and source metadata.

### Invariant

Subquestions may only name entities present in `DiscoveryMap.entities`; otherwise the run fails validation.

## Stage 1: Evidence-Grounded Plan

**Goal**: Decompose the discovered landscape into researchable sub-questions.

### Steps

1. Use the supplied `DiscoveryMap`; do not run new web searches.
2. Generate exactly 3 sub-questions for `quick`, or 6–8 for `deep`.
3. List every named entity in `allNamedEntitiesInQuestion`.
4. Seed entity-specific questions with `seededByEntityIds`.
5. Use dimension-level questions when evidence is too thin for named entities.
6. Validate with `validatePlanAgainstDiscovery` before any research fan-out.

### Depth Settings

| Depth | Sub-questions | Full reads | Refinement round | Minimum sources | Target sources |
|-------|--------------|------------|------------------|-----------------|----------------|
| Quick | 3 | recommended | optional | **5** | 5-12 |
| Deep (default) | 6-8 | **required** | **≥1 required** | **30** | 30-50 |

## Stage 2: Parallel Mastra foreach Research over OMP ACP

**Goal**: Gather and evaluate source material for each sub-question.

Mastra executes `.foreach(research-subquestion, { concurrency: 4 })`. Each item contains `ResearchTaskPayload`: original input, DiscoveryMap, ResearchPlan, and one SubQuestion.

### Steps per researcher

1. Run the sub-question's initial queries using OMP `web_search`.
2. Read promising URLs with OMP `read`; for `deep`, read at least four promising URLs.
3. Run one refinement query round seeded by first-pass evidence.
4. Score and tier sources with the shared source-quality criteria.
5. Return `SubquestionFinding` with sources, synthesis, confidence, conflicts, gaps, refinement queries, and source count.

Low coverage is not thrown as a workflow error; it returns low confidence with gaps so review and final status can disclose it.

## Stage 3: Draft Synthesis

**Goal**: Produce a sourced draft from supplied workflow state.

The writer uses only DiscoveryMap, ResearchPlan, and SubquestionFinding inputs. It must not introduce new factual claims. The output `DraftReport` includes Markdown, source inventory, and a `claimMap` linking factual claims to source IDs.

## Stage 4: Review Gates

**Goal**: Catch coverage, bias, and citation failures before finalization.

Mastra runs these review steps in parallel:

- **Coverage Review** — Fails when a discovered high-signal entity or dimension is omitted without a stated reason, or when any subquestion has fewer than two Tier A/B sources.
- **Bias Review** — Fails when the report overrepresents incumbents, vendor-authored sources, or model-prior framing relative to the DiscoveryMap.
- **Citation Audit** — Fails when factual claims lack source IDs, cite absent sources, or rely on unread/failed sources.

## Stage 5: One Repair Round

**Goal**: Address failed review actions without rewriting unrelated sections.

If any review fails and repair rounds remain, the runner builds a `ReviewDecision`, de-duplicates targeted queries, and runs a repair OMP ACP researcher. Repair evidence is appended as `REPAIR1`.

## Stage 6: Final Audit and Archive

**Goal**: Produce the final report and persist it.

TypeScript performs deterministic final checks:

1. Parse final citations and `## Source Inventory`.
2. Fail uncited paragraphs under `## Findings`, `## Areas of Agreement`, or `## Areas of Disagreement`.
3. Compute unique source IDs across findings.
4. Set `sourceMinimumMet` using quick >= 5 and deep >= 30.
5. Set `reviewStatus` to `failed`, `passed`, or `passed_with_disclosed_gaps`.
6. Ensure headers: `Workflow: mastra-omp-acp`, `Discovery-first plan: yes`, and `Review status: <status>`.
7. Write `researches/YYYY-MM-DD-<topic-slug>.md`.

## Failure Handling

| Failure | Response |
|---------|----------|
| No discovery search results | Throw `discovery_failed_no_search_results` |
| No readable deep sources | Throw `discovery_failed_no_readable_sources` |
| Plan names absent entity | Throw `plan_failed_discovery_validation:<errors>` |
| Source count shortfall | Disclose gaps and set `passed_with_disclosed_gaps` if citations are valid |
| Citation audit failure | Set `reviewStatus: failed` |
| OMP ACP model unavailable | Fail loudly; do not switch providers |
| Runner unavailable | Use fallback/manual researcher agent with discovery-first planning |
