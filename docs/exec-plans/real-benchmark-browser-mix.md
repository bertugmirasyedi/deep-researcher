# Real Benchmark-Derived Browser-Agent Mix

- **Issue**: BER-172
- **Status**: Draft final mix plan
- **Decision source**: [D018](../decisions.md#d018-browser-native-single-agent-curriculum-over-plain-teacher-distillation), [browser-native curriculum](browser-native-curriculum.md), and the historical [browser task bank](browser-task-bank.md)
- **Last updated**: 2026-06-15

## 1. Correction and scope

The BER-171 task bank is now treated as a **historical bootstrap draft**: useful for augmentation patterns, negative fixtures, verifier stress tests, and fresh non-overlapping clone generation, but **not** the backbone of the final curriculum. The final browser-agent curriculum should be anchored in real benchmark families and their documented task distributions, with synthetic tasks demoted to:

1. filling train-only gaps where public benchmark items must stay held out;
2. generating reward-hacking and verifier-negative fixtures;
3. creating fresh clone/templates that preserve a benchmark's skill shape without copying prompt/entity/source/answer tuples.

This document does not run a browser, student model, SFT, RL, or ResearchRubrics scoring. It defines the data-source mix, split policy, first 50-100 trace sample, and a later raw-student probe proposal.

## 2. Contamination policy

Default rule: **public benchmark items are eval-only unless the benchmark explicitly provides a train split, license/access permits training, and the item is isolated from any held-out leaderboard/test split**.

Operational policy:

- **No training on held-out eval or leaderboard items.** This includes BrowseComp released benchmark items unless an explicitly training-licensed split is identified and isolated.
- **Train only from permitted train/dev splits or fresh non-overlapping clones.** Fresh clones must change entities, sources, answer keys, dates, domains, and surface wording.
- **Split by semantic key, not rendered trace.** Dedupe on normalized prompt, target entity/entities, answer string, source URLs/canonical domains, constraint tuple, and any benchmark item id.
- **Keep public benchmark evals quarantined.** Store item ids and hashes in an eval registry; never reuse those entities/answer/source tuples in train.
- **Use rubric/eval frameworks as eval inspiration unless split/licensing says otherwise.** DeepResearch Bench / ResearchRubrics-style prompts are primarily eval-only or internal prompt-shape references.
- **Record provenance per trace.** Every generated trace should carry `source_family`, `source_split`, `license/access note`, `clone_of_family_not_item`, and dedupe keys.

## 3. Benchmark inventory

| Benchmark / suite | Primary skill tested | Scale / task count | Runtime mode | Evaluation style | Data availability / access notes | Contamination risk | Recommended use in our mix |
|---|---|---:|---|---|---|---|---|
| **BrowseComp** | Exact-answer hard web research; creative search, persistence, clue chaining | 1,266 human-created questions after removals from 1,287 | Live web browsing benchmark; short-answer tasks | Short exact answers, exact-match / verifiable answer checking | Public OpenAI benchmark pages: arXiv/PDF, Kaggle benchmark, Inspect evals | **High**: exact prompts/entities/answers are public and leaderboard-like | **Held-out eval + dev-safe probe source**. Train only on fresh BrowseComp-style clones with different entities/source paths. Anchor exact-answer browser research category. |
| **WebWalkerQA** | Website traversal QA from a root site; following links/menus to buried answers | 680 QA pairs, 4 scenarios, >1,373 webpages | Web traversal over provided/target websites | QA accuracy plus action count / traversal efficiency; human verified | Paper/PDF and Hugging Face dataset access paths | Medium/high if exact site-question pairs copied | **Train/val if split/license permits; otherwise eval/dev.** Strong source for search/navigation/retry and context traversal traces. |
| **WebVoyager** | Real website browsing/navigation, information finding, form/filter workflows | 643 tasks across 15 popular real websites | Live real-web navigation | Task success judged by human annotations and automated vision/LLM-style analysis | Public benchmark/project materials and common leaderboard use | Medium: popular tasks/sites may be memorized; live pages drift | **Validation/eval and action-pattern source.** Use clones for training where exact tasks are avoided. Good for browser grounding and retry. |
| **WebArena** | Outcome-based tasks in realistic web apps: shopping, forums, GitLab-like, maps, etc. | 812 tasks | Self-hosted reproducible web apps | Programmatic/outcome-based checks where possible | Public environment/benchmark ecosystem; reproducible deployment | Medium: benchmark tasks public; less live-web contamination but task ids must be isolated | **Train/val if train split/license permits; eval otherwise.** Excellent deterministic verifier source for browser basics and negative fixtures. |
| **Mind2Web / Online-Mind2Web** | Website task decomposition and action prediction from human traces; live-style web agent variants | Mind2Web has 2,000+ tasks across 137 real websites; Online-Mind2Web variants are smaller maintained live-style sets | Original is offline/static recorded traces; online variants are live-style | Element/action sequence prediction, task completion in online versions | Dataset/repo access commonly available; check split/license before training | Medium/high for exact website-task-action tuples | **Train from allowed training split for action grounding; eval on online/held-out.** Strong for browser basics, action grounding, and retry policies. |
| **WebLINX** | Imitation/action patterns from recorded browser sessions; dialogue-conditioned web navigation | Offline benchmark from recorded web sessions | Offline/static traces with cached/recorded web context | Action prediction / navigation quality from recorded sessions | Dataset/repo access paths; verify license and split | Medium if traces copied into both train/eval; lower live-web realism | **Train/template source for SFT-A/B action patterns** if license permits; not primary held-out live eval. |
| **WorkArena** | Enterprise/workplace browser workflows and knowledge-worker tasks | Commonly cited as 33 browser-based enterprise tasks | Browser tasks over workplace-like apps, often self-hosted/service-like | Outcome/task completion | BrowserGym/WorkArena ecosystem; access may require environment setup | Medium; domain-specific workflows can overfit | **Secondary train/val/eval source** for workplace action patterns. Useful but less central to cited research browsing. |
| **MiniWoB++** | Primitive UI/browser control: clicking, typing, selecting, small web forms | Many small synthetic/toy tasks | Synthetic toy web environment | Programmatic success/failure | Public classic browser RL benchmark | Low semantic contamination, but high distribution mismatch | **Train warm-up / negative fixture source only.** Use for action primitives, not research-quality evaluation. |
| **GAIA** | General assistant multi-step reasoning with tools/web/files; web-reasoning subcases | Public benchmark with levels and held-out/test splits | Mixed tool-use; not purely browser-native | Exact/final-answer scoring and official leaderboard protocols | Public/dev splits; test/leaderboard guarded | **High**: widely public, likely contamination; non-browser tools may conflict with D018 | **Eval-only / dev-safe probe source.** Use prompt shapes for multi-step web reasoning; do not train on held-out items. |
| **DeepResearch Bench / Deep Research Bench II / ResearchRubrics-style** | Long-horizon deep research synthesis, citations, rubric satisfaction, source quality | DRB: 100 expert-crafted tasks; DRB-II: 132 tasks and 9,430 atomic rubrics | Live deep-research agent evaluation | RACE/FACT or atomic rubric-based LLM/human evaluation | Public papers/websites/repos; ResearchRubrics is more an eval methodology than a single training corpus | **High**: prompts/rubrics public; overfitting risk severe | **Eval-only and internal audit inspiration.** Use for long-horizon synthesis categories and rubric/checklist design, not as train items without strict split controls. |
| **FRAMES** | Multi-hop factual QA over many sources; evidence aggregation and frame reasoning | Benchmark scale varies by release; use only after access check | Usually offline/QA-oriented, not necessarily browser-action native | Answer accuracy / evidence reasoning | Public paper/dataset paths should be verified before use | Medium: may be in public QA corpora | **Secondary eval/template source** for multi-source corroboration and context pressure; train only via fresh browser clones. |
| **HLE / SimpleQA-like factuality benchmarks** | Factual exact-answer calibration and abstention | Large/static factual QA sets depending on benchmark | Offline QA, not browser navigation | Exact/factual answer grading, sometimes abstention/calibration | Public benchmark releases; not browser traces | Medium/high for public QA; weak browser realism | **Eval inspiration / negative-abstention source only.** Useful for answer calibration, not browser trace training. |
| **OSWorld** | Desktop/OS-level agent control across applications | Large OS interaction benchmark, not browser-specific | Live desktop/VM-style environment | Task success in OS apps | Public ecosystem; heavier environment | Low direct overlap but off-target | **Reject for core mix; secondary only** if we later train desktop control. Browser-adjacent but not central to Deep Research. |
| **BrowserGym / Steel leaderboard ecosystem** | Infrastructure and comparable browser-agent evaluation across suites | Aggregates/unifies benchmarks rather than a single task corpus | Environment/leaderboard ecosystem | Suite-specific metrics across WebArena, WebVoyager, WorkArena, etc. | Useful infra references; leaderboard results public | High if optimizing to leaderboard tasks | **Infrastructure/eval ecosystem, not training data.** Use to standardize wrappers and locate suite-specific splits. |

Count: **14** benchmark families/suites inventoried or explicitly rejected/secondary.

## 4. Category-to-benchmark mapping

| Final mix category | Primary benchmark anchors | Secondary anchors | How to use |
|---|---|---|---|
| Browser basics / action grounding | Mind2Web train split if allowed; WebLINX; WebArena; MiniWoB++ | WorkArena | Use permitted train traces for click/type/select/scroll/extract behavior. MiniWoB++ only warms up primitives; do not let it dominate. |
| Search / navigation / retry | WebWalkerQA; WebVoyager; Mind2Web/Online-Mind2Web | WebArena, WorkArena | Sample tasks requiring menu traversal, SERP reformulation, backtracking, and action-count efficiency. |
| Exact-answer browser research | BrowseComp | GAIA web subcases, FRAMES/HLE-like factuality | Keep BrowseComp real items for held-out eval/probe. Train on freshly authored BrowseComp-style clones with exact-answer verifier keys. |
| Multi-source corroboration | BrowseComp-style clones; GAIA dev-safe items; FRAMES | DeepResearch Bench / ResearchRubrics-style | Require 2-4 independent sources, source-type diversity, and claim-evidence alignment. |
| Gap / uncertainty / abstention | BrowseComp-style failed-lead clones; HLE/SimpleQA-like abstention variants; GAIA | DeepResearch/Rubrics negatives | Generate non-answerable or under-supported browser tasks; score checked places and refusal to overclaim. |
| Long-horizon deep research synthesis | DeepResearch Bench / DRB-II / ResearchRubrics-style prompts | GAIA, BrowseComp-hard, FRAMES | Mostly eval-only. Train on fresh internal prompts that mimic structure but not topics/entities/rubrics. |
| Context compression / recall pressure | BrowseComp multi-candidate clones; WebWalkerQA long traversal; DeepResearch-style multi-source tasks | FRAMES, GAIA | Select tasks with many candidate pages or evidence cards; require `stash_finding`, `recall_finding`, `compress_findings`, and `context_usage` only when useful. |
| Negative / reward-hacking / verifier fixtures | Synthetic fixtures derived from failure modes in all families | WebArena deterministic outcomes; MiniWoB++ bad-action toy tasks | Synthetic is appropriate here: fake citations, source stuffing, duplicate sources, captcha/login walls, primitive spam, unsupported quotes. |
| Held-out eval | BrowseComp; WebWalkerQA; WebVoyager; WebArena; Online-Mind2Web; GAIA; DRB/DRB-II | WorkArena, FRAMES | Frozen without replacement. Never train on exact prompt/entity/source/answer tuples. Use suite-native metrics where available plus our verifier gates. |

No final category is synthetic-only. Synthetic generation remains allowed only as augmentation or negative-fixture production around benchmark-derived skill shapes.

## 5. Recommended first 50-100 trace mix

Target the first **80 traces** as a verifier-debuggable, benchmark-derived bootstrap. If only 50 traces are affordable, preserve the same proportions with rounded counts.

| Source family / category | Share | 80 traces | 50 traces | Examples of what to sample |
|---|---:|---:|---:|---|
| Mind2Web / WebLINX / MiniWoB++ browser basics | 15% | 12 | 8 | Permitted train-split click/type/select/extract traces; MiniWoB++ primitive warm-ups capped at 3-5 examples. |
| WebWalkerQA / WebVoyager navigation and retry | 15% | 12 | 8 | Root-site traversal QA, ambiguous navigation, first-result rejection, menu-following, action-count-aware recovery. |
| WebArena / WorkArena outcome tasks | 10% | 8 | 5 | Self-hosted or deterministic app tasks with clear success state; use for verifier sanity and browser action robustness. |
| BrowseComp-style exact-answer clones | 15% | 12 | 7 | Fresh long-tail clue-chain questions with short answers, 2 independent sources, and exact-answer keys; no copied BrowseComp items. |
| GAIA / FRAMES-style multi-source reasoning clones | 10% | 8 | 5 | Multi-hop web questions requiring arithmetic/comparison/entity disambiguation and 2-3 evidence cards. |
| DeepResearch / ResearchRubrics-style short synthesis clones | 10% | 8 | 5 | 150-400 word cited syntheses with explicit uncertainty, source-quality distinctions, and rubric-like checklist gates. |
| Context compression / recall pressure tasks | 10% | 8 | 5 | Multi-candidate or 5+ source tasks that require source-preserving compression and later recall. |
| Gap / abstention tasks | 7.5% | 6 | 4 | Under-supported exact-answer tasks, conflicting statistics, login/contact-sales walls, or missing-current-year documents. |
| Negative / reward-hacking fixtures | 7.5% | 6 | 3 | Fake visited URLs, unsupported quotes, duplicate-source stuffing, forbidden-tool traces, context primitive spam. |

Sampling notes:

- Use **real benchmark train splits first** only when licensing and split policy allow it.
- Otherwise generate fresh clones from the benchmark's skill shape and record `clone_source_family`, not `benchmark_item_id`.
- Keep actual BrowseComp, GAIA held-out/test, DRB/DRB-II prompts, and leaderboard eval items out of SFT-A/SFT-B training.
- Include negative fixtures in both SFT-A repair/rewrite targets and SFT-B bad-action/process auxiliary targets.

## 6. Train / validation / evaluation split

Initial split for generated/permitted training corpus:

- **Train: 70%** — permitted public train split items and fresh non-overlapping clones.
- **Validation: 15%** — dev-safe items and clones, without replacement, used for mixture tuning and verifier regression.
- **Internal eval: 15%** — frozen clones and public dev/eval-safe items, without replacement.
- **External/held-out eval registry** — BrowseComp real items, suite test/leaderboard items, GAIA held-out/test, DRB/DRB-II public eval prompts, WebVoyager/WebArena/Online-Mind2Web held-out tasks as applicable.

Hard split constraints:

1. No entity, answer, prompt paraphrase, source URL cluster, or benchmark id crosses train/val/eval.
2. For exact-answer tasks, no answer string plus constraint tuple crosses splits even if prompt wording changes.
3. For website-action tasks, no exact site/task/action tuple crosses splits.
4. For long research prompts, no topic + required rubric checklist crosses splits.
5. Frozen eval is sampled without replacement and never used to select training examples.

## 7. Data fields to extract or store

For each candidate trace/item:

- `source_family`, `source_dataset`, `source_split`, `source_item_id_or_hash`.
- `license/access_status`, `train_allowed`, `eval_only_reason`.
- `category`, `difficulty`, `runtime_mode` (`live`, `offline`, `self_hosted`, `synthetic_fixture`).
- Prompt, target entity/entities, expected answer type, answer key/verifier oracle if available.
- Canonical domains/URLs, source-type requirements, independence requirements.
- Browser action trace events per [browser-native curriculum](browser-native-curriculum.md#6-trace-format).
- Evidence/context primitive events and verifier outcomes.
- Dedupe keys: normalized prompt, entity tuple, answer string, URL/domain cluster, constraint tuple, benchmark id.

## 8. Raw-student difficulty probe proposal (do not run here)

Use **12-16 items** from dev/eval-safe sources, selected before the run and frozen. The probe should use browser-only actions, deterministic verifier gates, and no SFT/RL updates.

Suggested source-family allocation:

| Probe slice | Count | Source rules | Purpose |
|---|---:|---|---|
| Browser basics | 2 | Mind2Web/WebLINX permitted dev examples or fresh clones; no held-out test | Can the raw student click/type/extract and cite visited pages? |
| Site traversal | 2 | WebWalkerQA dev-safe or fresh root-site traversal clones | Can it traverse menus and recover from wrong paths? |
| Real-web navigation | 2 | WebVoyager-style dev-safe clones across non-leaderboard sites | Can it handle live page drift and retry? |
| Exact-answer research | 3 | BrowseComp real dev/eval-safe items if allowed for probe only, otherwise fresh hard clones | Does it persist on obscure exact answers without fabricating? |
| Multi-source reasoning | 2 | GAIA/FRAMES-style dev-safe clones | Can it combine 2-3 sources and basic reasoning? |
| Gap/abstention | 2 | Fresh under-supported exact-answer clones or HLE/SimpleQA-like abstention variants | Does it stop instead of overclaiming? |
| Long synthesis/context | 1-3 | DRB/Rubrics-style fresh internal prompts, not public held-out prompts | Does it use evidence cards and compression coherently? |

Selection rules:

- Prefer benchmark **dev/train split items that are not leaderboard/test items**; if uncertain, use a fresh clone instead.
- Include at least one expected-insufficient-evidence task and one source-stuffing/fake-citation negative fixture.
- Cap max steps by slice: basics 8-12, traversal/navigation 15-20, exact-answer/multi-source 20-28, long synthesis 30-40.
- Score only deterministic gates: forbidden tool use, visited citation ledger, quote/span support, source count/diversity, exact answer when available, insufficiency correctness, and context primitive coherence.
- Record completion rate, verifier pass rate, fake-citation count, overclaim count, mean/median steps, and failure mode by source family.

## 9. Implementation order

1. Build an eval registry with item ids/hashes for BrowseComp, GAIA, DRB/DRB-II, WebVoyager, WebArena, WebWalkerQA, Online-Mind2Web, and any suite test split.
2. Audit licenses/splits before importing any public train split into SFT data.
3. Generate the first 50-100 traces from the mix above, preferring permitted train splits and fresh clones.
4. Render SFT-A/SFT-B with family/category labels and deterministic verifier results.
5. Run the raw-student probe only after harness/verifier smoke passes; this document intentionally does not run it.

## 10. Reference access paths

- BrowseComp: https://arxiv.org/html/2504.12516v1, https://cdn.openai.com/pdf/5e10f4ab-d6f7-442e-9508-59515c65e35d/browsecomp.pdf, https://www.kaggle.com/benchmarks/openai/browsecomp, Inspect evals BrowseComp page.
- WebWalkerQA: https://arxiv.org/abs/2501.07572, https://aclanthology.org/2025.acl-long.508.pdf, https://huggingface.co/datasets/callanwu/WebWalkerQA.
- WebVoyager: public benchmark/project and leaderboard materials for 643 tasks across 15 real websites.
- WebArena / BrowserGym / Steel: WebArena benchmark materials, BrowserGym ecosystem, and https://leaderboard.steel.dev/.
- Mind2Web / Online-Mind2Web: Mind2Web dataset/project materials and Online-Mind2Web benchmark pages.
- WebLINX: dataset/repo/paper materials for recorded browser-session imitation.
- WorkArena: BrowserGym/WorkArena papers and environment docs.
- MiniWoB++: public browser RL benchmark environment.
- GAIA: official benchmark/project materials and leaderboard split rules.
- DeepResearch Bench / Deep Research Bench II / ResearchRubrics-style: benchmark papers/sites and rubric methodology materials.
