# Latest State of the Art for Long-Running Deep Search Agents — QUICK

**Date**: 2026-06-09
**Depth**: quick (snippet-level scan, single pass, no full-text reads)
**Sources consulted**: 6 searches, ~12 distinct sources cited (snippets only — none fetched in full)
**Source minimum met**: Yes (quick minimum = 5)
**Overall confidence**: Low–Medium (snippet-only; no source read in full, no refinement round)

> **Mode note**: This is a `quick` run — a fast orientation, not a verified deep dive. Findings rest on search-result snippets, not full-text reads, and no claim was cross-checked against the primary source. Treat numbers and attributions as provisional. For a verified, synthesized answer, run `--depth deep`.

## Summary

"Deep search agents" — autonomous systems that plan, browse, read, and synthesize over many steps — are a fast-moving area in 2026. The headline pattern: a planner/orchestrator decomposes a query into sub-tasks, dispatches search/browse sub-agents, and synthesizes results, with the frontier now focused on *long-horizon* operation (staying coherent across many context windows) rather than single-shot answers.

## Findings

### SQ1: What systems/frameworks define the current frontier?

- Commercial: **OpenAI Deep Research** (RL-trained reasoning model that plans multi-step search/read/synthesize), **Google Gemini Deep Research** (autonomous multi-step planning on Gemini 2.x, multi-round adaptive web search), and **Anthropic's** multi-agent Research feature (LeadResearcher + specialized subagents). [bytebytego], [Oreate]
- Open-source: **Alibaba Tongyi DeepResearch** (~30.5B params, 3.3B active/token, end-to-end agentic training), **OWL** (hierarchical multi-agent, ~69% on GAIA), Hugging Face **SmolAgents**, and the Tongyi **WebAgent** family (WebDancer/WebSailor/WebShaper). [firecrawl], [aimultiple]
- Frameworks for building them: **LangChain "Deep Agents"** (announced March 2026, targets the long-running class directly), LangGraph, CrewAI, the new unified Microsoft Agent Framework (AutoGen now maintenance-mode). [dev.to], [firecrawl]

Confidence: **Medium** — multiple snippets corroborate the major players, but specific parameter counts and dates are unverified.

### SQ2: What techniques enable long-horizon operation?

- The core problem named repeatedly: agents degrade over time — one source claims success rate drops after ~35 minutes and that doubling task duration quadruples failure rate. [Zylos]
- Mitigations cluster around **memory + context management**: hierarchical/structured memory over "massive windows," with systems like **Mem0, MEM1, Mem-α, MemAgent, A-MEM, SimpleMem, AdaCoM** doing iterative compression, selective storage, and adaptive retrieval. [indium], [arxiv 2601.01885]
- Engineering patterns: progress-tracking files, git-based state, and structured handoff artifacts between sessions (Anthropic guidance, Nov 2025). [Zylos]

Confidence: **Low–Medium** — the "35-minute" claim comes from a single snippet and should be verified before citing.

### SQ3: How are these agents evaluated?

- Key benchmarks: **BrowseComp** (1,266 hard live-web questions), **BrowseComp-Plus** (closed corpus, fairer/transparent), **GAIA** (real-world assistant tasks). Domain variants like **MedBrowseComp** exist. [arxiv 2508.06600]
- Reported SOTA points (snippet-level, unverified): MedResearcher-R1 (32B) at 27.5% on MedBrowseComp, edging o3 Deep Research (25.5%); deep research ~51.5% on a multi-step retrieval test vs <10% for plain LLMs. [Zylos], [emergentmind]

Confidence: **Low** — single-source numbers, not cross-checked.

## Knowledge Gaps

- No source was read in full; all figures are snippet-level and unverified.
- No refinement round, so newer/competing results may be missed.
- Quantitative claims (35-min degradation, 51.5%, 27.5%) rest on single snippets.

## Methodology

- **Depth**: quick. 3 sub-questions, 2 searches each (6 total), snippets only, single pass, no `fetch_content`, no Linear issue.
- **Tools**: `web_search` only.

## Sources

- [Long-Running AI Agents and Task Decomposition 2026 — Zylos](https://zylos.ai/research/2026-01-16-long-running-ai-agents)
- [Deep Agents: Building Long-Running Autonomous Agents with LangChain — DEV](https://dev.to/richard_dillon_b9c238186e/deep-agents-building-long-running-autonomous-agents-with-langchains-new-framework-1bpn)
- [How OpenAI, Gemini, and Claude Use Agents to Power Deep Research — ByteByteGo](https://blog.bytebytego.com/p/how-openai-gemini-and-claude-use)
- [OpenAI's Deep Research vs Google Gemini — Oreate AI](https://www.oreateai.com/blog/a-comparative-dive-openais-deep-research-tool-vs-google-gemini/7bdac0550b1dc82b7e5b230bbe22579f)
- [3 Agent Memory Models for Long Context Reasoning in 2026 — Indium](https://www.indium.tech/blog/agent-memory-models-long-context-reasoning-2026/)
- [Agentic Memory: Unified Long-Term and Short-Term Memory Management — arXiv 2601.01885](https://arxiv.org/abs/2601.01885)
- [BrowseComp-Plus — arXiv 2508.06600](https://arxiv.org/pdf/2508.06600)
- [Deep Research Agents: A Systematic Examination And Roadmap — arXiv 2506.18096](https://arxiv.org/pdf/2506.18096)
- [LLM-Powered Web Research Agents — EmergentMind](https://www.emergentmind.com/topics/llm-powered-web-research-agents)
- [How we built our multi-agent research system — Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Best open source frameworks for building AI agents in 2026 — Firecrawl](https://www.firecrawl.dev/blog/best-open-source-agent-frameworks)
- [Best 30+ Open Source Web Agents in 2026 — AIMultiple](https://aimultiple.com/open-source-web-agents)
