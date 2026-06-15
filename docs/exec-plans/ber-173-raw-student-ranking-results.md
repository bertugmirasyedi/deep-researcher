# BER-173 Raw-Student Ranking Pilot Results

- **Issue**: BER-173
- **Status**: Pilot results recorded; no new runs in this document
- **Registry doc**: [Benchmark Browser Task Registry](benchmark-browser-task-registry.md)
- **Last updated**: 2026-06-15

## Purpose

This note makes the first raw-student browser-ranking pilots durable. The pilots were used to find the feasible bootstrap frontier for Qwen student browser episodes, not to create positive SFT data at scale.

## Inputs and runner changes

### Registry commit

Docs commit `804e879ead76c43ef5c3b5ff4dbb087b8328c5c8` added the initial 80-task registry.

Coverage by stage:

| Stage | Count |
|---|---:|
| `stage1_warmup` | 22 |
| `stage2_core_research` | 26 |
| `stage3_hardening_repair` | 24 |
| `stage4_eval_probe` | 8 |

Coverage by category:

| Category | Count |
|---|---:|
| Browser basics/action grounding | 9 |
| Navigation/retry | 10 |
| Deterministic outcome/workflow | 7 |
| Exact-answer BrowseComp-style clones | 11 |
| Multi-source reasoning | 9 |
| Short synthesis | 9 |
| Context pressure | 9 |
| Gap/abstention | 8 |
| Repair/verifier fixtures | 8 |

### Runner commits in the hyperagent repo

- `7b22f4c1891b2311dba903142d436e164f398d69` — external task files and repeats.
- `c20f2f4f57acb66dca846a5d41b1bfe51454fb6d` — `difficulty_prior` support plus DuckDuckGo/search diagnostics.
- `9fe392980a7769626a39747a9a608fc91193f038` — positive SFT role mapping.
- `0ba5803aa6e89da6d888381f17317534c3d8b64c` — action-error feedback plus 5s action timeout support.

## Pilot results

### Pilot A — balanced 8-task ranking probe before fixes

- **Output**: `/tmp/ber173-ranking-pilot-8x2-20260615T1400Z`
- **Setup**: 8 tasks × 2 repeats; Google-backed search before runner fixes.
- **Outcome**: 16 requested, 2 completed/verifier-pass, 0 keepable before the `sft_role` fix, reward mean 0.125.
- **Observed pattern**: only BBB-002 succeeded 2/2. Many tasks hit step caps, and Google CAPTCHA/sorry pages distorted search-heavy tasks.

### Pilot B — same balanced probe with DuckDuckGo and difficulty mapping

- **Output**: `/tmp/ber173-ranking-pilot-8x2-20260615T1408Z`
- **Setup**: same 8 tasks × 2 repeats, now using DuckDuckGo and correct `difficulty_prior` mapping.
- **Outcome**: 16 requested, 2 completed/verifier-pass, 0 keepable before the `sft_role` fix, reward mean 0.125.
- **Observed pattern**: difficulty mapping was fixed and repeated-URL diagnostics were added, but BBB-002 remained the only 2/2 success.

### Pilot C — easy Stage-1 positive frontier

- **Output**: `/tmp/ber173-easy-frontier-10x2-20260615T1415Z`
- **Setup**: 10 easy Stage-1 positive tasks × 2 repeats.
- **Outcome**: 20 requested, 6 completed/verifier-pass/keepable, reward mean 0.300.
- **Stable successes**: BBB-002, BBB-006, and BBB-007 were all 2/2 keepable.
- **Failures**: BBB-001/003/004/005 repeated extraction or repeated the same URL; BBB-008 entered a stale click loop; DET-001 hit a GitHub click-timeout loop; DET-003 hit an npm Cloudflare/challenge loop.

### Pilot D — feedback/timeouts frontier rerun

- **Output**: `/tmp/ber173-frontier-feedback-6x2-20260615T1436Z`
- **Setup**: feedback/timeouts rerun on BBB-001, BBB-002, BBB-003, BBB-006, BBB-008, and DET-001 × 2 repeats.
- **Outcome**: 12 requested, 5 completed/verifier-pass/keepable, reward mean 0.417.
- **Stable successes**: BBB-002 and BBB-006 stayed 2/2.
- **Improved**: DET-001 improved to 1/2.
- **Still failing**: BBB-001/003 repeated extraction or the same URL; BBB-008 remained in a stale-ref loop.

## Interpretation

The raw student has narrow direct official-doc lookup competence. It is not yet ready for broad Stage-2/3 research, BrowseComp-style exact-answer tasks, synthesis tasks, or gap/abstention tasks.

The first training/eval frontier should overweight simple browser basics and quote grounding. It should also explicitly train recovery from repeated extraction, stale refs, blocked pages, and missing final-answer emission.

For SFT, use teacher traces for Stage 1. Raw successes are useful diagnostics but are not enough data, and negative/verifier fixtures should remain verifier/repair-only rather than positive loss targets.

## Recommended next actions

1. Rank the remaining easy official-doc tasks or generate teacher traces for Stage 1.
2. Add recovery-specific tasks and repair examples:
   - repeated extract → evidence/final answer,
   - stale ref → reobserve/goto/extract,
   - blocked Cloudflare/login → limitation answer or alternate source.
3. Avoid scaling the full 80-task raw probe until basic finalization and recovery improve.
