# Hyperagent Customization — Deep Researcher Evolution Harness

**Status**: Draft
**Created**: 2026-06-12
**Linear**: [BER-151](https://linear.app/bertug-mirasyedi/issue/BER-151) (eval harness) · blocks [BER-139](https://linear.app/bertug-mirasyedi/issue/BER-139) (floor check) and [BER-144](https://linear.app/bertug-mirasyedi/issue/BER-144) (evolution)
**Supersedes the "Phase 1: Eval Harness" framing in** [hyperagent-benchmark-plan.md](hyperagent-benchmark-plan.md) with the concrete code gap.

## 1. Problem

[hyperagent-benchmark-plan.md](hyperagent-benchmark-plan.md) assumes `../hyperagent/` can be driven as a Deep Researcher evolution harness. Inspection of the actual codebase (`/Users/bertugmirasyedi/projects/hyperagent`, branch `main`) shows it is a **coding-agent** harness with a **binary** evaluation model that does not fit graded research-report scoring. The floor check ([BER-139](https://linear.app/bertug-mirasyedi/issue/BER-139)) cannot run until that gap is closed.

### What hyperagent is today

| Concern | Current implementation |
|---------|------------------------|
| Task | `BenchmarkTask = { templateDir, testCommand, tokenBudget }` (e.g. `python__two-sum` + pytest) |
| Verifier | `evaluator.ts` → `runTests()` → `execSync(testCommand)` → `passed: boolean` |
| Reward | `ObjectiveVector.efficacy` = **pass rate (0–1)**; `cost` = tokens; `latency` = wall-clock |
| Task agent | coding "phoenix" organism (`organisms/gen-000`, `seed/`); file-edit tools, no web |
| Models | `taskModel` fixed per-run, **not** organism-configurable; Bedrock coding defaults (`src/defaults.ts`) |
| Benchmarks | `builtin` / `polyglot` / `session` / `terminal-bench` — all code |

### What Deep Researcher needs

Markdown reports scored by **prompt-specific weighted ResearchRubrics** (LLM-as-judge, graded 0–1), over live web tools, with the **student** model as the task policy.

### What already aligns (keep)

- Integrity boundary matches our design: meta-agent + evaluator loop are FIXED, and `taskModel` is non-evolvable — exactly [BER-144](https://linear.app/bertug-mirasyedi/issue/BER-144)'s "student is the fixed task policy" decision.
- The MOEA / archive / Pareto / racing infra is reusable as-is once the reward becomes graded.
- `src/benchmark/session.ts` is a structural template for a non-pytest benchmark loader.

## 2. Gap → work items

| # | Area | Change | Files |
|---|------|--------|-------|
| 1 | **Graded reward** | Replace binary `passed`/pass-rate with continuous rubric composite (0–1) as the quality objective | `src/evaluator.ts`, `src/scoring.ts`, `src/types.ts` (`ObjectiveVector.efficacy`, `TaskResult`), `src/pareto.ts` |
| 2 | **Verifier = LLM-judge** | Score report against prompt-specific **weighted** rubrics (positive + negative weights, per [BER-150](https://linear.app/bertug-mirasyedi/issue/BER-150)) → composite + per-criterion breakdown. **Recover BER-150 scorer first** | new verifier module; replaces `runTests` for this benchmark kind |
| 3 | **Research benchmark loader** | New loader emitting tasks from ResearchRubrics samples + `rubrics.json` | new `src/benchmark/deep-researcher.ts` (modeled on `exercises.ts`/`session.ts`); wire into `src/config.ts` `BenchmarkKind` |
| 4 | **Task agent = research harness** | Port `.pi/agents/researcher.md` + `.pi/skills/deep-researcher/SKILL.md` into a single-agent organism (`pi-agent/SYSTEM.md` + skills) | organism dir — **[BER-140](https://linear.app/bertug-mirasyedi/issue/BER-140)** |
| 5 | **Toolset** | web_search/fetch_content + context-mgmt tools (`compress_findings`, `stash_finding`, `recall_finding`, `context_usage`) + optional `spawn_worker` | organism toolset — BER-140 / [context-management-tools.md](context-management-tools.md) |
| 6 | **Model wiring** | task = student (Qwen3-30B-A3B via hosted/vLLM); judge = fixed frontier (different family); meta = frontier | `src/defaults.ts`, config |

Items 1–3 + 6 are **BER-151**. Items 4–5 are **BER-140**. The floor check needs both, but only a *minimal* organism (not the full capabilities-not-mandates redesign) and only the **eval path** (no meta-agent / NSGA-II).

## 3. Decisions

- **D-HC1 — Branch off hyperagent `main`** (`bm/feat/deep-researcher-evolution`), not a fork or new repo. Matches the plan's `../hyperagent/` assumption, reuses MOEA/archive infra, keeps the integrity boundary reviewable. (2026-06-12)
- **D-HC2 — Recover the BER-150 scorer before writing any judge code.** It lives on EC2 `i-0a631da4ab15ce886` (`/home/ubuntu/ber150/...`), uncommitted. Reusing it keeps the judge identical to the one BER-150's variance numbers (`TTS sd=0.0985`, `relocation sd=0.0734`) were measured on; a fresh implementation would invalidate that calibration. (2026-06-12)
- **D-HC3 — Eval path first, meta/NSGA-II later.** BER-151 delivers a pure scoring harness runnable without the meta-agent; the evolutionary loop is wired in BER-144. (2026-06-12)

## 4. Dependency ordering

```
BER-151 (graded-reward eval harness)  ─┐
                                        ├─→ BER-139 (floor check) → BER-143 (conditional SFT-0)
BER-140 (minimal single-agent organism)─┘                        → BER-144 (evolution) → …
```

BER-151 and BER-140 now both block BER-139 (recorded in Linear). BER-141 (cost/config reconciliation) runs in parallel.

## 5. Open items

- Locate + commit the BER-150 scorer from EC2 (first task under BER-151).
- Student serving endpoint for the floor check: hosted Qwen API vs rented vLLM — decide at BER-139 run time (affects per-run cost, not the harness code).
- Confirm the ResearchRubrics sample set + held-out split to avoid training on final-test prompts (carry the BER-150 sample IDs forward).

## 6. References

- [hyperagent-benchmark-plan.md](hyperagent-benchmark-plan.md) — full evolution rollout (NSGA-II, Pareto, held-out protocol)
- [context-management-tools.md](context-management-tools.md) — the optional tools the organism exposes (item 5)
- [BER-150 comment](https://linear.app/bertug-mirasyedi/issue/BER-150) — actual ResearchRubrics variance + scorer artifacts on EC2
- Hyperagent `AGENTS.md` — organism structure + integrity boundary
