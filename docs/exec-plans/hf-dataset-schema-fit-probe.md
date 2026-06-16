# HF Dataset Schema-Fit Probe

- **Issue**: BER-176
- **Status**: Docs-only schema-fit probe; no importer implementation
- **Date**: 2026-06-16
- **Inputs**: [HF Benchmark Data Import](hf-benchmark-data-import.md), [Benchmark Browser Task Registry](benchmark-browser-task-registry.md), [`data/browser-task-bank/benchmark-browser-tasks.json`](../../data/browser-task-bank/benchmark-browser-tasks.json), and the browser trace schema in the hyperagent repo.

## Executive recommendation

Import **Mind2Web train metadata/action records first**. It is CC-BY-4.0, ungated, has a train split with 1,009 instances, and already carries the fields needed to seed Stage-1 browser-action tasks: `annotation_id`, website/domain labels, `confirmed_task`, human-readable `action_reprs`, and structured `actions` with operations plus positive/negative element candidates. It still needs an adapter because the raw HTML is too large for the registry and the actions are offline DOM/action seeds rather than our BrowserTrace format.

Second priority is **OpenResearcher/web-bench WebWalkerQA-ref / GAIA-text / SealQA-ref** as prompt+answer+URL seeds for Stage-2 teacher trace generation and validation. It maps cleanly to BrowserTask prompt/oracle fields but does not provide browser actions or evidence quotes, so it is `oracle_only` rather than trajectory data.

Do **not** start with WebAppEval, PSAI, or MiroVerse at scale: WebAppEval is promising for deterministic workflow checks but environment reproducibility is not proven; PSAI is useful but large/multimodal/privacy-heavy; MiroVerse is gated and non-commercial.

## Probe method and constraints

This probe used Hugging Face dataset cards/API, Dataset Viewer first rows where available, and a tiny HTTP range sample for Mind2Web because its Dataset Viewer first-rows endpoint returned `501 Not Implemented`. No SFT/RL/model/browser runs were performed. No large media, DOM archives, videos, or full datasets were downloaded. Examples below are abbreviated field summaries, not raw dumps.

## Fit matrix

| Dataset/config | Probe result | Access/license | Observed shape | Recommended use |
|---|---|---|---|---|
| `osunlp/Mind2Web` / `default` / `train` | `adapter_needed` | Ungated, CC-BY-4.0; card reports train 1,009 instances | Offline website task with action sequence, raw/cleaned HTML, operation, positive/negative candidates | **First importer target** for Stage-1 action grounding and navigation trace seeds |
| `OpenResearcher/web-bench` / `webwalkerqa_ref`, `gaia_text`, `seal_ref`, `hle`; `browsecomp` checked | `oracle_only` for plain/ref splits; `reject_for_now` for encrypted BrowseComp/XBench-like splits | Ungated, Apache-2.0 wrapper; original-source licenses vary | Unified `query_id`, `question`, `answer`; ref splits include reference URLs in question text; encrypted BrowseComp rows are opaque ciphertext/base64-like strings | Prompt+oracle seeds for teacher trace generation, validation, and eval/probe; no trajectory import |
| `nguyennguyen6bk/WebAppEval` / `train` preview | `env_blocked` + `adapter_needed` | Ungated preview; card says full dataset/eval/env live in GitHub Docker setup | `task_id`, `task_description`, `task_type`, `start_url`, `steps`, `require_login`, JSON `eval` specs (`string_match`, `dom_match`, `url_match`) | Deterministic workflow/verifier tasks after Docker env feasibility check |
| `anaisleila/computer-use-data-psai` / `train` | `adapter_needed`; supplemental only | Ungated, MIT; card reports 3,167 tasks, 7.87GB parquet and 49.2GB with video/DOM archives | Browser/computer task metadata, difficulty, app/site labels, screenshots, video path, DOM zip path, event JSON | Supplemental action/process data after privacy/media filtering; do not ingest raw media by default |
| `miromind-ai/MiroVerse-v0.1` | `gated_pending` | HF API reports `gated: auto`, license CC-BY-NC-4.0, 100K-1M size category | Card metadata lists configs such as `MiroVerse-v0.1-all` zip SFT and multiple JSONL SFT configs; rows inaccessible without accepted access | Defer until access/license decision; possible synthesis/context-pressure trajectory source |

## Observed schema samples and field summaries

### Mind2Web

Card fields: `annotation_id`, `website`, `domain`, `subdomain`, `confirmed_task`, `action_reprs`, and `actions`. Each action contains `action_uid`, `raw_html`, `cleaned_html`, `operation` (`CLICK`, `TYPE`, `SELECT`, with optional value), `pos_candidates`, and `neg_candidates`.

Tiny range sample confirmed the documented shape. The first visible record is a Tock restaurant task: `website=exploretock`, `domain=Travel`, `subdomain=Restaurant`, task text similar to checking pickup restaurant availability in Boston, NY at a specific date/time/party size, with action representations such as selecting pickup, typing Boston, selecting date/time, and updating search.

Suitability:

- Provides browser actions: **yes**, as offline action operations and human-readable action strings.
- Provides observations/DOM/screenshots: **DOM/HTML yes**, screenshots no in the sampled schema.
- Provides answer/oracle: **implicit task completion only**, not a final QA answer.
- Provides evidence URLs/quotes: **no**.
- Risk: raw HTML is hundreds of MB/GB across files; importer must hash or bound snippets and avoid storing full HTML in the registry.

### OpenResearcher/web-bench

Dataset card lists splits: `gaia_text` (103), `hle` (2,158), `seal` (111), `seal_ref` (111), `webwalkerqa` (680), `webwalkerqa_ref` (680), `xbench` (100), `browsecomp` (1,266), and `browsecomp_zh` (289). All checked accessible splits share fields `query_id`, `question`, `answer`.

Sampled `webwalkerqa_ref` rows include a natural-language question, reference URLs embedded in the question text, and a concise answer. Example field shape: `query_id=0`, question asks which program funded the SUPPLY project and includes an EHA reference URL, answer names EU4Health plus start date/duration. `gaia_text` rows are multi-step QA with concise answers. `browsecomp` rows sampled as opaque encrypted strings for both `question` and `answer`, so those records are not trainable prompt seeds without an explicit decryption/eval policy.

Suitability:

- Provides browser actions: **no**.
- Provides observations/DOM/screenshots: **no**.
- Provides answer/oracle: **yes** for plain/ref splits; encrypted for BrowseComp/XBench-like rows.
- Provides evidence URLs/quotes: **URLs only in ref question text for ref splits; no quotes**.
- Risk: wrapper license is Apache-2.0, but original benchmark licenses and intended split semantics still need per-split provenance labels.

### WebAppEval

Dataset card says the HF repository is a lightweight JSONL preview and that full nested task definitions, Dockerized web application environments, evaluation rules, and scripts live in the GitHub repository. Dataset Viewer fields are `task_id`, `task_description`, `task_type`, `start_url`, `steps`, `require_login`, and `eval`.

Sample rows show deterministic evaluator specs. One lookup task starts at `__SHOPPING__`, asks for the first Gear > Watches product by ascending position, and has `eval_type: ["string_match"]` with an exact expected value. Another operation task requires login and has a `dom_match` evaluator over a review table.

Suitability:

- Provides browser actions: **no trajectory actions in preview**.
- Provides observations/DOM/screenshots: **no** in HF preview.
- Provides answer/oracle: **yes**, via JSON evaluator specs.
- Provides evidence URLs/quotes: **no**.
- Risk: start URLs are environment placeholders such as `__SHOPPING__` and `__LMS__`; importer must not mark train/eval runnable until Docker environment setup and evaluator execution are verified.

### PSAI computer-use data

Card reports 3,167 completed tasks, including 2,220 browser tasks, with videos for all tasks, screenshots for 42.6%, and DOM snapshots for 55.8% overall / 77.5% of browser tasks. Dataset Viewer features include `unique_data_id`, `taskId`, `task_name`, `category`, `subCategory`, `application_website`, `tags`, `benchmark`, `appType`, `difficulty`, `os`, `requires_login`, `reasoning_steps`, `metadata`, `screenshots`, `video_file`, `dom_snaps_file`, and `events`.

Sampled rows were `BROWSER_TASK` records for FoxNews navigation/search tasks. They include app/site labels, easy difficulty, no-login flag, references to screenshot assets, video paths, DOM zip paths, and serialized low-level event streams.

Suitability:

- Provides browser actions: **yes**, as event streams rather than semantic BrowserAction steps.
- Provides observations/DOM/screenshots: **yes**, but large and multimodal.
- Provides answer/oracle: **usually task-completion/process, not deterministic QA answer**.
- Provides evidence URLs/quotes: **not directly**.
- Risk: large media/DOM footprint, website privacy/copyright concerns, event-to-action normalization cost, and possible proprietary task labels.

### MiroVerse

HF API reports the dataset exists, is public metadata but `gated: auto`, license `cc-by-nc-4.0`, and size category `100K<n<1M`. Dataset server sampling is blocked without accepted access. Card metadata lists configs including an all-SFT zip plus multiple JSONL SFT configs for multihop QA/research families.

Suitability cannot be validated at row level yet. Treat as `gated_pending` until terms are accepted deliberately and a small sample is inspected.

## Mapping to BrowserTask registry fields

| BrowserTask field | Mind2Web | OpenResearcher/web-bench | WebAppEval | PSAI | MiroVerse |
|---|---|---|---|---|---|
| `task_id` | `M2W-{annotation_id}` | `WB-{split}-{query_id}` | `WAE-{task_id}` | `PSAI-{unique_data_id}` | `MVR-{config}-{row_id}` after access |
| `source_family/status/dataset/config/split/item_id` | `Mind2Web`, `permitted_train_split`, default/train, annotation id | `OpenResearcher/{split}`, split-specific; encrypted splits eval/reject | `WebAppEval`, env-blocked until Docker check | `PSAI`, permitted after filter/privacy review | `MiroVerse`, gated pending |
| `prompt` | `confirmed_task` | `question` with reference URL extraction when present | `task_description` | `task_name` | likely instruction/query after access |
| `stage/category/difficulty_prior` | Stage 1 warmup/navigation; derive category from website/domain/action ops; difficulty from action count/domain | Stage 2 QA/research; difficulty by split and answer/source complexity | Deterministic workflow; difficulty from steps/login/eval type | Browser basics/navigation; difficulty from dataset field | Synthesis/context pressure if trajectories validate |
| `oracle/verifier_gates` | action-target sequence gates; no answer key | `answer`, URL/reference gates, exact-answer or rubric-lite gates | parsed `eval` JSON (`string_match`, `dom_match`, `url_match`) | task-completion/event consistency; weak oracle | unknown until sampled |
| `trace_seed/action data` | `action_reprs`, `actions.operation`, bounded candidate/HTML refs | none | no actions in HF preview | event stream + screenshots/DOM refs | likely full trajectory/messages after access |
| `sft_role/train_allowed` | positive seed if train split/license accepted | prompt seed/teacher trace target; train only for permitted non-hidden plain/dev splits | verifier/eval workflow until env runnable | supplemental positive/auxiliary after filtering | gated/non-commercial decision required |
| `dedupe_keys/license_access_notes` | annotation id, website/domain, normalized task, action count; CC-BY-4.0 | split, query id, normalized question, answer, URLs, original benchmark; Apache wrapper/original varies | task id, env placeholder, evaluator expected values; preview/full GitHub env note | unique id, website/app, category, task name, media refs; MIT/privacy notes | config/row id; gated CC-BY-NC-4.0 |

## Mapping to BrowserTrace/evidence concepts

- **Browser actions**: Mind2Web and PSAI provide action/process seeds, but neither is already our `browser.search/goto/click/type/scroll/extract/evidence_card/final_answer` trace. Mind2Web maps most cleanly because operations are semantic (`CLICK`, `TYPE`, `SELECT`) and candidates point to DOM targets. PSAI needs event-to-semantic-action compression.
- **Observations/DOM/screenshots**: Mind2Web has raw/cleaned HTML before actions; PSAI has screenshots, videos, DOM zips, and events; WebAppEval preview and OpenResearcher web-bench do not include observations.
- **Answer/deterministic oracle**: OpenResearcher has `answer`; WebAppEval has evaluator JSON; Mind2Web has task/action success but not answer text; PSAI is process-heavy with weaker oracles.
- **Evidence URLs/quotes**: OpenResearcher ref splits provide URLs but not quote spans; Mind2Web/PSAI can produce observed DOM text after bounded extraction; WebAppEval can check outcome but not citation support.

## Suitability verdicts and risks

### Mind2Web — best first import, `adapter_needed`

Use it to create Stage-1 BrowserTask records and trace seeds. The minimum viable importer should avoid raw HTML persistence, normalize CLICK/TYPE/SELECT into a trace-seed schema, and keep only bounded candidate snippets or hashes. It is not a final evidence/citation trace by itself; teacher or converter logic still needs to produce BrowserTrace events and verifier-friendly evidence if used for SFT-A.

### OpenResearcher/web-bench — prompt/oracle import, `oracle_only`

Use plain/ref splits as prompt+answer seeds. WebWalkerQA-ref is especially useful because URLs are in the prompt text; GAIA-text and HLE help exact/multi-step reasoning. Encrypted BrowseComp and XBench-like rows should be `reject_for_now` or eval-only until there is an explicit authorized decryption/eval policy. This dataset should feed teacher trace generation, validation sets, and oracle-based probes rather than direct process imitation.

### WebAppEval — deterministic verifier candidate, `env_blocked`

The evaluator schema is attractive and close to our `verifier_gates` field, but the HF preview alone is not a runnable environment. Do not import as executable tasks until Docker apps, placeholder URL resolution, login fixtures, and evaluator execution are proven. Once feasible, it can become the best deterministic workflow source.

### PSAI — supplemental action/process source, `adapter_needed`

Useful for broad browser/computer action patterns and event recovery examples, but too heavy for first ingestion. Start with metadata-only filtering of `category == BROWSER_TASK`, no-login tasks, easy/medium tasks, and bounded event snippets; keep videos/DOM zips external and uncommitted. Add a privacy/copyright review gate before positive SFT use.

### MiroVerse — `gated_pending`

Potentially valuable for full research trajectories and context-pressure tasks, but row-level schema was not sampled. Non-commercial CC-BY-NC-4.0 terms may be acceptable for a research/pet project but must be recorded before use. No importer work until access is intentionally accepted.

## Minimum importer shape for first target: Mind2Web

1. Read only `osunlp/Mind2Web` train metadata/action records; cap rows during development.
2. Emit one BrowserTask per `annotation_id` with:
   - `task_id = M2W-{annotation_id}`
   - `source_family = Mind2Web`
   - `source_status = permitted_train_split`
   - `source_dataset/config/split/item_id` provenance fields
   - `prompt = confirmed_task`
   - `stage = stage1_warmup` or `stage2_core_research` by domain/action count
   - `category` from operation mix and website/domain (`browser_basics_action_grounding`, `search_navigation_retry`, or deterministic workflow)
   - `difficulty_prior` from action count, required operation types, domain, and whether candidates are present
   - `trace_seed` containing bounded `action_reprs`, normalized operations, target candidate summaries, and hashes of raw/cleaned HTML
   - `oracle.answer_key = null`; verifier strategy = action-target / completion-task / optional live re-run gates
   - `sft_role = positive_sft_a` only after converter/teacher trace passes verifier
   - `license_access_notes = CC-BY-4.0; train split; raw HTML omitted/bounded`
3. Never store full `raw_html` or full `cleaned_html` in the registry. Store hashes, byte lengths, and bounded text/candidate snippets only.
4. Split by website/domain and normalized task entities so validation measures domain transfer where possible.
5. Add a converter later that maps offline actions to our BrowserTrace events or uses the prompt/action seed for teacher trace generation; do not pretend the raw record is already a verifier-passing BrowserTrace.

## Explicit non-go / no-go list

- Do not import encrypted BrowseComp/XBench rows as train prompts.
- Do not download or commit PSAI videos, DOM zips, or large screenshot payloads.
- Do not store Mind2Web raw HTML dumps in the task registry.
- Do not mark WebAppEval tasks runnable until Docker environments and placeholder URLs are verified.
- Do not accept MiroVerse gated terms automatically from an agent run.
- Do not train on hidden/test/leaderboard-only splits or claim leaderboard-clean evals after related public data is used in training.
- Do not implement importers in BER-176; this document is the schema-fit gate before ingestion.
