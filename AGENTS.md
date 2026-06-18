# AGENTS.md — `evolution-sft-rl` worktree

> **This worktree has a distinct job from `main`.** `main` is the Deep Researcher
> **context-and-skills pack** (the research harness/product). This branch
> (`bm/feat/evolution-sft-rl`) executes the **Evolution → SFT → RL** training
> program: it treats that harness as an evolution organism and trains a *student*
> model through it. Code/docs that define the harness live on `main`; the
> experiment plans, decisions, and lab notes for the training program live here.

## The job

Turn the Deep Researcher harness into a trained small model via one ablation chain,
measuring one number per stage:

```
raw student  →  + evolved harness  →  + SFT  →  + GRPO (RL)  →  + re-evolution
```

- **Student policy**: Qwen3-30B-A3B (per the RL research report), in the loop from
  day one — the harness is evolved for the exact model that later gets SFT+RL.
- **Frontier-and-fixed**: the hyperagent meta-agent (mutation proposer) and the
  LLM-as-judge (integrity boundary) stay frontier.
- **Training unit = single-question / worker episode** (search + evaluate one
  sub-question → scored payload), *not* the full 200+-turn pipeline. Shorter
  horizons (~20–40 turns) sidestep multi-agent credit assignment, let vanilla
  GRPOTrainer suffice, and make the SFT data unit match the RL training unit.

## Linear is the durable plan

The **`Evolution → SFT → RL`** milestone (project: `deep-researcher`) is the source
of truth. Read it before acting: `linear milestone show "Evolution → SFT → RL"`.

| # | Issue | Stage | Blocks |
|---|-------|-------|--------|
| BER-139 | Floor check: raw student on single-agent harness | Gate (1/2/3) | BER-144, BER-143 |
| BER-140 | Redesign organism: capabilities not mandates | Build organism | BER-144 |
| BER-143 | *Conditional* SFT-0 protocol-compliance bootstrap | Only if BER-139 = outcome 2 | BER-144 |
| BER-141 | Reconcile cost arithmetic + model-config drift | Hygiene | — |
| BER-144 | Run harness evolution with student in the loop | Evolution | BER-145 |
| BER-145 | SFT distillation: rejection-sampled teacher episodes | SFT | BER-146 |
| BER-146 | GRPO on single-question episodes (Polar + TRL) | RL | BER-147 |
| BER-147 | Post-RL re-evolution (P2O-style refresh) | Re-evolve | — |
| BER-137 ✓ | Spike: Polar trajectory capture (GO, conditional) | De-risk | — |
| BER-138 ✓ | Spike: ResearchRubrics reward variance (8 rollouts) | De-risk | — |
| BER-150 ✓ | Spike: *actual* ResearchRubrics reward variance | De-risk | — |

Dependency order: `139 → 140 → 144 → 145 → 146 → 147` (143 is a conditional detour
off 139; 141 is parallel hygiene). The three spikes are done.

## Key decisions baked in (2026-06-11)

1. **Capabilities, not mandates** (Bitter Lesson): strip hard-coded priors (6–8
   sub-questions, 4-searches-each, mandated refinement, parallel-as-rule) from the
   organism. Expose context-management primitives (`compress_findings`,
   `stash_finding`, `recall_finding`, `context_usage`) and `spawn_worker` as
   *optional* tools so evolution decides usage. Keep the parallel pipeline as a
   comparison organism. Expect gen-1 single-agent organisms to score *worse* first.
2. **Single-question episodes** as the SFT *and* RL unit (~10× cheaper than full
   runs; rewards partially verifiable: citation validity, source counts, tiers).
3. **Reward design** (from BER-150): use full prompt-specific ResearchRubrics for
   eval/selection and *at most* a small mixed reward component — **not** the sole
   high-volume GRPO reward. Pair with cheap verifiable rewards (citation validity,
   source coverage/quality, URL support, checklist). Log completion length +
   citation density to watch for reward hacking.
4. **Rejection sampling (STaR)** for SFT: generate ~1.5–2× target, keep only above
   rubric threshold + verifiable checks; target ~500 kept episodes, loss-masked to
   assistant tokens, LoRA on the student.

## Stack

- **Evolution**: hyperagent (NSGA-II Pareto promotion, held-out validation,
  per-run token caps, total budget cap) — see [hyperagent-benchmark-plan.md](docs/exec-plans/hyperagent-benchmark-plan.md).
- **Trajectory capture**: Polar (NVIDIA ProRL-Agent-Server) + pi — validated in BER-137.
- **RL**: TRL `GRPOTrainer` + LoRA on the SFT checkpoint.
- **Eval**: ResearchRubrics (full prompt-specific weighted rubrics).
- **Student serving**: hosted Qwen API or rented vLLM endpoint.

## Plans (this worktree's docs)

| Plan | File |
|------|------|
| Hyperagent evolution harness | [docs/exec-plans/hyperagent-benchmark-plan.md](docs/exec-plans/hyperagent-benchmark-plan.md) |
| Context-management tools (learnable behaviors) | [docs/exec-plans/context-management-tools.md](docs/exec-plans/context-management-tools.md) |
| Evaluation integration (reward signal) | [docs/exec-plans/evaluation-integration.md](docs/exec-plans/evaluation-integration.md) |
| Exec-plan index + refined sequence | [docs/exec-plans/README.md](docs/exec-plans/README.md) |
| RL methods research report (130+ sources) | [researches/2026-06-10-rl-methods-for-agent-training.md](researches/2026-06-10-rl-methods-for-agent-training.md) |

For the underlying harness (research workflow, source-quality tiers, output format,
the `researcher` subagent), see those docs on `main` — this worktree does not
redefine them.

## How to work here

1. **Pull intent from Linear first** — the milestone issue carries the goal,
   acceptance criteria, and decision gates; this file is the map, not the spec.
2. **Record decisions** — gate outcomes (esp. BER-139's 1/2/3) and reward-design
   choices go in `docs/decisions.md`; per-run training results go in lab-notebook
   entries (config diff, curves, conclusion) on the relevant issue.
3. **Respect budget caps** — each phase has a cap (re-costed in BER-141); a failed
   RL run is tuition, but capped.
4. **Commit convention** — `BER-###: <summary>`, end with the Co-Authored-By trailer.
5. **Keep this file lean** — if it exceeds ~120 lines, extract to `docs/`.
