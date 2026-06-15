# Benchmark Browser Task Registry

- **Issue**: BER-173
- **Status**: Curated registry, no browser/model runs
- **Registry**: [`data/browser-task-bank/benchmark-browser-tasks.json`](../../data/browser-task-bank/benchmark-browser-tasks.json)
- **Raw-student pilots**: [BER-173 Raw-Student Ranking Pilot Results](ber-173-raw-student-ranking-results.md)
- **Decision source**: [D019](../decisions.md#d019-benchmark-anchored-browser-agent-data-mix-over-synthetic-templates) and [Real Benchmark-Derived Browser-Agent Mix](real-benchmark-browser-mix.md)
- **Last updated**: 2026-06-15

## Scope

This registry is a concrete, machine-readable browser-agent task bank for mid-training curation. It does **not** contain raw model traces, browser runs, hidden benchmark items, credentials, leaderboard/test prompts, or raw page dumps. Public benchmark families are used as skill-shape anchors; trainable entries are either permitted split references or fresh non-overlapping clones with changed entities, sources, and answer tuples.

## Schema

Each entry stores:

- `task_id`
- `source_family`
- `source_status`
- `train_allowed`
- `stage`
- `category`
- `difficulty_prior`
- `prompt`
- `max_steps`
- `verifier_gates`
- `oracle` with `answer_key` when safely known, otherwise a verifier strategy
- `sft_role`
- `dedupe_keys`
- `contamination_notes`
- `references/access_notes`

## Coverage

The registry contains **80 tasks**.

| Slice | Count | Notes |
|---|---:|---|
| Browser basics/action grounding | 9 | Mostly official-doc and primitive web lookup clones inspired by MiniWoB++, Mind2Web, WebLINX, and WebVoyager. |
| Navigation/retry | 10 | Website traversal, ambiguity rejection, official-source preference, and retry behavior. |
| Deterministic outcome/workflow | 7 | Public web app/documentation workflows with page-state or metadata gates. |
| Exact-answer BrowseComp-style clones | 11 | Fresh exact-answer tasks; actual BrowseComp items remain eval/probe only. |
| Multi-source reasoning | 9 | GAIA/FRAMES-like comparison, arithmetic, and source-corroboration tasks. |
| Short synthesis | 9 | DeepResearch/ResearchRubrics-style concise cited syntheses with deterministic checklist gates. |
| Context pressure | 9 | Multi-page/candidate tracking tasks requiring source-preserving compression or recall. |
| Gap/abstention | 8 | Expected-insufficient-evidence and public/private-boundary tasks. |
| Repair/verifier fixtures | 8 | Negative fixtures labeled only `repair_target_only` or `verifier_only`. |

Stage assignment:

- `stage1_warmup`: 22 tasks — action grounding, navigation, and deterministic public-page workflows.
- `stage2_core_research`: 26 tasks — exact-answer clones, multi-source reasoning, and short synthesis.
- `stage3_hardening_repair`: 24 tasks — context pressure, gap/abstention, and verifier/repair fixtures.
- `stage4_eval_probe`: 8 tasks — quarantined public benchmark references or dev-probe slots; no training render.

## Split and contamination policy

- Public benchmark items are eval/probe only unless an explicit train split and license/access status permits training.
- Actual BrowseComp prompts/items are not included as train candidates; trainable entries use fresh BrowseComp-style clones.
- Dedupe is by normalized prompt, entity tuple, answer key, canonical domains/source ids, benchmark id, and constraint tuple.
- Stage-4 entries are references/placeholders for eval selection and carry `train_allowed: false` and `sft_role: eval_only`.
- Negative/verifier fixtures are synthetic and intentionally not positive imitation targets.

## SFT roles

- `positive_sft_a` / `positive_sft_a_sft_b`: trainable positive browser-process tasks after trace generation and verifier acceptance.
- `repair_target_only`: bad trace or bad answer is converted into a corrected target; the bad behavior is never imitated.
- `verifier_only`: classification/checking fixture for process/verifier hardening.
- `eval_only`: quarantined probe/eval reference.

## Caveats

Several public pages can drift, especially package versions, pricing pages, and cloud/runtime tables. Those entries intentionally use `oracle.answer_key: null` plus a verifier strategy when the answer may change. Before rendering SFT traces, run a browser-only teacher trace and reject examples that fail visited-citation, span support, source-independence, or abstention gates.
