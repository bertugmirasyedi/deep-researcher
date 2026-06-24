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

### D006: OMP context-and-skills pack, not application code

- **Date**: 2026-05-05
- **Context**: What is the nature of this repo?
- **Alternatives**: (A) Standalone application with its own runtime. (B) Context-and-skills pack for OMP.
- **Decision**: Context-and-skills pack.
- **Rationale**: OMP already provides the agent runtime, tool access, skill system, `task` subagents, URL-capable `read`, `web_search`, and internal artifacts. Building a separate app would duplicate orchestration, tooling, and UI.
- **Tradeoff**: Requires OMP. Not portable to other agent frameworks without adaptation.
- **Current status**: Superseded by D014 for canonical `deep` execution. The repo now includes a small Mastra workflow runner while keeping OMP as the model/tool runtime.

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
- **Rationale**: A project-level OMP agent (`.omp/agents/researcher.md`) gives the search worker a focused system prompt with evaluation criteria, citation rules, and structured output format — producing higher-quality findings than a generic scout. Archiving reports under `researches/YYYY-MM-DD-<slug>.md` creates a persistent, version-controlled research history that later work can reference.
- **Tradeoff**: One more agent file to maintain. The `researcher` agent is project-local, not a builtin — it must exist in this repo for the skill to function correctly.

### D009: Orca + Linear supersede pi-threads + pi-workflow

- **Date**: 2026-05-28
- **Context**: Historical migration away from pi-threads and pi-workflow.
- **Decision**: Use external worker orchestration and external durable tracking for `deep` research runs.
- **Rationale**: At the time, this replaced removed thread/workflow extensions while preserving parallel sub-question workers and resumable run state.
- **Tradeoff**: Added manual worker lifecycle and external tracking dependencies.
- **Supersedes**: D007.
- **Current status**: Superseded by D013.

### D010: Worker isolation envelope for researcher dispatch

- **Date**: 2026-05-29
- **Context**: Historical hardening for the D009 external-worker design. Workers needed a sealed prompt and read-only tool surface to prevent prompt bleed.
- **Decision**: Add an explicit isolation envelope around researcher worker dispatch.
- **Rationale**: The envelope made each worker a sealed Researcher process instead of a full coding agent.
- **Tradeoff**: More fragile command-line plumbing and duplicated model/tool configuration.
- **Extends**: D009.
- **Current status**: Superseded by D013; OMP task agents now provide the child-session boundary and project-agent loading.

### D011: Single-vendor Codex on Pro 20x; planner GPT-5.5, workers gpt-5.4-mini xhigh

- **Date**: 2026-06-08
- **Context**: AI-subscription consolidation review. Almost all model usage flows through OMP. Measured historical usage: ~650 messages/day account-wide → ~217 per 5-hour window on average; peak parallel-research swarm days reach ~1,000–1,800 messages per window. The `balancer-worker` role (parallel fan-out) drives ~75% of volume. Question: stack cheap third-party plans (GLM/Kimi/MiniMax/OpenCode Go) vs. one OpenAI Codex subscription, and which Codex tier.
- **Alternatives**: (A) Multi-vendor stack — route `balancer-worker` to a cheap API-native plan (~$10–30/mo) and keep Codex/Claude for planner+hard tasks; cheapest on $/throughput. (B) Single-vendor Codex Pro 5x ($100) with workers on `gpt-5.4-mini` at low/med thinking (fits the 5x window cap of ~1,750 even on peak swarm days). (C) Single-vendor Codex Pro 20x ($200) with planner on GPT-5.5 and workers on `gpt-5.4-mini` at **xhigh** thinking.
- **Decision**: Option C. All model traffic on the OpenAI Codex subscription (drives OMP directly). Planner/interactive/hard tasks → GPT-5.5. Parallel research workers → `gpt-5.4-mini` at `xhigh` reasoning. Tier: **Pro 20x ($200)**.
- **Rationale**: User prefers single-vendor simplicity and GPT-5.x quality over the multi-vendor cost optimum. Codex window caps are per-model and token-size-dependent: GPT-5.5 has the lowest allowance (5x: 80–400, 20x: 300–1,600 per window); `gpt-5.4-mini` is far higher (5x: 300–1,750, 20x: 1,200–7,000). Choosing `gpt-5.4-mini` for the high-volume worker fan-out (instead of GPT-5.5) is what keeps swarms inside quota. `xhigh` reasoning improves source-eval quality but spends tokens, pushing workers toward the *bottom* of the range (~1,200–2,500 effective on 20x) — which still comfortably covers the ~1,000–1,800 peak-swarm load, but does **not** fit Pro 5x on peak days. Hence 20x.
- **Tradeoff**: ~$200/mo (≈$240 with the user's ~20% card FX/markup) vs. a ~$10–30 multi-vendor optimum — a deliberate premium for single-vendor simplicity + GPT quality. Escape hatch: dropping worker thinking from `xhigh` → low/med makes `gpt-5.4-mini` fit Pro 5x even on peak swarm days, enabling a fallback to $100/mo if budget pressure appears, at the cost of weaker worker reasoning. Keep the project `researcher` agent frontmatter in sync with this choice (`gpt-5.4-mini`, xhigh).

### D012: Collapse three depth tiers into two behavior-defined modes

- **Date**: 2026-06-09
- **Context**: The `--depth` ladder had three tiers (shallow / standard / deep). "Standard" (the default) was 5 sub-Qs × 3 searches → 10–15 sources with no required full-source reads or iteration, so in practice it was satisfiable with a handful of `web_search` calls — a snippet skim, not research. The jump to "deep" was also a 20× cliff (10–15 → a 200-source minimum that was effectively unachievable with ~30 searches and reads like an aspirational typo).
- **Alternatives**: (A) Beef up `standard` only (require reads + iteration, ~20–30 sources), keep three tiers. (B) Recalibrate all three tiers and fix deep's 200-source cliff. (C) Collapse to two modes — `quick` (snippet scan) and `deep` (read + iterate + synthesize) — distinguished by behavior, not search count.
- **Decision**: Option C. Two modes: `quick` (3 sub-Qs, 2 searches, snippets ok, no iteration, min 5, inline single-threaded, no per-run tracking issue) and `deep` (default; 6–8 sub-Qs, 4 searches, **full-source `read` required** on top 4+/sub-Q, **≥1 refinement round required**, min 30, parallel OMP `researcher` task agents).
- **Rationale**: What makes research "deep" is reading full sources and iterating — not raw search count. Making those two behaviors mandatory for `deep` (and naming the snippet-only path honestly as `quick`) fixes the "standard is just a couple web searches" problem at its root. Default is `deep` because the pack is a *deep* researcher; `quick` is the explicit fast opt-out. Dropping the deep minimum from 200 → 30 closes the unachievable cliff. A `deep` run that skipped reads or iteration must be relabeled `quick` in the report header rather than claiming `deep`.
- **Tradeoff**: Loses the middle tier's granularity — there is no longer a "medium" effort level. Acceptable: the middle was the muddy, mislabeled tier; two honest modes are a clearer mental model than three with a broken middle and an unreachable top. Updated across SKILL.md, docs/research-workflow.md, ARCHITECTURE.md, README.md, AGENTS.md. Existing research reports under `researches/` that cite the old tier names are left as historical record.
- **Current status**: Superseded by D014 for canonical `deep` orchestration. The `quick`/`deep` depth model remains current, but canonical `deep` now uses Mastra foreach over OMP ACP instead of OMP task-agent fan-out.

### D013: OMP task agents supersede Orca + Linear research runs

- **Date**: 2026-06-23
- **Context**: The user moved away from the legacy Orca-Linear workflow and now uses OMP only. OMP has first-class `task` subagents, `agent://` and `history://` artifacts, built-in `web_search`, and URL/document extraction through `read`, so Deep Researcher no longer needs terminal workers, `orca orchestration`, `ORCA_ROLE`, Linear checklist state, or `fetch_content`.
- **Alternatives**: (A) Keep Orca + Linear docs as the canonical dispatch path. (B) Keep both Orca-Linear and OMP paths. (C) Clean cutover to OMP task agents and OMP built-in tools.
- **Decision**: Option C. Move the skill to `.omp/skills/deep-researcher/SKILL.md`, move the worker prompt to `.omp/agents/researcher.md`, use `task` batch fan-out for `deep`, use `web_search` for discovery, and use `read <url>` for full-source extraction. Per-run state is task output plus `agent://`/`history://` and the archived report under `researches/`.
- **Rationale**: This removes the manual worker lifecycle and external tracking dependency while preserving the important properties: parallel per-sub-question workers, focused read-only researcher prompts, full-source reads, refinement, structured source scoring, and report archival.
- **Tradeoff**: Linear no longer provides a durable checklist for in-progress research. Acceptable because OMP task outputs/transcripts and the saved Markdown report are the relevant artifacts for this repo; longer project planning remains outside the research-run skill.
- **Supersedes**: D009 and D010.
- **Current status**: Superseded by D014 for canonical `deep` runs. Remains true for fallback/manual OMP task-agent execution.

### D014: Mastra Workflows with OMP ACP for deep research orchestration

- **Date**: 2026-06-24
- **Context**: Canonical `deep` research needed deterministic workflow control without losing the user's OMP/Codex runtime, OMP auth, OMP built-in tools, and OMP project context.
- **Decision**:
  - Use Mastra Workflows as the deterministic control plane for `deep` research.
  - Use OMP ACP (`omp acp`) for model/tool execution so the user's OMP Codex subscription, OMP auth, OMP built-in tools, OMP `web_search`, and OMP `read` remain the runtime substrate.
  - Do not strip OMP built-in tools with `--tools` or `--no-tools`; constrain behavior with prompts, read-only ACP workspace, permission policy, and deterministic validation.
  - ACP returns text for the final agent response in Mastra's ACP integration, so TypeScript parses JSON text and validates it with Zod instead of relying on Mastra native `structuredOutput`.
  - `deep` no longer plans from model priors; it must run neutral discovery before subquestion planning.
  - TypeScript owns schemas, stage order, plan validation, foreach concurrency, review gates, repair loop, final citation audit, and archive path.
  - Search-heavy stages use `openai-codex/gpt-5.5` with `minimal` thinking; planning, synthesis, and review stages use `openai-codex/gpt-5.5` with `high` thinking.
  - D006 is superseded for canonical `deep` execution because the repo now includes a small runner, not only prompts/docs.
  - D013 remains true for fallback/manual OMP task-agent execution but is superseded for canonical `deep` runs.
- **Rationale**: Mastra gives reproducible stateful orchestration, while OMP ACP preserves the user's paid model/tool runtime and existing project context. Zod validation and deterministic audits prevent model-prior planning and citation drift from silently passing.
- **Tradeoff**: The repo now has a Bun/TypeScript runner and dependencies. Fixture mode covers the workflow graph without live OMP, network, or model credentials.
