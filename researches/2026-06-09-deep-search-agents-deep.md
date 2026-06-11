# Latest State of the Art for Long-Running Deep Search Agents — DEEP

**Date**: 2026-06-09
**Depth**: deep (7 parallel sub-question workers; full-text `fetch_content` reads + ≥1 refinement round each)
**Sources consulted**: ~60+ distinct sources fetched and tiered across 7 workers (≈28 searches + ≈100 full-text fetches)
**Source minimum met**: Yes (deep minimum = 30; comfortably exceeded)
**Overall confidence**: Medium–High (most headline claims verified against primary sources; fast-moving leaderboard numbers held at Medium)
**Linear**: would be created for a deep run; skipped here by request (live test, avoid polluting workspace)

## Scope

State of the art, as of mid-2026, for autonomous agents that plan, browse, read, and synthesize across long horizons ("deep research / deep search" agents): the leading commercial and open systems, the techniques that keep them coherent over long runs (memory, orchestration, training), how they're evaluated, and where they still break.

## Executive Summary

The field has consolidated around a recognizable shape: a **planner/orchestrator decomposes a query, dispatches search/read sub-tasks, and synthesizes** — with the 2026 frontier shifting from *raw parallelism* toward **long-horizon context management** as the real differentiator. Five threads define the current SOTA:

1. **Two architectural camps** have crystallized: single-agent RL-trained reasoners (OpenAI Deep Research, Gemini Deep Research, Perplexity Sonar) vs. explicit orchestrator-worker multi-agent systems (Anthropic Research, xAI Grok). Multi-agent buys breadth at ~15× the token cost, and its superiority is now actively contested on information-theoretic grounds.
2. **Open-weight agents have caught the frontier on browsing benchmarks**, led by Alibaba's Tongyi DeepResearch (30B-A3B MoE, Apache-2.0) and the WebAgent family — a genuine "DeepSeek moment" for research agents.
3. **Memory has been reframed as a learned write–manage–read loop**, not append-only storage; RL-trained memory/context managers (MEM1, Mem-α, MemAgent, AdaCoM) now keep near-constant context across very long runs.
4. **Training has converged on a three-stage agentic recipe** (agentic continual pre-training → SFT cold-start → on-policy GRPO), with **verification-centric / rubric rewards** as the year's key reward-design innovation.
5. **Evaluation has bifurcated** into short-answer browsing benchmarks (BrowseComp/-Plus, GAIA) and rubric-graded report-quality benchmarks (DeepResearch Bench II, ResearchRubrics) — and the rubric benchmarks show even the best agents satisfy **under ~50–68%** of expert criteria. Reliability over long runs remains the binding constraint, but the popular "doubling duration quadruples failure" claim turns out to be **folklore** that the originating author has since walked back.

---

## Findings by Sub-Question

### SQ1 — Frontier commercial systems

**Two paradigms.** OpenAI Deep Research is a single reasoning model (a version of o3, reportedly migrated toward GPT-5.x in 2026) trained **end-to-end with RL** to plan multi-step browse/read/Python trajectories. Google's Gemini Deep Research / **Deep Research Max** (shipped Apr 21 2026 on Gemini 3.1 Pro) is also single-agent but productized into two tiers — standard (~80 searches, ~250k input tokens) and Max (up to ~160 searches, ~900k tokens, up to 60-min async runs via `background=True`, MCP access to FactSet/S&P/PitchBook). Perplexity **Sonar Deep Research** is the speed/cost-optimized RAG specialist (128K context, 2–4 min, granular token-type pricing). *(High confidence — vendor-primary docs.)*

**Multi-agent camp.** Anthropic's Research uses a **LeadResearcher (Opus) + 3–5 parallel subagents (Sonnet) + citation agent**; xAI's `grok-4.20-multi-agent` runs a leader over 4 or 16 parallel subagents with first-party X data and encrypted subagent state. Anthropic reports **+90.2% over single-agent Opus** on internal evals, with **token use explaining ~80% of performance variance** and the system burning **~15× a normal chat's tokens** — explicitly "only worth it for high-value tasks." Its documented limits: synchronous execution, no subagent-to-subagent coordination, unsuitable for tightly-coupled work like coding. *(High confidence.)*

**Conflict:** exact base-model versions are fast-moving and partly unverifiable from primary sources (Gemini 3.1 vs 3.5; OpenAI o3 vs GPT-5.2). Held at Medium.

### SQ2 — Open-source / open-weight systems

**Tongyi DeepResearch (Alibaba)** is the flagship fully-open agent: 30.5B total / ~3.3B active MoE on Qwen3-30B-A3B, 128K context, Apache-2.0 (Sep 2025). Reported **HLE 32.9, BrowseComp-EN 43.4, BrowseComp-ZH 46.7, xbench-DeepSearch ~75**. It ships two inference modes (native ReAct and a "Heavy"/IterResearch test-time-scaling mode that merges parallel agents via a synthesis agent). The **WebAgent family** (WebDancer, WebSailor, WebShaper, WebSailor-V2, …) is a lineage each pairing a data-synthesis innovation with SFT+RL; **WebSailor-V2** (Qwen3-30B-A3B base, DUPO RL) reports beating the 671B DeepSeek-V3.1 on BrowseComp. **OpenResearcher** (TIGER-AI-Lab, Nemotron-3-Nano-30B-A3B) is SFT-only on ~55K distilled trajectories yet claims **BrowseComp-Plus 54.8%**, surpassing several closed frontier models *on that benchmark*. **OWL** (planner-worker framework) reaches **GAIA ~69%**. *(High confidence on cited numbers; the "best open agent" label is benchmark-relative — see Cross-Cutting Conflicts.)*

### SQ3 — Memory & context management

The 2026 literature **formalizes memory as a write–manage–read loop** where the update operator "summarizes, deduplicates, scores priority, resolves contradictions, and deletes" — five mechanism families (context compression, retrieval stores, reflective memory, hierarchical/virtual-context à la MemGPT, and policy-learned management). Concrete systems and their contributions:

- **MEM1** (RL/PPO): collapses each turn into a single internal-state `<IS>` tag, achieving ~3.5× the EM of a 14B baseline at **27% of peak tokens** on multi-objective QA.
- **Mem-α** (GRPO): learns explicit `insert/update/delete` ops with a compression-aware reward; trained at ≤30k tokens, generalizes to **>400k (13×)**.
- **MemAgent** (DAPO): fixed-length in-window memory overwrite loop, extrapolates to **3.5M tokens** near-linearly.
- **SimpleMem**: compression + consolidation + adaptive-depth retrieval; **+26.4% F1 over Mem0 on LoCoMo** at ~30× fewer tokens.
- **AdaCoM**: an *external trainable context-manager LLM* editing a frozen agent's transcript — directly the deep-search case — **+39% avg on BrowseComp-Plus**, with a key finding that aggressive compression *helps weak agents but hurts strong ones*.

*(High confidence on mechanisms; efficiency numbers are mostly each paper's own.)*

### SQ4 — Planning & orchestration

The **dominant production pattern is orchestrator-worker** (single planner, parallel context-isolated subagents), now shipped as a default in open harnesses (LangChain **deepagents** on LangGraph: `write_todos` planning no-op, `task` subagent spawning, virtual-filesystem context offloading). **WebPilot** formalizes distributed web exploration as hierarchical decomposition + **MCTS**, with ablations showing the **planner is the single most critical component** (removing it drops performance 24–52%). 2026 SOTA systems (Yunque DeepResearch) add a **Supervisor + semantic-summary compression** layer — the field's shift "from raw parallelism toward context management."

**Central conflict (well-evidenced both ways):** Anthropic's +90.2% multi-agent result is directly challenged by arXiv 2604.02460, which argues via the **Data Processing Inequality** that under *equal thinking-token budgets* a single agent with full context matches or beats multi-agent on multi-hop reasoning. Reconciliation: **budget-matched + clean context → single-agent; broad, noisy, high-entropy web exploration → multi-agent.** Anthropic itself notes upgrading the model beat doubling the token budget. *(High confidence on the tension being real and reconcilable.)*

### SQ5 — Training methods

The reference recipe is **Agentic Continual Pre-Training → SFT cold-start → on-policy RL**, with **GRPO the near-universal RL algorithm** (customized for long-horizon stability: token-level loss, leave-one-out advantage, negative-sample filtering). Three load-bearing ideas:

1. **Agentic trajectory synthesis** replaces human labeling — OpenResearcher distills ~97K 100+-turn trajectories from a teacher model, filters to ~55K, and trains SFT-only to strong results.
2. **"Local virtual world" environments** make long-horizon RL cheap — LiteResearcher builds a 32M-page local corpus + local search/browse tools, running **73.2M tool calls at $0 locally** vs an estimated $59K–$243K via APIs, with RL lifting GAIA 55.6→71.3.
3. **Verification-centric / rubric rewards** are the year's reward innovation — "Chaining the Evidence" introduces **Citation-Aware Rubric Rewards + C-GRPO** (`R = (1−α)R_o + α·R_o·R̂_r`), gaining up to **+12.7 on xbench-DS** over outcome-only GRPO. Tongyi's stance: **data quality and environment stability matter more than the RL algorithm.** *(High confidence.)*

### SQ6 — Evaluation & SOTA numbers

Evaluation has **bifurcated**: short-answer browsing (exact-match) vs. long-form report quality (rubric-graded). Verified anchors:

| Benchmark | Top system (verified) | Score | Tier |
|---|---|---|---|
| BrowseComp-Plus (ACL 2026) | GPT-5 + Qwen3-Embedding retriever | **70.1%** (BM25: 55.9%) | A |
| BrowseComp (original launch) | OpenAI Deep Research | 51.5% | A |
| DeepResearch Bench (RACE) | Gemini-2.5-Pro Deep Research | 48.88 | A |
| DeepResearch Bench II (rubric) | iFlow-Researcher | **59.91%** | A |
| ResearchRubrics (ICLR 2026) | best DR agent (Gemini/OpenAI) | **<68% compliance** | A |
| MedBrowseComp-50 | O3 Deep Research | ~51% | A |
| GAIA (HAL, reproducible) | HAL agent + Claude Sonnet 4.5 | 74.55% ($178) | A |

The key signal: on rubric benchmarks, **even the strongest systems satisfy under ~50% (info recall) to ~68% (overall) of expert criteria** — a large remaining gap to expert reports. Aggregator leaderboards showing frontier models at ~85–95% on BrowseComp are held at **Medium** (methodology/harness unverified). A widely-cited "BrowseComp-Plus = 10M docs, ~92%" figure was traced to a **hallucinated summary** and discarded (real corpus ~100K docs). *(High confidence on the abstract-verified table; Medium on aggregator numbers.)*

### SQ7 — Reliability over long runs

**Myth-busting headline:** the "**doubling task duration quadruples failure rate**" claim is **folklore, not a primary finding.** METR's actual result is a *capability* trend — the 50%-success **time horizon doubles ~every 7 months**. The exponential "half-life" model originated with Toby Ord (2025) and **Ord himself walked it back in 2026**, accepting a Weibull analysis (shape **k≈0.6 < 1**) showing **hazard rates *decline* as a task proceeds**, not stay constant. The specific "35-minute degradation cliff" is likewise **unverified** in any primary source. *(High confidence.)*

What *is* verified: measured **pass@1 degrades ~76%→52%** short-to-long horizon, strongly **domain-dependent** (software steepest, document processing nearly flat); **error compounding is amplified by "self-conditioning"** (errors already in context make future errors likelier, independent of context length); and the dominant failure modes are **planning errors and catastrophic forgetting.** Mitigations with primary evidence: Anthropic's **three-agent harness (Planner/Generator/Evaluator) with context resets + file-based handoffs** (compaction alone proved insufficient under "context anxiety" until Opus 4.6); **git-as-memory** (Git Context Controller, SWE-bench Verified 80.2%); **NOTES.md external memory + distilled subagent summaries**; and deep-research-specific control via **RhinoInsight** (verifiable checklist + evidence audit + Markovian state reconstruction, GAIA 68.9 vs 58.3). *(High confidence; some single-study numbers held at Medium.)*

---

## Cross-Cutting Themes

1. **The differentiator moved from parallelism to context management.** Every sub-question independently converged here: orchestration adds Supervisors/compression (SQ4), memory became a learned management loop (SQ3), training added local-environment + rubric verification (SQ5), and reliability hinges on resets/handoffs (SQ7).
2. **Open weights reached the frontier on browsing, not yet on report quality.** Tongyi/WebSailor/OpenResearcher match or beat closed models on BrowseComp-style needles (SQ2/SQ6), but the rubric benchmarks where closed products lead (DeepResearch Bench II, ResearchRubrics) still show everyone under ~68% (SQ6).
3. **Multi-agent is conditional, not universal.** The strongest claim (Anthropic +90.2%) and its strongest rebuttal (DPI argument) reconcile to: multi-agent wins *specifically* in the broad/noisy regime deep research targets, and is partly bought with tokens (SQ1/SQ4).
4. **GRPO + synthetic trajectories + verification is the de facto training stack** (SQ2/SQ5).

## Confidence Grades

| Conclusion | Grade | Basis |
|---|---|---|
| Orchestrator-worker is the dominant production pattern | **High** | Anthropic primary + multiple frameworks ship it as default |
| Open-weight agents match frontier on browsing benchmarks | **High** | arXiv reports + repos, cross-confirmed by press |
| Memory = learned write–manage–read loop is the SOTA framing | **High** | 2026 survey + 5 primary method papers agree |
| "Doubling duration quadruples failure" is folklore | **High** | Traced to Ord 2025; author's own 2026 retraction |
| Multi-agent > single-agent universally | **Low (contested)** | Anthropic +90.2% vs DPI rebuttal under equal budgets |
| Specific 2026 leaderboard percentages (85–95% BrowseComp) | **Medium** | Aggregator-sourced; harness/methodology unverified |
| Exact frontier base-model versions (Gemini 3.1 vs 3.5, o3 vs GPT-5.2) | **Medium** | Not confirmable from vendor primaries (some 403'd) |

## Knowledge Gaps

- **No single apples-to-apples cross-system benchmark** on the same eval/date/harness; HLE and BrowseComp figures span versions and configs.
- **Vendor self-reports** (AI21 Maestro 95.18% BrowseComp-Plus; Perplexity internal model count; Autonoma/Yunque 97% completion) are abstract- or blog-only and **unaudited**.
- **Deep-research-specific memory** is thin in the literature — only MEM1 and AdaCoM explicitly target web-search trajectories; others assume transfer from dialogue/QA memory.
- A few named systems from the brief (**COMPASS** "evolving context", "AdaCoM" as an acronym) could not be confirmed as distinctly-named primary sources; closest matches were substituted and flagged.
- OpenAI primary pages (deep research, o3/GPT-5.x system card) **404/403'd**; OpenAI architecture rests on a reliable secondary quoting the primary.

## Methodology

- **Depth**: deep. 7 sub-questions, dispatched as 7 parallel researcher workers (mirroring the skill's one-worker-per-sub-question Orca pattern).
- **Per worker**: ~4 varied searches → **required** `fetch_content` full-text reads of the top 4+ results → **≥1 refinement round** seeded by first-round findings → A/B/C/D source tiering → structured `worker_done`-style payload (scored sources + findings + conflicts + gaps).
- **Tools**: `web_search` + `fetch_content` (WebSearch/WebFetch).
- **Synthesis**: planner merged 7 payloads, mapped cross-cutting themes and conflicts, graded confidence.

## Key Sources (selected; full lists held per-worker)

- Anthropic — [Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system); [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps); [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Gemini Deep Research API docs](https://ai.google.dev/gemini-api/docs/interactions/deep-research); [Perplexity Sonar Deep Research](https://docs.perplexity.ai/docs/sonar/models/sonar-deep-research); [xAI Multi-Agent](https://docs.x.ai/developers/model-capabilities/text/multi-agent)
- Tongyi DeepResearch — [tech report 2510.24701](https://arxiv.org/pdf/2510.24701) / [blog](https://tongyi-agent.github.io/blog/introducing-tongyi-deep-research/) / [repo](https://github.com/Alibaba-NLP/DeepResearch); [WebAgent family](https://github.com/Alibaba-NLP/WebAgent)
- [OpenResearcher 2603.20278](https://arxiv.org/html/2603.20278); [Cognitive Kernel-Pro 2508.00414](https://arxiv.org/abs/2508.00414); [OWL/WORKFORCE 2505.23885](https://arxiv.org/pdf/2505.23885)
- Memory — [MEM1 2506.15841](https://arxiv.org/html/2506.15841v1); [Mem-α 2509.25911](https://arxiv.org/html/2509.25911v1); [MemAgent 2507.02259](https://arxiv.org/abs/2507.02259); [SimpleMem 2601.02553](https://arxiv.org/html/2601.02553v1); [AdaCoM 2605.30785](https://arxiv.org/html/2605.30785v1)
- Training — [LiteResearcher 2604.17931](https://arxiv.org/html/2604.17931v2); [Chaining the Evidence 2601.06021](https://arxiv.org/pdf/2601.06021); [IntentRL 2602.03468](https://arxiv.org/abs/2602.03468); [RL Foundations survey 2509.06733](https://arxiv.org/pdf/2509.06733)
- Eval — [BrowseComp-Plus 2508.06600](https://arxiv.org/abs/2508.06600); [DeepResearch Bench](https://deepresearch-bench.github.io/); [DeepResearch Bench II 2601.08536](https://arxiv.org/abs/2601.08536); [ResearchRubrics 2511.07685](https://arxiv.org/abs/2511.07685); [HAL GAIA](https://hal.cs.princeton.edu/gaia)
- Reliability — [Ord: half-life](https://arxiv.org/abs/2505.05115) + [Ord: hazard rates decline](https://www.tobyord.com/writing/hazard-rates-for-ai-agents-decline); [Illusion of Diminishing Returns 2509.09677](https://arxiv.org/html/2509.09677v3); [Git Context Controller 2508.00031](https://arxiv.org/html/2508.00031v2); [RhinoInsight 2511.18743](https://arxiv.org/html/2511.18743v1)
