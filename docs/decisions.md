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
