# Evaluation Integration Plan

**Status**: Draft  
**Created**: 2026-06-10  
**Origin**: SOTA research report ([researches/2026-06-09-deep-search-agents-deep.md](../../researches/2026-06-09-deep-search-agents-deep.md)), SQ6 findings and Cross-Cutting Theme 2

## 1. Summary

This plan integrates two rubric-graded evaluation benchmarks — **ResearchRubrics** (ICLR 2026) and **DeepResearch Bench II** — into the Deep Researcher pipeline to enable reproducible quality measurement and regression testing. The SOTA research report (SQ6) found that even the strongest frontier systems satisfy under ~50–68% of expert rubric criteria, establishing a clear ceiling and a measurable target for improvement.

**Goal**: Make Deep Researcher's output quality measurable, regressable, and improvable against external benchmarks — without overfitting to any single rubric.

## 2. Benchmarks and Fit

### ResearchRubrics (ICLR 2026)

- **Source**: [arXiv 2511.07685](https://arxiv.org/abs/2511.07685)
- **What it measures**: Expert-crafted rubrics for evaluating long-form research reports. Grades compliance across dimensions like information recall, source attribution, analytical depth, and structural completeness.
- **Key signal**: Best deep-research agents achieve <68% overall compliance. Information recall is the weakest dimension (~50%).
- **Fit**: Directly evaluates the kind of output Deep Researcher produces (structured Markdown reports with citations and confidence grades). Maps well to our [output format](../output-format.md) sections.
- **Limitation**: Rubric set is fixed; may not capture domain-specific quality criteria outside the benchmark's scope.

### DeepResearch Bench II

- **Source**: [arXiv 2601.08536](https://arxiv.org/abs/2601.08536)
- **What it measures**: Rubric-based evaluation of research reports produced by autonomous deep-search agents. Evaluates factual accuracy, comprehensiveness, citation quality, and analytical synthesis.
- **Key signal**: Top system (iFlow-Researcher) achieves 59.91%. Large gap to expert-level reports.
- **Fit**: Complements ResearchRubrics by providing an independent rubric set with different weighting. Together, the two benchmarks reduce overfitting risk to any single evaluation protocol.
- **Limitation**: Smaller prompt set than ResearchRubrics; best used as a held-out validation set (see §5).

### Combined Fit Assessment

Using both benchmarks provides:
- **Coverage**: Two independent rubric sets from different research groups.
- **Overfitting guard**: A system that games one rubric is unlikely to game both.
- **External validity**: Results are directly comparable to published SOTA numbers.

## 3. A/B Testing Protocol

### Baseline Definition

The **baseline** is the current Deep Researcher pipeline (updated 2026-06-23 for OMP) running with its default configuration:
- Planner: main OMP session (GPT-5.5 per D011)
- Workers: `gpt-5.4-mini` at `xhigh` thinking (D011)
- Task-agent fan-out per D013
- Depth: `deep` (6–8 sub-questions, 4 searches, required full-source `read`, ≥1 refinement)
- Source minimum: 30

Run the full evaluation suite on the baseline and record scores as the reference point.

### Fix Levels

| Level | Description | Scope |
|-------|-------------|-------|
| **P0** | Quick wins that require only prompt/config changes | SKILL.md, researcher.md, synthesis instructions |
| **P1** | Pipeline structural changes | Worker count, search strategy, evaluation criteria, compression protocol |

### Testing Protocol

1. **Freeze prompts**: Select N prompts from each benchmark (see §6 regression suite). These prompts are fixed for the duration of the evaluation cycle.
2. **Run baseline**: Execute the frozen prompt set through the current pipeline. Record all metrics (see §4).
3. **Apply P0 fixes**: Modify prompts/config only. Re-run the same frozen prompt set. Compare against baseline.
4. **Apply P1 fixes**: Modify pipeline structure. Re-run. Compare against P0 and baseline.
5. **Statistical gate**: A change is promoted only if it improves the composite score by ≥5% on the frozen set **and** does not regress any individual rubric dimension by >10%.

### Multiple Comparisons

Each evaluation cycle runs at most 3 variants (baseline, P0, P1). Apply Bonferroni correction: significance threshold α = 0.05/3 ≈ 0.017 per comparison. With the small sample sizes typical of rubric evaluations (10–20 prompts per benchmark), prioritize effect size over p-value.

## 4. Internal Metrics (Tracked Per-Run)

These metrics are computed for every research run (not just benchmark evaluations) to provide continuous quality signal.

### Source Utilization Rate

```
source_utilization = sources_cited_in_report / sources_scored_above_threshold
```

- **Target**: ≥ 0.7 (70% of evaluated sources appear in the final report)
- **Below 0.5 signals**: Search is too broad, or synthesis is discarding too much

### Citation Density

```
citation_density = total_inline_citations / word_count_of_findings
```

- **Target**: 1 citation per 100–200 words of findings text
- **Below 1/300 signals**: Unsupported claims; above 1/50 signals**: citation salad

### Coverage Evenness

```
coverage_evenness = 1 - (std_dev(sources_per_sub_question) / mean(sources_per_sub_question))
```

- **Target**: ≥ 0.6 (coefficient of variation ≤ 0.4)
- **Below 0.4 signals**: Some sub-questions are underserved relative to others

### Refinement Yield

```
refinement_yield = new_unique_sources_from_refinement / total_sources
```

- **Target**: ≥ 0.15 (refinement rounds contribute at least 15% of unique sources)
- **Below 0.05 signals**: Refinement queries are not finding novel material; reformulate strategy needed

### Collection Protocol

These four metrics are computed by the planner after merging worker payloads and before writing the report. They are logged in the report's **Methodology** section and, for benchmark runs, recorded in the evaluation spreadsheet alongside rubric scores.

## 5. Regression Test Suite

### Design

Select **3 freeze prompts** — one from each benchmark, plus one cross-domain prompt. These prompts are never used during development or prompt tuning; they are exclusively for regression testing.

| Prompt ID | Source Benchmark | Domain | Purpose |
|-----------|-----------------|--------|---------|
| `freeze-01` | ResearchRubrics | Technology / science | Primary regression anchor |
| `freeze-02` | DeepResearch Bench II | Policy / social science | Cross-domain generalization |
| `freeze-03` | Custom (held-out) | Deliberately cross-cutting | Overfitting guard |

### Rules

1. **Never modify freeze prompts** once selected. If a prompt is discovered to be broken (e.g., requires a now-dead URL), retire it and select a replacement from the held-out set — but document the swap.
2. **Run after every P0 or P1 change**. Full pipeline execution at `deep` depth.
3. **Regressions**: If any freeze prompt's composite score drops >5% from its previous best, the change is blocked from promotion.
4. **Scoring**: Each freeze prompt is scored by the same rubric as its source benchmark. Report per-prompt and per-dimension scores.

### Why 3 Prompts

Three is the minimum for detecting both overall regression (all three drop) and domain-specific regression (one drops, others hold). Adding more prompts improves statistical power but increases cost and latency. Start with 3; expand to 5 if the initial evaluation cycle proves inconclusive.

## 6. Cost Estimates Per Evaluation Phase

All estimates assume `deep` depth (6–8 sub-questions), `gpt-5.4-mini` at `xhigh` thinking for workers, and GPT-5.5 for the planner (per D011). Costs are approximate and based on observed Codex token pricing as of 2026-06.

### Per-Run Cost

| Component | Tokens (approx.) | Cost (approx.) |
|-----------|-----------------|----------------|
| Planner — plan + dispatch + synthesize | ~30K input + ~15K output | ~$0.80 |
| 6× researcher workers (search + evaluate) | ~6 × (50K input + 25K output) = ~450K | ~$3.50 |
| Full-source `read` calls (24+ URL/document reads) | Included in worker tokens | — |
| Refinement round (6× 1 additional search) | ~6 × 15K = ~90K | ~$0.70 |
| **Total per run** | | **~$5.00** |

### Phase Costs

| Phase | Runs | Total Cost | Notes |
|-------|------|------------|-------|
| **Baseline evaluation** (full prompt set) | 10 prompts × 1 run = 10 | ~$50 | Establish reference scores |
| **P0 iteration** (prompt/config tuning) | 10 prompts × 3 variants = 30 | ~$150 | A/B comparison against baseline |
| **Regression suite** (per change) | 3 freeze prompts × 1 run = 3 | ~$15 | Run after every P0/P1 change |
| **P1 evaluation** | 10 prompts × 1 run = 10 | ~$50 | Structural changes |
| **Full cycle** (baseline → P0 → P1 → regression) | ~53 runs | **~$265** | One complete evaluation cycle |

### Cost Controls

- **Budget cap**: $300 per evaluation cycle. If P0 iteration exceeds 4 variants, stop and promote the best variant rather than continuing exploration.
- **Quick-check option**: For early-stage changes, run a single freeze prompt (~$5) before committing to the full 10-prompt suite. This catches obvious regressions cheaply.
- **Token monitoring**: Track cumulative token spend per cycle via the Codex dashboard. Alert at 80% of budget cap.

## 7. References

- [SOTA Research Report](../../researches/2026-06-09-deep-search-agents-deep.md) — SQ6 (Evaluation & SOTA numbers), Cross-Cutting Theme 2
- [Research Workflow](../research-workflow.md) — Pipeline stages and depth controls
- [Output Format](../output-format.md) — Report structure mapped to rubric dimensions
- [Decisions Log](../decisions.md) — D012 (two depth tiers), D011 (model config), D010 (worker isolation)
- ResearchRubrics: [arXiv 2511.07685](https://arxiv.org/abs/2511.07685)
- DeepResearch Bench II: [arXiv 2601.08536](https://arxiv.org/abs/2601.08536)
