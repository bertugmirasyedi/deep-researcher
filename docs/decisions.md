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
