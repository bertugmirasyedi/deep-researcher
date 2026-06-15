# Decisions

Architectural and design decisions with rationale. Append new decisions to the end.

## Decision Log

### D001: Sequential pipeline over agentic loop

- **Date**: 2026-05-05
- **Context**: How should research stages be orchestrated?
- **Alternatives**: (A) Sequential pipeline: Plan → Search → Evaluate → Write. (B) Agentic loop: agent decides next step dynamically.
- **Decision**: Sequential pipeline.
- **Rationale**: Predictable, debuggable, each stage has clear inputs/outputs. Easier to test and reason about. The agentic approach risks infinite loops and unpredictable behavior for a task that naturally decomposes into ordered stages.
- **Tradeoff**: Less adaptive to surprising findings mid-research. Mitigated by allowing the Writer stage to flag gaps that trigger a targeted re-search.

### D002: Multi-query search per sub-question

- **Date**: 2026-05-05
- **Context**: How many search queries per sub-question, and how to vary them?
- **Alternatives**: (A) Single query per sub-question. (B) 2–4 queries with varied phrasing. (C) Iterative: search, review results, reformulate.
- **Decision**: 2–4 queries with varied phrasing (Option B).
- **Rationale**: Varying scope, angle, recency, and perspective maximizes coverage without the complexity of iterative reformulation. The Evaluate stage handles deduplication.
- **Tradeoff**: More API calls. Acceptable given the quality improvement in source coverage.

### D003: Three-tier confidence grading

- **Date**: 2026-05-05
- **Context**: How to express certainty in conclusions?
- **Alternatives**: (A) Numeric confidence (0–100%). (B) Three tiers (high/medium/low). (C) Five tiers. (D) No grading.
- **Decision**: Three tiers (high/medium/low) with mandatory justification.
- **Rationale**: Numeric confidence implies false precision. Five tiers add granularity without proportional value. Three tiers are actionable: high = rely on it, medium = verify before acting, low = treat as hypothesis.
- **Tradeoff**: Coarse granularity. Some conclusions may be "medium-high" with no clean fit. Justification text handles nuance.

### D004: Source quality tiers over binary trust

- **Date**: 2026-05-05
- **Context**: How to model source reliability?
- **Alternatives**: (A) Binary trusted/untrusted. (B) Continuous score (0–1). (C) Named tiers (A/B/C/D) with scoring criteria.
- **Decision**: Named tiers (A/B/C/D) with per-source scoring on 5 dimensions.
- **Rationale**: Named tiers are communicable in reports. Dimension scoring provides traceability for why a source got its tier. Binary is too coarse; continuous score is opaque.
- **Tradeoff**: More evaluation work per source. Acceptable because evaluation quality directly drives report quality.

### D005: Markdown as sole output format

- **Date**: 2026-05-05
- **Context**: What output format(s) to support?
- **Alternatives**: (A) Markdown only. (B) Markdown + HTML. (C) Markdown + PDF. (D) JSON for programmatic use.
- **Decision**: Markdown only, with three structural variants (brief/full/academic).
- **Rationale**: Markdown is universal, versionable, and renders everywhere. Avoids format proliferation. The three variants cover the main use cases (quick answer, thorough report, formal citation).
- **Tradeoff**: No PDF or HTML export. Can be added later as a post-processing step without changing the pipeline.

### D006: Context-and-skills pack, not application code

- **Date**: 2026-05-05
- **Context**: What is the nature of this repo?
- **Alternatives**: (A) Standalone application with its own runtime. (B) Context-and-skills pack for pi-coding-agent.
- **Decision**: Context-and-skills pack.
- **Rationale**: pi-coding-agent already provides the agent runtime, tool access, and skill system. Building a separate app would duplicate orchestration, tooling, and UI. A skills pack is lighter, composable, and leverages pi's existing capabilities (search, content extraction, thread management, workflow tracking).
- **Tradeoff**: Requires pi-coding-agent and Orca + Linear for orchestration and durable intent. Not portable to other agent frameworks without adaptation.

### D007: pi-threads for parallel search, pi-workflow for tracking

- **Date**: 2026-05-05
- **Context**: How to handle parallel search execution and multi-session progress tracking?
- **Alternatives**: (A) Sequential only — no parallelism, no formal tracking. (B) pi-threads for parallelism + pi-workflow for tracking. (C) Custom orchestration inside the skill.
- **Decision**: pi-threads + pi-workflow.
- **Rationale**: pi-threads provides named worker threads that map naturally to sub-questions — each thread searches and evaluates independently. pi-workflow provides phased plans with checkpoints, essential for deep research that spans sessions. Both are already-installed extensions in this user's setup. Custom orchestration would be reinventing what these extensions already do well.
- **Tradeoff**: Depends on two external extensions. If either is unavailable, the skill falls back to sequential single-threaded execution (still correct, just slower).

### D008: Researcher subagents + report archive

- **Date**: 2026-05-05
- **Context**: How to specialise parallel search workers and persist final reports?
- **Alternatives**: (A) Generic scout threads + inline output only. (B) Dedicated `researcher` subagents (project-level custom agent) + reports saved to `researches/` directory.
- **Decision**: Dedicated `researcher` subagents + report archival.
- **Rationale**: A project-level agent (`.pi/agents/researcher.md`) gives the search worker a focused system prompt with evaluation criteria, citation rules, and structured output format — producing higher-quality findings than a generic scout. Archiving reports under `researches/YYYY-MM-DD-<slug>.md` creates a persistent, version-controlled research history that later work can reference.
- **Tradeoff**: One more agent file to maintain. The `researcher` agent is project-local, not a builtin — it must exist in this repo for the skill to function correctly.

### D009: Orca + Linear supersede pi-threads + pi-workflow

- **Date**: 2026-05-28
- **Context**: pi-threads and pi-workflow extensions/skills were removed from the user's pi setup. Per `~/.pi/docs/agent-workflow/operating-model.md`, the canonical model is Linear (durable intent) + Orca Workspace Board (active cockpit) + Orca orchestration (runtime engine). The pi planner/worker role is frozen at process start via `ORCA_ROLE`.
- **Alternatives**: (A) Stay with pi-threads + pi-workflow even though they are removed (broken). (B) Reintroduce pi-thread-style event ledger + `progress.md` ad hoc inside this repo (rejected: reinvents removed machinery, contradicts user policy). (C) Move parallel dispatch to Orca orchestration and durable intent to Linear.
- **Decision**: Option C. Each `researcher` sub-question runs in its own Orca worker terminal (`ORCA_ROLE=worker pi`); coordinator collects `worker_done` payloads. Linear holds the per-run issue (always for `deep`, recommended for `standard`).
- **Rationale**: Matches the user's now-canonical operating model and the `orca-linear-workflow` skill. Each worker is an isolated pi process with its own context — same isolation property pi-threads provided. Linear's checklist + comment surface replaces `progress.md`/`features.json` with durable, multi-session-resumable intent. The runtime role split (planner vs. worker) prevents the snapshot-vs-ledger drift bugs the historical `/mode` toggle caused.
- **Tradeoff**: Boots a full pi process per worker (heavier than a pi-thread). Acceptable: empirically a 200+ source `deep` run is feasible (see `researches/2026-05-13-pi-workflow-improvement-ideas.md`), and the isolation/durability gains outweigh the spawn cost.
- **Supersedes**: D007.

### D010: Worker isolation envelope for researcher dispatch

- **Date**: 2026-05-29
- **Context**: After BER-63 migrated docs to `ORCA_ROLE=worker pi`, verification showed that stock pi has no built-in mechanism to load `.pi/agents/*.md`. Without an extension providing that loader, the plain `ORCA_ROLE=worker pi` invocation inherited the default coding-agent system prompt, `APPEND_SYSTEM.md`, the full `AGENTS.md` chain, all skills (including `deep-researcher` itself, which would recursively re-trigger), all extensions, and all default tools. This contradictory prompt + unrestricted toolset = prompt bleed.
- **Decision**: Add an isolation envelope around every researcher worker dispatch. The envelope uses `--system-prompt` to replace the default prompt with `researcher.md`, `--append-system-prompt /dev/null` to disable auto-discovery, `--no-context-files --no-skills --no-prompt-templates --no-extensions` to close context-leak channels, and a `--tools` allowlist to enforce the read-only contract. `bash` is deliberately whitelisted so the worker can call `orca orchestration send --type worker_done`; the per-task preamble carves out the restriction that bash may only be used for orchestration/Linear CLIs.
- **Rationale**: Each flag has a verified purpose and was tested against stock pi behavior. The envelope makes the worker a sealed Researcher process instead of a full coding agent, eliminating the prompt-bleed risk discovered after BER-63.
- **Tradeoff**: Slightly longer command line; requires keeping `--model`/`--thinking` in sync with `researcher.md` frontmatter by hand. The `bash` carve-out is a necessary escape hatch — without it, the worker could not report `worker_done`. We accept this because the per-task preamble explicitly restricts bash usage, and the worker's system prompt (`researcher.md`) contains no write/edit instructions.
- The envelope also uses `--extension /opt/homebrew/lib/node_modules/pi-web-access/index.ts` alongside `--no-extensions` to selectively re-enable the `pi-web-access` extension. Without this re-enable, the worker has no `web_search` or `fetch_content` (those tools are not built into stock pi). Verified that `--no-extensions` whitelists CLI-passed `--extension` paths at `pi-coding-agent/dist/core/resource-loader.js:271–273`.
- **Extends**: D009; does not supersede. D009 chose the Orca + Linear dispatch path (option α); D010 is the operational refinement that makes option α actually work without prompt bleed. `researcher.md` is reused unchanged.

### D011: Single-vendor Codex on Pro 20x; planner GPT-5.5, workers gpt-5.4-mini xhigh

- **Date**: 2026-06-08
- **Context**: AI-subscription consolidation review. Almost all model usage flows through `pi`. Measured usage (from `~/.pi/agent/sessions/` JSONL, last 30 days): ~650 messages/day account-wide → ~217 per 5-hour window on average; peak parallel-research swarm days reach ~1,000–1,800 messages per window. The `balancer-worker` role (parallel fan-out) drives ~75% of volume. Question: stack cheap third-party plans (GLM/Kimi/MiniMax/OpenCode Go) vs. one OpenAI Codex subscription, and which Codex tier.
- **Alternatives**: (A) Multi-vendor stack — route `balancer-worker` to a cheap API-native plan (~$10–30/mo) and keep Codex/Claude for planner+hard tasks; cheapest on $/throughput. (B) Single-vendor Codex Pro 5x ($100) with workers on `gpt-5.4-mini` at low/med thinking (fits the 5x window cap of ~1,750 even on peak swarm days). (C) Single-vendor Codex Pro 20x ($200) with planner on GPT-5.5 and workers on `gpt-5.4-mini` at **xhigh** thinking.
- **Decision**: Option C. All model traffic on the OpenAI Codex subscription (drives `pi` directly). Planner/interactive/hard tasks → GPT-5.5. Parallel research workers → `gpt-5.4-mini` at `xhigh` reasoning. Tier: **Pro 20x ($200)**.
- **Rationale**: User prefers single-vendor simplicity and GPT-5.x quality over the multi-vendor cost optimum. Codex window caps are per-model and token-size-dependent: GPT-5.5 has the lowest allowance (5x: 80–400, 20x: 300–1,600 per window); `gpt-5.4-mini` is far higher (5x: 300–1,750, 20x: 1,200–7,000). Choosing `gpt-5.4-mini` for the high-volume worker fan-out (instead of GPT-5.5) is what keeps swarms inside quota. `xhigh` reasoning improves source-eval quality but spends tokens, pushing workers toward the *bottom* of the range (~1,200–2,500 effective on 20x) — which still comfortably covers the ~1,000–1,800 peak-swarm load, but does **not** fit Pro 5x on peak days. Hence 20x.
- **Tradeoff**: ~$200/mo (≈$240 with the user's ~20% card FX/markup) vs. a ~$10–30 multi-vendor optimum — a deliberate premium for single-vendor simplicity + GPT quality. Escape hatch: dropping worker thinking from `xhigh` → low/med makes `gpt-5.4-mini` fit Pro 5x even on peak swarm days, enabling a fallback to $100/mo if budget pressure appears, at the cost of weaker worker reasoning. Keep `--model`/`--thinking` in `researcher.md` frontmatter and the dispatch envelope (D010) in sync with this choice (`gpt-5.4-mini`, xhigh).

### D012: Collapse three depth tiers into two behavior-defined modes

- **Date**: 2026-06-09
- **Context**: The `--depth` ladder had three tiers (shallow / standard / deep). "Standard" (the default) was 5 sub-Qs × 3 searches → 10–15 sources with no required `fetch_content` or iteration, so in practice it was satisfiable with a handful of `web_search` calls — a snippet skim, not research. The jump to "deep" was also a 20× cliff (10–15 → a 200-source minimum that was effectively unachievable with ~30 searches and reads like an aspirational typo).
- **Alternatives**: (A) Beef up `standard` only (require reads + iteration, ~20–30 sources), keep three tiers. (B) Recalibrate all three tiers and fix deep's 200-source cliff. (C) Collapse to two modes — `quick` (snippet scan) and `deep` (read + iterate + synthesize) — distinguished by behavior, not search count.
- **Decision**: Option C. Two modes: `quick` (3 sub-Qs, 2 searches, snippets ok, no iteration, min 5, inline single-threaded, no Linear) and `deep` (default; 6–8 sub-Qs, 4 searches, **`fetch_content` required** on top 4+/sub-Q, **≥1 refinement round required**, min 30, parallel Orca workers, always Linear).
- **Rationale**: What makes research "deep" is reading full sources and iterating — not raw search count. Making those two behaviors mandatory for `deep` (and naming the snippet-only path honestly as `quick`) fixes the "standard is just a couple web searches" problem at its root. Default is `deep` because the pack is a *deep* researcher; `quick` is the explicit fast opt-out. Dropping the deep minimum from 200 → 30 closes the unachievable cliff. A `deep` run that skipped reads or iteration must be relabeled `quick` in the report header rather than claiming `deep`.
- **Tradeoff**: Loses the middle tier's granularity — there is no longer a "medium" effort level. Acceptable: the middle was the muddy, mislabeled tier; two honest modes are a clearer mental model than three with a broken middle and an unreachable top. Updated across SKILL.md, docs/research-workflow.md, ARCHITECTURE.md, README.md, AGENTS.md. Existing research reports under `researches/` that cite the old tier names are left as historical record.

### D013: BER-139 floor check — qualified outcome 1 (proceed to evolution; harden harness first)

- **Date**: 2026-06-12
- **Context**: BER-139 floor check ran the raw student (`QuantTrio/Qwen3.6-35B-A3B-AWQ`, vLLM) through the unevolved single-agent organism (`organisms/deep-researcher-single-agent`, BER-140) on the 5 ResearchRubrics prompts, scored by the recovered BER-150 weighted-rubric judge (Bedrock Opus 4.8). Ran locally via the BER-151 eval path (no meta-agent). Results: `0.000, 0.000, 0.338, 0.460, 0.000`; mean 0.16, variance 0.040. Artifacts (per-sample `report.md` + `judge.json`) at `hyperagent:benchmarks/deep-researcher/floor-check/`.
- **Failure taxonomy** (verified against the captured reports/judge output, correcting the script's auto-labels): the 2 successes are substantive cited reports (AI/ML 0.46 / 26 KB / 13-of-34 criteria; Philosophy 0.34 / 35 KB / 16-of-43) — **capability is proven**. The 3 zeros are **NOT format failures** (no malformed/unparseable tool calls) and **NOT raw-capability failures**; they are **agentic-loop-reliability failures**: a 180-byte preamble stub written via premature `write_report` (605366), a 600 s timeout with 0 tool calls (605371), and an instant 12 s bail with an empty report (6054d0).
- **Decision**: **Qualified outcome 1** — proceed to evolution (BER-144), but harden the harness first with cheap guards: (a) reject `write_report` until >=1 `web_search` has occurred (kills preamble-stub reports), and (b) a tighter per-task timeout to terminate no-tool stalls instead of burning 600 s. Not outcome 2 (protocol/format is fine) and not outcome 3 (capability is demonstrated).
- **Rationale**: The base model can produce real, rubric-scoring research (0.46) and there is genuine fitness variance (0 -> 0.46) for evolution to optimize. The dominant failure mode — failing to *sustain* the research loop — is precisely what harness evolution (BER-144) and the SFT behavioral warm-start (BER-145) are designed to fix; much of the current variance is cheap-to-fix loop-failure noise that the two guards should convert into real scores immediately, reducing wasted eval budget before evolution.
- **Tradeoff**: "Proceed" carries the risk that a large share of early evolution fitness signal is loop-completion (organism scaffolding) rather than research quality; the pre-evolution guards mitigate this by raising the floor. Cost spent: ~$2 (student is free on vLLM; only the judge calls cost), well under the ~$20 BER-139 budget. The loop-reliability finding reinforces the planned SFT step (BER-145) and should be revisited if post-evolution scores stay capped by scaffolding rather than quality.
- **CORRECTION (2026-06-12, same day) — the "unreliable student" reading above was wrong; the failures were a harness bug**: Event-level tracing of a failing run showed a single `web_search` call (with batched queries) returning **1.49 MB** of full page content (~370K tokens), overflowing the student's 209K context so the *next* turn timed out. The "non-reproducible successes / instant bails / stub reports" were all symptoms of this context flood, not student behavior. The custom `web_search`/`fetch_content` tools (BER-140) returned raw `JSON.stringify` payloads, bypassing pi-web-access's native `MAX_INLINE_CONTENT` (30 KB) cap. **Fix** (matching native pi-web-access): `web_search` returns the synthesized answer + titles/URLs/snippets only (`includeContent` forced false); `fetch_content` caps each page at 30 KB. **Re-run after the fix: `0.298, 0.852, 0.213, 0.483, 0.504` — mean 0.47, variance 0.049, 5/5 success, 0 failures** (the 600 s-timeout prompt now scores 0.85). The two guards from the original Decision (web_search-before-write_report; timeout cap) are retained as cheap safety nets, but the content cap was the actual fix. **Corrected outcome: clean outcome 1** — the raw student is reliable and capable on the harness (mean 0.47, varied 0.21–0.85 quality), proceed to evolution (BER-144). No SFT-0 protocol bootstrap (BER-143) is warranted; the BER-145 SFT step remains a quality-lift, not a reliability rescue. **Lesson**: when re-wrapping native pi tools as custom tools, replicate their output-bounding — unbounded tool payloads masquerade as model unreliability.

### D014: Tiered judge — DeepSeek-V4-Flash in-loop reward + Opus 4.8 gate/selection

- **Date**: 2026-06-12
- **Context**: BER-144 evolution needs a per-report research-quality reward on the order of ~1,000 judge calls across the search. The calibrated/selection judge is Bedrock Opus 4.8 (BER-150 weighted-rubric LLM-as-judge; the judge D013's floor-check ran on). Running ~1,000 Opus calls for in-loop fitness is expensive (~$100s); the question was whether a cheap judge could carry the high-volume in-loop scoring while Opus stays the authority for gates and final organism selection.
- **Alternatives**: (A) Opus for everything — simplest, one calibrated judge, but ~1,000 Opus calls/run is the dominant evolution cost. (B) DeepSeek-V4-Flash (api.deepseek.com, OpenAI-compatible, ~50–100× cheaper) for everything — cheapest, but an uncalibrated cheap judge picking the winning organism risks selecting on judge bias, not quality. (C) **Tiered**: DeepSeek-V4-Flash for high-volume in-loop reward (averaged over draws), Opus 4.8 reserved for the held-out gate + final selection between top organisms (~100–150 calls).
- **Decision**: Option C. `judge_report.py` is backend-configurable (`--backend {opus,deepseek}` / `HYPERAGENT_JUDGE_BACKEND`, default `opus`) over a single shared prompt + weighted-compliance formula, so only the model call differs and the output JSON shape is identical. DeepSeek runs at its **HF-recommended sampling params** (temperature=1.0, top_p=1.0 — the card tunes for sampling, not greedy decoding; env-overridable via `HYPERAGENT_JUDGE_DEEPSEEK_TEMP`/`_TOP_P`). Per-call noise is beaten down by **averaging multiple judge draws per organism**, not by forcing temp=0.
- **Calibration** (5 evidence-v3 floor-check reports, DeepSeek temp=1.0/top_p=1.0 vs the stored Opus judge.json; `scorer/calibrate_deepseek.py`, results in `scorer/calibration_deepseek_temp1.json`): Pearson **r=0.85**, Spearman rank **0.70**, per-criterion agreement **87.6%** (156/178), mean abs composite diff **0.10**. Single-report noise (one report ×3): stdev **0.061**, range **0.138**. DeepSeek is **systematically lenient on weak reports** (sample 605383: ds 0.43 vs opus 0.21) — it compresses the bottom of the dynamic range.
- **Rationale**: 88% per-criterion agreement and r=0.85 mean DeepSeek tracks Opus well enough to provide a *useful gradient* for evolution at ~1% of the cost. But Spearman 0.70 + the leniency-on-weak-reports bias + ~0.14 single-call noise mean it is **not trustworthy for picking between near-tie organisms** — so selection and the go/no-go gate stay on Opus, where D013 was calibrated. Averaging draws converts the cheap-but-noisy in-loop signal into a stable-enough fitness number; the tier boundary keeps the authoritative low-volume decision on the calibrated judge.
- **Tradeoff**: Two judge backends to keep in sync (mitigated by the shared prompt/formula — only the model call branches). DeepSeek's bottom-end leniency means early-evolution fitness may under-separate weak organisms; acceptable because evolution mostly needs to rank *better* organisms up, and the Opus gate catches any organism that wins on DeepSeek bias rather than quality. Re-calibrate on the larger held-out set (BER-144 `held-out/`, 8 prompts) before trusting the in-loop reward at scale; if Spearman stays ≤0.7 there, raise the per-organism DeepSeek draw count or promote borderline organisms to an Opus tie-break earlier.
- **Builds on**: D013 (BER-139 clean outcome 1, Opus judge). Feeds BER-144 run config (judge-call budget = DeepSeek in-loop + Opus gate/selection).

### D015: Meta-agent (mutation proposer) = GPT-5.5 / medium reasoning

- **Date**: 2026-06-12
- **Context**: BER-144 open question #3. The meta-agent is the mutation proposer — the only frontier model call in the inner evolution loop (the task policy is the free vLLM student; the in-loop reward judge is DeepSeek per D014). hyperagent's default was `metaModel: 'openai-codex/gpt-5.4'`, `metaThinking: 'medium'` (`src/types.ts`). Need to pick the model + reasoning effort.
- **Alternatives**: (A) Keep gpt-5.4/medium. (B) GPT-5.5/medium. (C) GPT-5.5/high. (D) A non-GPT coder (e.g. Claude Opus 4.8) for mutation quality, breaking the single-vendor setup.
- **Decision**: **`openai-codex/gpt-5.5`, `metaThinking: medium`** as the config default for the first (loop-validation) run; **`--meta-thinking high` is the documented production override** if gen-1/2 mutations look shallow or repetitive.
- **Rationale**: The meta-agent is **low-volume / high-leverage** — at the 10-gen × 5-pop strawman it fires ~50 times, but each proposal steers the entire search, so quality compounds where it is cheapest to pay for. 5.5 over 5.4 is a quality upgrade exactly there. Stays single-vendor Codex (D011) — no second API dependency; rejecting (D). Quota is a non-issue at ~50 spread-out calls despite GPT-5.5 having the tightest Codex window cap. **medium first** because the first run mainly needs to confirm the loop produces valid, applyable mutations end-to-end before spending on deeper reasoning; **high** is the one knob worth raising for the real run since the judge (not the meta-agent) dominates cost, so raising meta reasoning is nearly free.
- **Tradeoff**: medium may under-reason on organism diagnosis vs high; mitigated by the explicit high-effort production override. GPT-5.5's tighter window cap is immaterial at this call volume.

### D016: Conventional train / validation / test split — test touched exactly once

- **Date**: 2026-06-12
- **Context**: The BER-144 plan used a single held-out set (8 prompts) both to gate/select organisms *and* as the reported generalization number, with acceptance criterion "held-out within 5% of evolution-set". User flagged this: **selecting which organism to promote on a held-out set turns that set into a validation set, and across many generations of selection pressure the search adaptively overfits it** — so reporting that score as generalization is a soft form of training on the test set (validation reuse / adaptive overfitting; cf. Recht et al., Dwork et al.).
- **Alternatives**: (A) Keep the 2-way train/held-out split and report held-out as the result (the leak). (B) Use held-out only as an overfit *diagnostic*, never to select, and report it once (better, but no untouched set if any selection sneaks in). (C) Conventional **3-way train/val/test**.
- **Decision**: Option C. **Train** drives the in-loop DeepSeek reward + all NSGA-II promotion/selection pressure. **Validation** is used only for a small number of decisions — final selection among the Pareto finalists + the overfit-gap diagnostic — and is *not* a per-generation hard gate (a hard gate is selection, which leaks). **Test** is locked and evaluated **exactly once**, on the single final selected organism vs gen-000, with the Opus judge, solely to confirm evolution really beat the baseline. All three splits disjoint by `sample_id`; validation/test scored by Opus (D014 selection-tier judge).
- **Rationale**: An untouched test set is the only honest source of the final "+X vs gen-000" claim; everything the search can see gets overfit to some degree. This matches how hyperagent's own validation plane (`--validation-ids`, `--validation-max-regression`) is intended — a regression guard during selection, with the real benchmark reported separately. Minimizing validation queries (select on train-Pareto; bring validation in only for finalists) slows validation overfitting.
- **Tradeoff**: Needs more prompts — 5 train is thin for a 3-way split; pulling more from `processed_data.jsonl` (EC2) is required, and train growth raises in-loop eval volume (cheap now that in-loop is DeepSeek). Fewer per-generation validation signals means slightly noisier promotion, accepted to keep validation honest. The test set yields a single end-of-run comparison only — by design.
- **Supersedes**: BER-144 open question #1 (held-out set).

### D017: First real-run evolution config — single island, hard+soft task time budgets

- **Date**: 2026-06-12
- **Context**: Settling the BER-144 production run config after the smoke validated the pipeline. The smoke also exposed two config facts: (a) `IslandConfig.model` **overrides** `config.metaModel` (`strategy.ts:869`), so the D015 `gpt-5.5` default is ignored unless an island's model is set to it — the 4 default Bedrock islands (Minimax/DeepSeek/Sonnet/Kimi) each ran their own proposer; (b) island spawning (`maxSpawnedIslands`) + stagnation cloned runaway islands (`S65 → gen-200`, 200+ orphan dirs). Separately, the per-task hard timeout was mis-set for research and the token budget was unrealistic.
- **Decision** (first real run; scale up later if promising):
  - **Single island**, proposer = **`gpt-5.5` / thinking `high`** (D015), `maxSpawnedIslands: 0`. The island roster must set the model explicitly (the metaModel default alone is overridden). One population, one proposer, no spawning — legible and cost-bounded. Depends on **BER-155** (pi-ai must register `gpt-5.5`); fallback proposer if running before BER-155 lands is Sonnet 4.6 (Bedrock, registered).
  - **Hard per-task time budget = 300s**: set `taskTimeoutMs` and align `HYPERAGENT_RESEARCH_TASK_TIMEOUT_MS` to 300_000 (effective cap = min of the two; default 120s was silently capping research, which legitimately runs 95–247s). Bounds worst-case wall-clock; latency is already a MOEA objective so evolution pulls toward faster organisms anyway.
  - **Soft, agent-aware budget**: tell the task agent in its prompt to aim to finish within ~N minutes / ~K tokens, making latency/cost a *learnable* behavior (pairs with the context-management nudge). Added to the organism task prompt.
  - **`tokenBudget` reset 30K → ~200K**: 30K was far below real usage (150–500K observed), so the cost objective saw every organism as wildly over budget. ~200K is a realistic reference.
  - **Adversary OFF** for deep-researcher (the adversary generates synthetic coding tasks; our tasks are fixed ResearchRubrics prompts).
  - Starting knobs: `iterations` 5–6, `dss.sampleSize` 3 (of 12 train), `racing.maxEvals` 2, `stageGateThreshold` 0.3 (floor ≈ 0.47, won't gate good organisms). Rough first-run scale ≈ islands(1) × iters(6) × evals(2) × sample(3) ≈ 36 student research runs + ~6 meta calls + Opus final-eval (finalists×8 val + 2×10 test).
- **Rationale**: Student is free (vLLM) and DeepSeek in-loop is cheap, so the binding constraint is **wall-clock**, driven by `islands × iterations × racing.maxEvals × dss.sampleSize`. Single island + capped iterations keeps the first real run tractable and interpretable; the time/token budgets bound per-task cost and seed the latency/cost objectives with realistic targets. Disabling spawning avoids the smoke's runaway-clone failure mode.
- **Tradeoff**: Single island loses mutation-style diversity that 2–3 diverse proposers would give (revisit after the first run if search stalls). Hard 300s cap may truncate an occasional legitimately-long research task; acceptable since the floor runs were ≤247s and the soft budget should keep the agent inside it. Mechanically, the island roster + budgets live in `DEFAULT_EVOLUTION_CONFIG` (code), so this is a small pre-run config edit applied after the organism-runtime/meta-prompt work lands (avoid racing the same worktree).
- **Builds on**: D015 (meta-model), D014 (tiered judge), D016 (train/val/test). **Blocked by**: BER-155 (pi-ai gpt-5.5 registration) for the gpt-5.5 proposer.

### D018: Browser-native single-agent curriculum over plain teacher distillation

- **Date**: 2026-06-15
- **Context**: BER-145/146 showed that prompt/cap tuning, raw-student capture evolution, and a tiny no-update reward-density probe were not enough to produce clean high-reward browser-research trajectories. The target needs to be a trainable browser-native Deep Research policy, not a model that merely imitates final answers or hidden teacher reasoning.
- **Alternatives**: (A) Continue plain teacher final-answer distillation and raw-student RL/evolution. (B) Keep subagent spawning and API-native retrieval in the trained policy. (C) Bootstrap a single-agent browser curriculum with explicit visible research/context primitives and staged data mixtures.
- **Decision**: Option C. Train a small browser-native, context-managed, single-agent Deep Research model. Remove subagent spawning for now because orchestration, credit assignment, and evaluation add avoidable risk. The final policy should retrieve through headless Chromium/browser-only interaction, not `web_search`/`fetch_content` APIs; browser observations must be bounded and canonicalized rather than raw unbounded DOM dumps.
- **Rationale**: The trainable target is the visible research process: evidence cards, `stash_finding`/`recall_finding`, `compress_findings`, `context_usage`, `gap_assessment`, and `final_answer`. Do not train hidden teacher reasoning as a target. Pause raw-student RL and raw-student primary evolution; keep the raw student only as a shadow diagnostic until bootstrap data shows learnability. Pause the data-factory evolution retry until a boring baseline works: BER-162 support exists, but the real run timed out without an aggregate, ranking, or winner. Sonnet 4.6 remains the default teacher/generator, with Opus optional for audit/escalation; deterministic gates plus sampled semantic audit are still required.
- **Training plan**: Use multi-stage mixture training with replay from a labeled data bank: keep easy browser/navigation/evidence/context examples in replay while hard browser-research examples increase. For same-objective SFT/midtraining stages, prefer continuous optimizer state, global step, and LR schedule with dataloader mixture shifts, ideally WSD. Restart only when the objective or parameterization changes, such as SFT → DPO/RL or full-rank → LoRA. Train sampling should mostly be weighted with replacement; eval should be without replacement. Guard small buckets with repeat caps, temperature smoothing, dedupe, and logging of unique examples and repeats.
- **References**:
  - Kotha & Liang, "Replaying pre-training data improves fine-tuning" (2026), https://alphaxiv.org/abs/2603.04964 — generic replay improves target-task performance/data efficiency; excerpt notes separate LR schedules/optimizer states for standard FT versus one WSD schedule for mid-training, plus agentic web-navigation gains.
  - Liu, Neubig & Xiong, "Midtraining Bridges Pretraining and Posttraining Distributions" (2026), https://alphaxiv.org/abs/2510.14865 — frames midtraining as a distributional bridge with specialized/general mixtures, timing/mixture-weight interactions, and plasticity-window effects.
  - Hu et al., "MiniCPM: Unveiling the Potential of Small Language Models with Scalable Training Strategies" (2024), https://arxiv.org/abs/2404.06395 — introduces/uses WSD learning-rate scheduling as conducive to continuous training and domain adaptation.
  - Gururangan et al., "Don't Stop Pretraining: Adapt Language Models to Domains and Tasks" (2020), https://arxiv.org/abs/2004.10964 — evidence for multi-phase domain- and task-adaptive pretraining (DAPT/TAPT).
  - "The Verifier is the Moat" (user-provided strategy synthesis/reference bundle) — hypothesis bundle on verifiable signal/environment foundries, verifier/reward-hacking QA, long-horizon process rewards, learned context management, and test-time verification; use as a source of hypotheses, not primary empirical evidence, and cite/verify primary sources before turning claims into hard gates. Key refs: Dwarkesh/Sholto-Trenton interview (https://www.dwarkesh.com/p/sholto-trenton-2); Claude 3.7 Sonnet (https://www.anthropic.com/news/claude-3-7-sonnet); process/verifier/RL papers (https://arxiv.org/abs/2404.05405, https://arxiv.org/abs/2401.16380, https://arxiv.org/html/2510.01631v1, https://arxiv.org/abs/2509.09677, https://arxiv.org/abs/2510.11967); environment-scaling/market refs (https://jobs.menlovc.com/companies/anthropic/jobs/67669113-research-engineer-environment-scaling, https://epoch.ai/gradient-updates/state-of-rl-envs, https://techcrunch.com/2025/09/21/silicon-valley-bets-big-on-environments-to-train-ai-agents/, https://www.wing.vc/content/who-will-win-the-rl-environment-market--and-why). Full bundle also included product/benchmark/vendor-market refs [2]-[4], [12]-[40].
- **Tradeoff**: This delays GRPO and raw-student evolution in favor of a less glamorous browser-baseline curriculum, but it lowers credit-assignment, retrieval-interface, and data-quality risk before expensive training.
- **Implication**: BER-145 data generation should prioritize labeled browser/process traces and visible primitive supervision; BER-146 should wait for clean/high-reward bootstrap rollouts before GRPOTrainer is wired for real weight updates.

