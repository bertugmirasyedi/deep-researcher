# Execution Plans

Index of active and completed execution plans for the Deep Researcher project.

> **Note**: This directory was previously referenced from [AGENTS.md](../../AGENTS.md) and [README.md](../../README.md) but did not exist until 2026-06-10. Earlier links to `docs/exec-plans/` were broken — this file and its siblings were created to resolve those references.

## Purpose

Execution plans record **future or in-progress work** that goes beyond a single decision (captured in [docs/decisions.md](../decisions.md)) or a single research finding (captured in [researches/](../../researches/)). Each plan is a self-contained document with scope, phases, acceptance criteria, and cost estimates.

## Active Plans

| Plan | File | Status | Summary |
|------|------|--------|---------|
| Evaluation Integration | [evaluation-integration.md](evaluation-integration.md) | Draft | Integrate ResearchRubrics and DeepResearch Bench II as evaluation benchmarks; A/B testing protocol; internal metrics; regression suite |
| Hyperagent Benchmark Plan | [hyperagent-benchmark-plan.md](hyperagent-benchmark-plan.md) | Draft | Use Hyperagent as an evolution harness for Deep Researcher variants; NSGA-II Pareto scoring; three-phase rollout |
| Context Management Tools | [context-management-tools.md](context-management-tools.md) | Draft | Custom OMP tools (compress_findings, stash_finding, recall_finding, context_usage, escalate) to make context management a learnable RL behavior; planner-side merge/synthesize tools |
| RL Fine-Tuning | [../researches/2026-06-10-rl-methods-for-agent-training.md](../../researches/2026-06-10-rl-methods-for-agent-training.md) | Research Report | 130+ sources on GRPO, RLVR, PRMs, SFT+RL recipes, local-world training, frameworks, benchmarks; validated OMP-RL bridge via Polar |

## Completed Plans

_None yet._

## Plan Dependencies

```
Evaluation Integration (reward signal)
    ↓
Hyperagent Benchmark Plan (evolution search)
    ↓
Context Management Tools (learnable behaviors)
    ↓
RL Fine-Tuning (Polar + TRL + GRPO)
```

## Tech Debt Tracker

| Item | Origin | Priority | Notes |
|------|--------|----------|-------|
| Model/thinking sync in TUI stage agents | D011, D016 | Medium | Every `.omp/agents/*.md` frontmatter model and thinking level should stay aligned with its corresponding runner stage |
| Legacy Orca-Linear references in historical reports | D013 | Low | Historical `researches/` files are left as-is unless they are promoted into current workflow docs |

## Related

- [Decisions log](../decisions.md) — architectural and design decisions with rationale
- [Research workflow](../research-workflow.md) — pipeline stages and data flow
- [Output format](../output-format.md) — report structure and citation format
- [Research reports archive](../../researches/README.md) — saved research reports

## Refined Sequence (Evolution → SFT → RL)

The original plan stack is sequential but the optimal ordering is:

```
Hyperagent Evolution (prompts, tools, config)
    ↓  best organism
Distill SFT Trajectories (teacher model + evolved organism)
    ↓  ~500 filtered trajectories
SFT on Qwen3.6 (behavioral warm-start)
    ↓  strong prior
GRPO via Polar + TRL (weight optimization)
    ↓  +5-12 pts
Evaluate via ResearchRubrics
```

**Why evolution first**: Evolution handles discrete choices (include context_usage tool? compress at what threshold? 6 or 8 sub-questions?). RL handles continuous optimization (token-level behavior, when exactly to compress, how to phrase stashed findings). An evolved organism provides a stronger behavioral prior for RL, addressing the "RL-only fails without warm-start" finding from [SQ4](../../researches/2026-06-10-rl-methods-for-agent-training.md).
