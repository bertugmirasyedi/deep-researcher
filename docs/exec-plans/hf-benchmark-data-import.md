# Hugging Face Benchmark Data Import Plan

- **Issue**: BER-175
- **Status**: Draft import policy, docs-only
- **Decision source**: [D020](../decisions.md#d020-benchmark-first-data-imports-over-clone-heavy-purity), [Real Benchmark Browser Mix](real-benchmark-browser-mix.md), [Benchmark Browser Task Registry](benchmark-browser-task-registry.md)
- **Last updated**: 2026-06-15

## 1. Simplified policy

Use established benchmark datasets directly when their license, access terms, and split semantics allow it. The earlier clone-heavy policy was too conservative for this pet-project training program: we still need honest provenance and split labels, but we do **not** need leaderboard-clean claims for every public benchmark family.

Policy:

1. **Train on public benchmark train/dev data where allowed.** Public items are acceptable training data when the dataset license permits training and the item is not a hidden/leaderboard/test record.
2. **Validate on held-out items from the same families.** Hold out by dataset item id, domain, entity, answer, and source URL/domain cluster where possible.
3. **Keep a small untouched custom/fresh test.** This is the sanity-check set for claims about generalization beyond public benchmark familiarity.
4. **Label provenance honestly.** Public or potentially contaminated evals are reported as such; do not claim leaderboard-clean performance after related family data is used for train.
5. **Still quarantine hidden/test/eval-only items.** Encrypted BrowseComp/XBench or official test splits stay eval/probe-only unless the dataset owner explicitly grants train use.
6. **Synthetic data is no longer the backbone.** Synthetic and fresh clones remain useful for repair/verifier fixtures, abstention cases, and gap filling, but established datasets should be imported first.

## 2. Capability-to-dataset mapping

| Capability bucket | Primary HF/public datasets | Use now | Notes |
|---|---|---|---|
| Browser/action grounding | `osunlp/Mind2Web`; `anaisleila/computer-use-data-psai` browser subset; MiniWoB++/WebAppEval where usable | Train/val from allowed splits | Mind2Web has human action traces over many websites; PSAI adds screenshots/events/DOM/video with privacy/size caveats. |
| Navigation/retry | Mind2Web; OpenResearcher `web-bench` WebWalkerQA-ref; `nguyennguyen6bk/WebAppEval`; PSAI browser tasks | Train/val/probe | Prefer root-site traversal, retry, stale-click recovery, and official-source navigation examples. |
| Deterministic workflows | WebAppEval first; WebArena/WorkArena later if environments are set up | Feasibility phase before scale | WebAppEval evaluator specs (`string_match`, `dom_match`, `url_match`) are the simplest path to deterministic checks. |
| Exact-answer web research | OpenResearcher `web-bench` BrowseComp, SealQA, GAIA-text, WebWalkerQA; BrowseComp encrypted/eval-oriented subsets | Train only on train/dev-permitted records; eval/probe for encrypted/test | Use answer fields for exact gates; mark encrypted/eval-only configs as non-train. |
| Multi-source reasoning | GAIA-text; WebWalkerQA; SealQA/SealQA-ref; FRAMES-style data if imported; MiroVerse if accepted | Train/val from permitted splits; probe/eval for public challenge items | Require 2+ sources and source independence labels when available or generated. |
| Short synthesis / context pressure | `miromind-ai/MiroVerse-v0.1` full trajectories if gated access is accepted; otherwise teacher traces from WebWalkerQA/GAIA/SealQA prompts | Optional gated phase | MiroVerse has large browse/full-trajectory data but hybrid licenses and CC-BY-NC-4.0 trace terms. |
| Gap/abstention | HLE/SimpleQA-like records in OpenResearcher `web-bench`; hard/noisy SealQA; synthetic negatives | Mixed train/val; keep tests separate | Need explicit insufficient-evidence labels or verifier-generated hard negatives. |
| Repair/verifier fixtures | Synthetic/derived from benchmark failure modes; WebAppEval/WebArena outcome failures | Verifier/repair only | Bad traces are not positive imitation data. Use for quote support, fake citations, blocked pages, duplicate-source stuffing. |
| Held-out/custom test | Fresh custom tasks plus hidden/test/eval-only benchmark splits | Eval only | Small, untouched, without replacement; this is the honest sanity set. |

## 3. Candidate imports and status

| Dataset | Immediate usability | Train use | Schema/import notes | Caveats |
|---|---|---|---|---|
| `OpenResearcher/web-bench` | **High for metadata/QA import** | Config-dependent | Unified fields include `query_id`, `question`, `answer`; ref configs include URLs. Map to exact-answer, navigation, multi-source, and abstention buckets. | Wrapper is Apache 2.0, but original source licenses vary. BrowseComp/XBench may be encrypted or eval-oriented. |
| `osunlp/Mind2Web` | **High for Stage 1 action metadata/traces** | Yes if CC-BY-4.0 terms fit | Map `annotation_id`, `website`, `domain`, `subdomain`, `confirmed_task`, `action_reprs`, and `actions` with `operation`, `raw_html`/`cleaned_html`, `pos_candidates`, `neg_candidates`. | Offline/static traces; raw HTML can be large and should be bounded. |
| `miromind-ai/MiroVerse-v0.1` | **Medium: gated/large** | Only after access/license acceptance | Sample trajectory records into browser-process traces and synthesis/context-pressure buckets. | Gated HF access, 147k samples, hybrid licenses; browse traces are CC-BY-NC-4.0. |
| `nguyennguyen6bk/WebAppEval` | **Medium: env-dependent** | Likely useful after environment audit | Map task prompt plus evaluator specs to deterministic workflow tasks. | Must verify target apps/environments still run and evaluator contracts are reproducible. |
| `anaisleila/computer-use-data-psai` | **Medium: large/privacy review** | MIT, after filtering | Filter browser tasks; map screenshots/events/DOM/video to action-process examples and possibly SFT-B auxiliaries. | Multimodal and potentially privacy-sensitive; avoid committing raw media dumps. |

## 4. Registry/importer schema proposal

Importer output should extend the existing BrowserTask registry rather than invent a new shape:

| Registry field | Import mapping |
|---|---|
| `task_id` | Stable prefix plus dataset id, e.g. `M2W-{annotation_id}` or `WB-{config}-{query_id}`. |
| `source_family` | Dataset family/config: `Mind2Web`, `OpenResearcher/WebWalkerQA-ref`, `OpenResearcher/GAIA-text`, `WebAppEval`, `MiroVerse`, `PSAI`. |
| `source_status` | `permitted_train_split`, `public_dev_split`, `eval_only_reference`, `gated_pending`, `synthetic_fixture`. |
| `train_allowed` | Derived from license, split, access terms, and hidden/test status. |
| `source_dataset`, `source_config`, `source_split`, `source_item_id` | Exact HF dataset/config/split/id for provenance and dedupe. |
| `stage`, `category`, `difficulty_prior` | Deterministic mapping from dataset family/config plus optional item metadata; may be overridden by curation. |
| `prompt` | `question`, `confirmed_task`, WebAppEval task text, or trajectory objective. |
| `max_steps` | Defaults by family: Mind2Web basics 8-16; WebWalkerQA/navigation 16-24; exact research/multi-source 20-32; synthesis/context 32-48. |
| `verifier_gates` | Dataset-native answer/evaluator when available plus our visited URL, quote-span, evidence count, source independence, and abstention gates. |
| `oracle` | `answer` from QA datasets; WebAppEval evaluator spec; null plus verifier strategy when dynamic. |
| `trace_seed` | Action traces (`action_reprs`, `actions`, events) when present; otherwise prompt-only item for teacher generation. |
| `sft_role` | Positive for permitted good traces/items; `eval_only` for quarantined public eval/test; `repair_target_only`/`verifier_only` for derived negatives. |
| `dedupe_keys` | Dataset id, normalized prompt, entity tuple, answer string, website/domain, URL cluster, benchmark family/config. |
| `license/access_notes` | Required on every imported record. |

## 5. Immediate phases

### Phase A — Mind2Web Stage 1 import

Import Mind2Web train metadata/action tasks first. Use it for browser basics, action grounding, extraction, and simple navigation. Do not store unbounded HTML in the registry; keep hashes or bounded snippets for trace generation.

### Phase B — OpenResearcher web-bench Stage 2/validation import

Import WebWalkerQA-ref and GAIA-text first because they map cleanly to website traversal and multi-step QA. Import SealQA/SealQA-ref where license and split notes are clear. Treat encrypted BrowseComp/XBench configs as eval/probe-only until a safe train/dev use is confirmed.

### Phase C — Optional MiroVerse access

Request/accept gated MiroVerse access only after the first imports work. Sample full trajectories for short synthesis, context pressure, and browse-process imitation if the non-commercial trace license is acceptable for the experiment.

### Phase D — WebAppEval feasibility

Evaluate whether WebAppEval environments and evaluator specs can run reproducibly. If yes, use it as the deterministic workflow/outcome-check source before heavier WebArena/WorkArena setup.

## 6. Split plan

- **Within dataset families**: train/val split by item id and domain/entity/answer. For Mind2Web, also split by website/domain where feasible to measure domain transfer.
- **Across public QA/research items**: dedupe by prompt, named entities, answer string, source URL/domain cluster, and benchmark id/config.
- **Custom/fresh test**: keep a small set of non-overlapping tasks untouched until final sanity evaluation.
- **Eval labels**: mark public benchmark evals as `public_eval` or `contaminated_family_eval` if related public train/dev data was used.
- **No hidden/test leakage**: encrypted, official test, leaderboard, or license-restricted items are never converted into positive SFT training records.

Suggested first bootstrap order:

1. 35-45% Mind2Web / PSAI action-grounding records.
2. 25-30% OpenResearcher WebWalkerQA-ref / GAIA-text / SealQA prompt records for teacher trace generation and validation.
3. 10-15% WebAppEval deterministic tasks after feasibility.
4. 10-15% MiroVerse trajectory samples if gated access is approved.
5. 5-10% synthetic/derived repair and verifier fixtures.

## 7. Updates to prior BER-172/173 language

The earlier rule "public benchmark items are generally eval-only" is superseded. The new rule is narrower: **official hidden/test/leaderboard or license-restricted items are eval-only; public train/dev items may be used for training when license/access permits and provenance is labeled**. Fresh clones are still useful, but they are no longer required before every training example.

The benchmark-browser registry remains useful as a curated schema and staged capability map. Future importer work should populate that schema from HF datasets directly rather than hand-authoring clone-heavy task banks first.

## 8. Non-goals for BER-175

- No dataset download at scale.
- No browser/model/student/teacher runs.
- No SFT/RL or ResearchRubrics scoring.
- No claims of leaderboard-clean evaluation after public benchmark train data is used.
