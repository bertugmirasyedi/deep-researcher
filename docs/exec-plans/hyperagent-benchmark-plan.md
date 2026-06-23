# Hyperagent Benchmark Plan

**Status**: Draft  
**Created**: 2026-06-10  
**Origin**: SOTA research report ([researches/2026-06-09-deep-search-agents-deep.md](../../researches/2026-06-09-deep-search-agents-deep.md)), SQ5/SQ6 findings on verification-centric rubric rewards and evaluation bifurcation

## 1. Summary

This plan uses **Hyperagent** (`../hyperagent/`) as an evolution harness to automatically discover improved Deep Researcher variants. Instead of hand-tuning prompts and pipeline parameters, the meta agent explores a search space defined by the Deep Researcher's evolvable surface — SKILL.md, researcher.md, synthesis instructions, verification checklists, compression protocols, escalation handling, and model configuration — and selects variants that optimize a multiobjective score (quality, cost, latency) via NSGA-II Pareto fronts.

**Goal**: Discover Deep Researcher configurations that dominate the current baseline on at least one objective without regressing on others, using Hyperagent's archive-based evolutionary loop.

## 2. Organism Structure

Each Hyperagent **organism** represents a complete Deep Researcher variant. The organism is a directory containing the evolvable files that define the research pipeline's behavior.

### Directory Layout

```
organisms/gen-NNN/
  omp-agent/                         # Sandboxed OMP agent config
    SYSTEM.md                        # Replaces researcher.md as the task agent system prompt
    skills/                          # Evolvable skills (e.g., custom search strategies)
    AGENTS.md                        # Additional context (e.g., domain-specific guidance)
  task-system-prompt.md              # Planner's synthesis instructions (evolvable)
  meta-system-prompt.md              # Meta agent instructions (self-modifiable)
  src/
    sessions.ts                      # Task agent session creation + meta agent execution
    strategy.ts                      # OptimizationStrategy (parent selection, promotion, pruning)
    types.ts                         # Shared type definitions
```

### Evolvable Surface Mapping

| Deep Researcher Component | Organism File | What Evolves |
|---------------------------|---------------|-------------|
| Researcher system prompt | `pi-agent/SYSTEM.md` | Search strategy, evaluation criteria, output format, citation rules, source-tiering instructions |
| Planner synthesis instructions | `task-system-prompt.md` | How findings are merged, conflict resolution, confidence grading, report structure |
| SKILL.md (pipeline stages) | Implicit via SYSTEM.md + task-system-prompt.md | Stage ordering, depth thresholds, refinement strategy, source minimums |
| Verification checklist | `pi-agent/skills/verify.md` (new, evolvable) | Pre-submission quality checks: citation coverage, confidence justification, minimum source count |
| Compression protocol | `pi-agent/skills/compress.md` (new, evolvable) | How the researcher worker summarizes long source content for the payload |
| Escalation handling | `pi-agent/skills/escalate.md` (new, evolvable) | When and how a worker escalates (blocked, insufficient sources, conflicting evidence) |
| Model configuration | Encoded in `src/sessions.ts` | `--model`, `--thinking` level, token budgets per stage |

### What Does NOT Evolve

Per Hyperagent's integrity boundary ([`../hyperagent/AGENTS.md`](../../../hyperagent/AGENTS.md)):
- The evaluation harness (`evaluator.ts`, `scoring.ts`, `benchmark/`) — fixed
- The evolution loop (`evolve.ts`) — fixed
- The Orchestration dispatch mechanism (Orca CLI, Linear integration) — fixed
- The benchmark prompt set and rubric scoring — fixed

## 3. ResearchRubrics Adapter Design

### Problem

Hyperagent's evaluator expects tasks that produce text output scored against ground truth or a rubric. ResearchRubrics evaluates **markdown reports** against **expert-crafted rubrics**. We need an adapter that:

1. Presents research prompts to the task agent
2. Collects the markdown report output
3. Scores it against ResearchRubrics criteria
4. Returns numeric scores to Hyperagent's scoring pipeline

### Adapter Architecture

```
benchmark/
  deep-researcher/
    tasks.json              # Prompt set (sourced from ResearchRubrics + DR Bench II)
    rubrics.json            # Rubric definitions (per-prompt scoring criteria)
    adapter.ts              # Evaluator adapter: prompt → report → rubric scores
    score-aggregator.ts     # Converts per-dimension rubric scores → composite for Hyperagent
```

### Adapter Flow

1. **Prompt injection**: `adapter.ts` reads a task from `tasks.json` and passes it as the research topic to the task agent (the Deep Researcher organism variant).
2. **Report collection**: The task agent runs the full research pipeline and produces a markdown report saved to `researches/`.
3. **Rubric evaluation**: `adapter.ts` reads the report and evaluates it against the corresponding rubric in `rubrics.json`. Evaluation is LLM-as-judge (using a separate, fixed model not in the evolvable surface) — this is the standard approach for ResearchRubrics.
4. **Score normalization**: Each rubric dimension is scored 0–1. `score-aggregator.ts` computes:
   - Per-dimension scores (information recall, source attribution, analytical depth, structural completeness, etc.)
   - Composite score (weighted average, weights fixed in the adapter)
5. **Return to Hyperagent**: The composite score (and per-dimension breakdown) is returned as the task evaluation result.

### LLM-as-Judge Configuration

- **Judge model**: Fixed, not evolvable. Use GPT-5.5 with a structured output schema.
- **Judge prompt**: Includes the rubric criteria, the original research prompt, and the produced report. The judge scores each dimension independently.
- **Calibration**: Before evolution begins, calibrate the judge against 5 human-scored reports (produced by the baseline Deep Researcher and manually graded). Target: Pearson r ≥ 0.85 between judge and human scores.

### Prompt Selection

- **Evolution prompts** (used during evolution): 10 prompts from ResearchRubrics. These are the "training set" — the meta agent can indirectly overfit to them.
- **Held-out prompts** (used only for validation): 5 prompts from DeepResearch Bench II + 3 custom cross-domain prompts. The meta agent **never** sees aggregate or per-prompt scores on the held-out set during evolution (see §4).

## 4. Multiobjective Scoring with NSGA-II Pareto

### Objectives

| Objective | Direction | Measurement |
|-----------|-----------|-------------|
| **Quality** | Maximize | Composite rubric score (0–1) from the ResearchRubrics adapter |
| **Cost** | Minimize | Total token spend per run (input + output, all workers + planner) |
| **Latency** | Minimize | Wall-clock time from prompt injection to final report (seconds) |

### NSGA-II Configuration

- **Population size**: 10 organisms per generation
- **Archive size**: 20 (top organisms by non-dominated sorting + crowding distance)
- **Crossover**: Two-parent recombination — merge sections from each parent's SYSTEM.md and task-system-prompt.md.
- **Mutation operators** (applied by the meta agent, not hand-coded):
  - Prompt rewriting (synthesis instructions, evaluation criteria)
  - Threshold adjustment (source minimums, credibility thresholds, refinement triggers)
  - Skill injection (new files in `pi-agent/skills/`)
  - Model configuration changes (thinking level, token budget allocation)
- **Selection**: Binary tournament on Pareto rank, with crowding distance as tiebreaker.

### Scoring Pipeline

```
Organism evaluation:
  1. Run organism on all evolution prompts (10 prompts)
  2. Collect: rubric scores (quality), token counts (cost), wall-clock (latency)
  3. Compute per-prompt averages for each objective
  4. Feed (quality_avg, cost_avg, latency_avg) into NSGA-II ranking
  5. Non-dominated organisms → archive; dominated → prune
```

### Pareto Front Interpretation

- A variant on the Pareto front **dominates** the baseline if it is better on at least one objective and not worse on any.
- The desired outcome: a set of variants spanning the Pareto front (high-quality/expensive, balanced, cheap/fast) that the user can choose between based on task priority.

## 5. Held-Out Validation Protocol

### Purpose

Prevent the meta agent from overfitting to the evolution prompt set. The held-out set provides an unbiased estimate of generalization quality.

### Protocol

1. **During evolution**: The meta agent receives feedback **only** on evolution prompts. It never sees held-out scores — not aggregate, not per-prompt, not per-dimension.
2. **After each generation**: Run the top-3 Pareto-front organisms on the held-out set (8 prompts). Record scores separately.
3. **After evolution completes**: Run **all** archive organisms on the held-out set. Rank by held-out composite score.
4. **Promotion gate**: An organism is promoted from the archive only if:
   - Its held-out composite score is within 5% of its evolution-set composite score (no overfitting), **AND**
   - Its held-out composite score is ≥ baseline held-out composite score (no regression)

### Feedback Asymmetry

- **Evolution feedback**: Full rubric dimension scores + token counts + latency. The meta agent uses this to guide mutations.
- **Held-out feedback**: Aggregate-only (single composite score, no per-dimension breakdown). This is logged by the evaluator but **not** passed to the meta agent. It is used exclusively by the human operator to make promotion decisions.

## 6. Three-Phase Rollout

### Phase 1: Eval Harness (2–3 days)

**Objective**: Build and validate the evaluation infrastructure.

| Step | Task | Acceptance Criterion |
|------|------|---------------------|
| 1.1 | Implement `benchmark/deep-researcher/adapter.ts` | Adapter runs a single prompt through a Deep Researcher organism and returns rubric scores |
| 1.2 | Implement `score-aggregator.ts` | Aggregator produces (quality, cost, latency) tuples from adapter output |
| 1.3 | Create `tasks.json` with 10 evolution + 8 held-out prompts | All prompts are from ResearchRubrics and DR Bench II (no synthetic prompts) |
| 1.4 | Calibrate LLM-as-judge against 5 human-scored reports | Pearson r ≥ 0.85 on each rubric dimension |
| 1.5 | Run baseline organism through full harness | Baseline scores recorded; harness produces no crashes on all 18 prompts |

**Deliverable**: Working eval harness that Hyperagent can drive.

**Cost estimate**: ~$100 (18 prompts × ~$5/run + judge scoring costs)

### Phase 2: Ablation (3–5 days)

**Objective**: Understand which components of the Deep Researcher pipeline contribute most to quality.

| Step | Task | Acceptance Criterion |
|------|------|---------------------|
| 2.1 | Create ablation organisms: remove one component each (refinement round, full-source read requirement, multi-query search, source tiering) | 4 ablation variants |
| 2.2 | Run all ablation variants through eval harness | Scores for all 4 on evolution + held-out sets |
| 2.3 | Analyze per-dimension rubric impact | Identify which components affect which quality dimensions |
| 2.4 | Document ablation findings | Report in this file, §7 (Results) |

**Deliverable**: Ablation study identifying the highest-leverage components.

**Cost estimate**: ~$200 (4 variants × 18 prompts × ~$3/run)

### Phase 3: Evolution (5–10 days)

**Objective**: Run Hyperagent's evolutionary loop to discover improved variants.

| Step | Task | Acceptance Criterion |
|------|------|---------------------|
| 3.1 | Seed archive with baseline + best ablation variant | Archive initialized with 2 organisms |
| 3.2 | Run 5 generations of evolution (10 organisms/gen) | Each generation evaluated on full evolution prompt set |
| 3.3 | After each generation: validate top-3 on held-out set | Held-out scores logged |
| 3.4 | After 5 generations: validate all archive organisms on held-out set | Final ranking produced |
| 3.5 | Select promoted variants based on held-out performance + Pareto analysis | ≥1 variant that dominates baseline on at least one objective |
| 3.6 | Document evolved configurations and write back to Deep Researcher | Update SKILL.md, researcher.md, etc. with promoted variant's parameters |

**Deliverable**: One or more improved Deep Researcher configurations with evidence.

**Cost estimate**: ~$1,500–2,000 (5 generations × 10 organisms × 10 prompts × ~$3–4/run + held-out validation runs)

### Total Estimated Cost

| Phase | Cost |
|-------|------|
| Eval Harness | ~$100 |
| Ablation | ~$200 |
| Evolution | ~$1,500–2,000 |
| **Total** | **~$1,800–2,300** |

Budget cap: $2,500. If Phase 3 approaches cap before 5 generations, stop and promote the best available variant.

## 7. Key Risks and Mitigations

### Risk 1: Benchmark Overfitting

**Description**: The meta agent discovers variants that score well on the 10 evolution prompts but generalize poorly to new topics.

**Impact**: High — the entire evaluation is invalidated.

**Mitigations**:
- Held-out validation protocol (§5) with aggregate-only feedback.
- Require held-out score within 5% of evolution score for promotion.
- Use prompts from **two independent benchmarks** (ResearchRubrics + DR Bench II), reducing single-benchmark overfitting.
- Post-evolution: run promoted variants on 3 entirely new topics (not from either benchmark) as a final generalization check.

### Risk 2: Live Web Nondeterminism

**Description**: Running the same prompt twice produces different search results, making scores noisy and evolutionary signal unreliable.

**Impact**: Medium — increases the number of generations needed to overcome noise; may mislead the meta agent.

**Mitigations**:
- **Deterministic search mode**: For evaluation runs, use fixed search queries (defined in `tasks.json` alongside the prompt) instead of letting the researcher agent craft its own. This removes query-variation noise at the cost of not evaluating query-crafting skill.
- **Multiple evaluation runs**: Score each organism on each prompt 3 times; use median score. This reduces variance but triples eval cost.
- **Hybrid approach**: Start with deterministic queries in Phase 2 (ablation). If ablation results are clean, allow free-form queries in Phase 3 with 2× evaluation repeats.
- **Fallback**: If nondeterminism makes evolution signal too noisy (generation-over-generation improvement < measurement noise), switch to deterministic-only mode for the remainder of Phase 3.

### Risk 3: Cost Explosion

**Description**: Evolution runs more generations than planned, or organisms discover expensive strategies (e.g., 20 sub-questions instead of 6).

**Impact**: Medium — budget overruns.

**Mitigations**:
- **Hard token budget per run**: Enforce in `adapter.ts` — terminate any run exceeding 2× baseline token cost and assign score 0.
- **Generation budget cap**: Stop at 5 generations regardless of results.
- **Total cost cap**: $2,500 across all phases. Monitor cumulative spend after each generation.
- **Population size limit**: Fixed at 10 organisms per generation (not evolvable).

### Risk 4: LLM-as-Judge Miscalibration

**Description**: The judge model systematically over- or under-scores certain report features, biasing evolution.

**Impact**: Medium — evolution optimizes for the wrong target.

**Mitigations**:
- Calibrate against 5 human-scored reports before Phase 1 sign-off.
- Use a different model family for judging than for the task agent (judge = GPT-5.5; workers = `gpt-5.4-mini`) to reduce shared blind spots.
- Periodic recalibration: after Phase 3 generation 3, re-calibrate judge against the latest human-reviewed reports.

### Risk 5: Evolvable Surface Too Narrow

**Description**: The organism's evolvable files don't capture enough of the Deep Researcher's behavior space for meaningful evolution.

**Impact**: Low — evolution finds only marginal improvements.

**Mitigation**: Phase 2 (ablation) explicitly tests whether component changes affect quality. If ablation shows no sensitivity, expand the evolvable surface (e.g., allow the meta agent to create entirely new files in `pi-agent/skills/`) before proceeding to Phase 3.

## 8. References

- [Hyperagent AGENTS.md](../../../hyperagent/AGENTS.md) — Organism structure, evolvable surface, integrity boundary, archive traces
- [SOTA Research Report](../../researches/2026-06-09-deep-search-agents-deep.md) — SQ5 (training methods, verification-centric rewards), SQ6 (evaluation bifurcation, rubric benchmarks)
- [Research Workflow](../research-workflow.md) — Pipeline stages that become the evolvable organism surface
- [Output Format](../output-format.md) — Report structure that rubrics evaluate
- [Decisions Log](../decisions.md) — D010 (worker isolation), D011 (model config), D012 (two depth tiers)
- ResearchRubrics: [arXiv 2511.07685](https://arxiv.org/abs/2511.07685)
- DeepResearch Bench II: [arXiv 2601.08536](https://arxiv.org/abs/2601.08536)
- NSGA-II: Deb et al., "A Fast and Elitist Multiobjective Genetic Algorithm: NSGA-II," IEEE TEVC, 2002
