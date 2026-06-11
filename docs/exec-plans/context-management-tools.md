# Context Management as Custom pi Tools

**Status**: Draft  
**Created**: 2026-06-10  
**Origin**: SOTA research report ([researches/2026-06-09-deep-search-agents-deep.md](../../researches/2026-06-09-deep-search-agents-deep.md)), Cross-Cutting Theme 1: "the differentiator moved from parallelism to context management"

## 1. Summary

The 2026 SOTA research identifies context management as the primary differentiator between frontier and mid-tier deep research systems. The current Deep Researcher pipeline has **zero context management** — workers dump raw payloads and the planner accumulates them linearly. This plan proposes making context management a **learned behavior** by exposing it as custom pi tools, enabling the model to discover optimal compression/stashing/retrieval policies through RL training (see [hyperagent-benchmark-plan.md](hyperagent-benchmark-plan.md) and [rl-methods-for-agent-training.md](../../researches/2026-06-10-rl-methods-for-agent-training.md)).

## 2. Tool Surface

### Worker-side tools

| Tool | Signature | Behavior | SOTA reference |
|------|-----------|----------|----------------|
| `compress_findings` | `compress_findings(max_tokens: number)` | Summarizes current source evaluations to a tight structured block. Drops raw snippets, keeps only: source ID, tier, credibility, key finding (1–2 sentences), metadata. Returns compressed text and token savings. | MEM1 internal-state tag; SimpleMem compression (+26.4% F1 at ~30× fewer tokens) |
| `stash_finding` | `stash_finding(key: string, content: string)` | Writes a finding to `.research/<run-id>/findings.json` under the given key. Content is the compressed summary from `compress_findings` or a custom block. Returns confirmation. | Anthropic file-based handoffs; MemAgent write loop (extrapolates to 3.5M tokens) |
| `recall_finding` | `recall_finding(key: string)` | Retrieves a stashed finding by key. Returns the stored content. | Git Context Controller (SWE-bench 80.2%); NOTES.md external memory |
| `list_findings` | `list_findings()` | Lists all stashed finding keys for the current run. Returns array of keys with brief metadata (SQ, timestamps). | — |
| `context_usage` | `context_usage()` | Returns current token count, % of budget, and breakdown by message role. | AdaCoM (+39% BrowseComp-Plus); self-awareness pattern |
| `prune_sources` | `prune_sources(min_tier: string, min_credibility: number)` | Drops source data below the given tier/credibility threshold from the current context. Keeps source IDs in inventory. | Agent-learned priority scoring; hierarchical context management |
| `escalate` | `escalate(reason: string, details: string)` | Sends an escalation message to the planner via orchestration, including the reason (blocked, insufficient_sources, conflicting_evidence) and structured details. | Escalation handling (rec 4b from gap analysis) |

### Planner-side tools

| Tool | Signature | Behavior | SOTA reference |
|------|-----------|----------|----------------|
| `merge_findings` | `merge_findings(sq_id: string)` | Reads `.research/<run-id>/sqN-findings.json` for the given sub-question, replaces the raw worker payload in context with the stashed compressed version. | Anthropic context resets; planner-writes-files pattern (rec 1c) |
| `check_coverage` | `check_coverage()` | Scans all worker findings and reports: (a) sub-questions with <3 Tier A/B sources, (b) sub-questions with zero Tier A sources, (c) overall source count vs depth minimum. | Per-SQ quality gates (Codex review feedback) |
| `spawn_gap_worker` | `spawn_gap_worker(sq_id: string, gap_description: string)` | Creates a new Orca worker terminal + task for the under-covered sub-question, dispatches it, and waits for worker_done. | Gap-driven re-dispatch (rec 4a) |
| `synthesize_from_stash` | `synthesize_from_stash()` | Reads all stashed findings from `.research/<run-id>/findings.json` and uses them (instead of raw worker payloads) as input for the final report synthesis. | File-based handoff; sequential merge-and-compress |

## 3. RL Training Integration

### Why custom tools work with RL

Polar (see [rl-methods-for-agent-training.md](../../researches/2026-06-10-rl-methods-for-agent-training.md)) captures every tool call as part of the training trajectory. When the model:

1. Calls `compress_findings` at the right moment → more context available later → better synthesis → higher rubric score → **GRPO reinforces the behavior**
2. Calls `stash_finding` + later `recall_finding` → information preserved across a context reset → fewer dropped facts → higher recall score → **reinforced**
3. Calls `prune_sources` too aggressively → loses critical evidence → lower recall score → **penalized**
4. Calls `context_usage` and acts on the information → stays under budget while keeping critical content → **reinforced**

The model **discovers the optimal policy** through reward feedback rather than us hand-coding "compress at 80% utilization" or "stash before spawning worker 4."

### Training loop

```
For each rollout (prompt from ResearchRubrics):
  1. Model runs Deep Researcher with context tools available
  2. Model decides:
     - When to compress findings (may call compress_findings mid-search)
     - What to stash (key findings for later synthesis)
     - When to prune (low-tier sources eating context)
     - Whether to escalate (insufficient sources)
  3. Planner merges stashed findings via merge_findings
  4. Planner synthesizes report from stashed data via synthesize_from_stash
  5. Final report scored by ResearchRubrics judge
  6. Reward = rubric compliance score (quality) − context_overrun_penalty (cost)
  7. GRPO updates model weights, reinforcing helpful tool-usage patterns
```

### Multiobjective extension

Add context efficiency as a Pareto objective alongside quality and cost:

| Objective | Direction | Measurement |
|-----------|-----------|-------------|
| **Quality** | Maximize | Rubric compliance score (0–1) |
| **Context efficiency** | Maximize | (total_available_tokens − peak_usage) / total_available_tokens |
| **Cost** | Minimize | Total token spend |
| **Latency** | Minimize | Wall-clock time |

This prevents the model from learning "just never compress" or "compress everything to one word" — both extremes hurt quality. NSGA-II Pareto selection (per Hyperagent plan) finds the frontier of (quality, efficiency) tradeoffs.

## 4. Implementation Notes

### File-based storage

All stash/recall operations use `.research/<run-id>/findings.json`:

```json
{
  "run_id": "2026-06-10-deep-research-rl",
  "findings": {
    "sq1_key_claims": {
      "content": "GRPO eliminates value network. DAPO: Clip-Higher + Dynamic Sampling...",
      "sq": 1,
      "timestamp": "2026-06-10T14:00:00Z",
      "token_savings": 3200
    },
    "sq2_conflicts": {
      "content": "On-policy vs replay buffers: WEBAGENT-R1 says essential...",
      "sq": 2,
      "timestamp": "2026-06-10T14:05:00Z",
      "token_savings": 1800
    }
  },
  "metrics": {
    "total_stashed_tokens": 15000,
    "peak_context_usage": 85000,
    "context_budget": 200000,
    "compressions_triggered": 3
  }
}
```

### Worker isolation

Workers remain read-only for file mutations. Stash operations use `orca orchestration send` to report compressed findings to the planner, which writes them to the filesystem. Workers can read `.research/<run-id>/` for context but cannot write to it. This preserves the isolation envelope (D010).

### Tool implementation

Tools are implemented as pi extensions (TypeScript) and loaded by the worker/planner pi session. They follow standard pi tool conventions:

- Input validation via Zod schemas
- Tool descriptions visible to the model (used for planning)
- Return values are text summaries the model can reason about
- File I/O restricted to `.research/<run-id>/` (sandbox)

## 5. Relation to Existing Plans

| Plan | Role |
|------|------|
| [evaluation-integration.md](evaluation-integration.md) | Provides the reward signal (ResearchRubrics scores) |
| [hyperagent-benchmark-plan.md](hyperagent-benchmark-plan.md) | Provides the evolution/search framework (NSGA-II, organisms, archive) |
| [rl-finetuning-plan.md](rl-finetuning-plan.md) | Provides the training infrastructure (Polar + TRL + GRPO) |
| **This plan** | Provides the tool surface that makes context management learnable |

The four plans form a complete stack:

```
Evaluation (ResearchRubrics)
  → Evolution (Hyperagent NSGA-II)
    → RL Training (Polar + TRL + GRPO)
      → Learnable Behaviors (Context tools)
```

## 6. References

- [SOTA Research Report](../../researches/2026-06-09-deep-search-agents-deep.md) — SQ3 (memory as write-manage-read loop), SQ7 (reliability, context anxiety)
- [RL Methods Report](../../researches/2026-06-10-rl-methods-for-agent-training.md) — GRPO, RLVR, Polar, frameworks
- [Evaluation Integration](evaluation-integration.md) — ResearchRubrics reward signal
- [Hyperagent Benchmark Plan](hyperagent-benchmark-plan.md) — Evolutionary optimization
- MEM1 (arXiv:2506.15841) — Internal-state compression, 3.5× effective multiplier
- AdaCoM (arXiv:2605.30785) — External context-manager, +39% BrowseComp-Plus
- SimpleMem (arXiv:2601.02553) — Compression + consolidation, +26.4% F1
- MemAgent (arXiv:2507.02259) — Fixed-length overwrite loop, 3.5M tokens
- Anthropic — [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
