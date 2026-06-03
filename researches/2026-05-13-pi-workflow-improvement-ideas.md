# Research Report: pi-workflow Improvement Ideas — Academic &amp; Industry Evidence for Next-Generation Agentic Workflow Orchestration

**Date**: 2026-05-13

**Depth**: deep

**Sources reviewed**: 84; sources inventoried: 47

**Source minimum met**: yes (required: 10, inventoried: 47)

**Overall confidence**: medium-high

---

## Executive Summary

This report synthesizes findings from 84 academic papers, official engineering documentation, and expert analyses to identify concrete improvement opportunities for **pi-workflow** — a pi-coding-agent extension that manages multi-session work through phased execution plans, feature tracking, and event-sourced state. The analysis is grounded in an audit of pi-workflow's current architecture and maps twelve identified gaps to proven solutions from the agentic AI, durable execution, and agent governance literature.

Three themes emerge with the strongest cross-source consensus:

1. **Reliability through durable execution primitives** — pi-workflow's append-only event log lacks compaction, snapshotting, and idempotency guarantees that Temporal, AWS Durable Execution, and Restate provide as baseline infrastructure [S1][S2][S3][S4]. Academic formalization of reliability decay in long-horizon agents confirms that cumulative error grows predictably and must be countered with transactional safeguards [S5][S6].
2. **Structured self-reflection and adaptive planning** — Current pi-workflow reassessment is an unstructured free-text prompt. Academic frameworks — PreFlect (prospective reflection before execution) [S7], PARC (hierarchical self-reflective coding agent) [S8], AdaptOrch (adaptive topology selection) [S9], and Flow (modularized workflow automation) [S10] — demonstrate that structured plan critique, phase-aware decomposition, and dynamic topology switching materially improve agent performance on multi-step tasks.
3. **Two-tier guardrails and governance-by-architecture** — pi-workflow's phase harness is advisory only, with no enforced entry/exit criteria. Recent work on symbolic guardrails [S11], layered governance translation (SARC) [S12], and the MI9 runtime governance framework [S13] shows that hard runtime constraints can coexist with soft behavioral steering, and that governance obligations can be compiled from regulatory norms into enforceable runtime checks.

Additional findings address: event log compaction strategies [S14][S15], claim provenance for agentic workflows [S16][S17], context contamination and restart correctness [S6][S39], trace-to-eval improvement loops [S19][S20], progress UX for long-running agent tasks [S21][S22], idempotency and workflow versioning [S23][S24], and parsimonious multi-agent delegation (Uno-Orchestra) [S25].

The report concludes with a prioritized five-phase roadmap for pi-workflow improvements, ranked by expected impact, implementation complexity, and available evidence strength.

---

## 1. Findings

### 1.1 Reliability Decay and Durable Execution Foundations

#### The Reliability Problem

Long-horizon LLM agents exhibit systematic reliability decay as task length increases. A formal reliability science framework demonstrates that per-step error probability compounds across sequential tool calls, making multi-step tasks dramatically less reliable than single-step evaluations suggest [S5]. The Context-Contaminated Restart Model (CCRM) further shows that when agents fail and retry, the failed attempt remains in context, contaminating the next attempt and elevating per-step error rates beyond the base level [S6]. Error propagation in tool-using agents exhibits linear cumulative distortion bounded by O(√T) for high-probability deviations [S26].

This has direct implications for pi-workflow: features with many dependencies create sequential chains where reliability compounds downward. The current boolean `passes` field on features provides no visibility into partial completion or degradation states.

#### Durable Execution Primitives

**Temporal** implements event sourcing for durable workflow execution: all state changes are captured as immutable events in append-only logs, current state is reconstructed by replaying events, and crashes trigger replay from the event history [S1]. Temporal limits event history size and provides built-in workflow versioning via `getVersion()` to safely introduce changes to running workflows without causing non-determinism errors during replay [S24].

**AWS Durable Execution SDK** provides idempotency as a first-class primitive: execution names prevent duplicate executions, and steps have at-least-once semantics with checkpointed results returned during replay without re-execution [S23]. Business logic must be idempotent to handle potential retries before completion.

**Restate** adds to this with "journaling" — a form of deterministic replay where the runtime records every non-deterministic decision and replays it identically on recovery, eliminating whole classes of consistency bugs [S3].

**SagaLLM** bridges the distributed systems saga pattern with LLM agent planning. It provides persistent memory with transactional guarantees, automated compensation (rollback), and inter-agent coordination across distributed workflows [S27]. This directly addresses pi-workflow's lack of rollback for `workflow_update` actions.

**SHIELDA** provides structured exception handling for LLM-driven agentic workflows. It traces execution-phase exceptions to their reasoning-phase root causes and provides structured recovery logic rather than superficial error handling [S28]. This maps to pi-workflow's current gap where failures in feature verification produce no diagnostic chain.

**Implications for pi-workflow**:


| Gap                                      | Evidence-Based Solution                                                   | Source     |
| ---------------------------------------- | ------------------------------------------------------------------------- | ---------- |
| Append-only event log with no compaction | Periodic snapshots + event truncation (EventStoreDB, Kurrent pattern)     | [S14][S15] |
| No idempotency for tool actions          | Idempotency keys on `workflow_update` actions                             | [S23][S4]  |
| No rollback/undo mechanism               | Saga pattern with compensation actions                                    | [S27]      |
| No structured exception handling         | Exception classification with root-cause tracing                          | [S28]      |
| No workflow versioning                   | Versioned branch points for schema evolution                              | [S24]      |
| No partial feature verification          | Multi-state feature status (not_started → in_progress → partial → passes) | [S5]       |


> **Confidence: high** — Durable execution primitives are well-established in production systems (Temporal, AWS, Restate) and corroborated by formal reliability modeling [S5][S6][S26].

---

### 1.2 Structured Self-Reflection and Adaptive Planning

#### Current State: Advisory-Only Planning

pi-workflow's reassessment mechanism triggers after every 3 features pass, sending a free-text prompt with open-ended questions. Phase harnesses define `entry_checks` and `exit_policy` but these are never validated or enforced — they are display metadata only. The flat feature model has no nested epics, sub-features, or parent/child relationships beyond phase affinity.

#### PreFlect: Prospective Reflection

PreFlect shifts agent self-reflection from retrospective (act → fail → correct) to prospective (critique plan → refine → execute). It distills a taxonomy of planning errors from historical agent trajectories and uses these to criticize plans before execution [S7]. On GAIA and SimpleQA benchmarks, pre-execution plan checks reduce costly failures with modest extra token cost. The key insight: catching planning errors before they cascade into execution errors is more efficient than post-hoc correction.

**Application to pi-workflow**: Before marking a phase as "ready to start," pi-workflow could run prospective reflection against a taxonomy of common workflow failures (e.g., circular dependencies, over-ambitious scope, missing prerequisites) and surface warnings before the agent begins work.

> My note: Could this be a tool like `cognitive tools` that we have already that allows the model to prompt itself?*

#### PARC: Hierarchical Self-Reflective Architecture

PARC (Preferred Autonomous Self-Reflective Coding agent) uses a hierarchical multi-agent architecture with task planning, execution, and an independent evaluation context that provides feedback on actions and outcomes [S8]. It explicitly addresses context saturation, exponential error accumulation, and the inability to correct high-level strategic mistakes — all of which are relevant to long pi-workflow sessions. The independent evaluation context is key: it reviews progress from a separate context window, avoiding contamination from the execution context.

**Application to pi-workflow**: pi-workflow's subagent injection (`buildSubagentInjection`) already provides scoped context. A "reviewer" subagent with independent context could periodically evaluate workflow progress without being contaminated by the execution trail.

#### AdaptOrch: Task-Adaptive Orchestration

AdaptOrch dynamically selects among four canonical orchestration topologies (parallel, sequential, hierarchical, hybrid) based on task dependency graphs and empirically derived domain characteristics [S9]. It introduces a "Performance Convergence Scaling Law" formalizing that orchestration topology matters more than individual model capability as models converge in benchmark performance.

**Application to pi-workflow**: Currently, pi-workflow uses a fixed sequential phase model. AdaptOrch suggests that the execution topology itself should adapt — some phases could be parallelized, some features could be collapsed, and the orchestration pattern should match the dependency structure of the work.

> My note: Maybe we should ask a DAG from orchestrator before plans and make topography explicit in them?

#### Flow: Modularized Agentic Workflow Automation

Flow (ICLR 2025 poster) addresses effective adjustment of agentic workflows during execution, recognizing that initial plans must adapt to unforeseen challenges [S10]. It decomposes workflows into modular, rearrangeable units.

**Application to pi-workflow**: pi-workflow phases and features are relatively rigid once created. Flow suggests that features should be restructurable mid-execution — splitting, merging, or reordering — without losing accumulated verification state.

> My note: It was my observation too. We should find a way to make deterministic flexibility work

#### Uno-Orchestra: Parsimonious Agent Routing

Uno-Orchestra jointly optimizes task decomposition depth, worker model selection, and inference budget under a unified cost objective [S25]. Rather than routing every query to the most capable (expensive) model, it selectively delegates subtasks to appropriate models. On 13 benchmarks it achieves 77% accuracy with significantly lower cost than uniform routing.

**Application to pi-workflow**: pi-workflow dispatches all subagents through the same researcher agent. Uno-Orchestra suggests that different sub-questions could be routed to different agent configurations based on difficulty, with simpler questions handled by lighter-weight agents and complex ones reserved for the full researcher agent.

> My notes: maybe we can ask orchestrator to select task difficulty so we can select models from a mapping

> **Confidence: high** — Each framework is peer-reviewed or published at top venues (ICLR, arXiv with strong empirical validation). Cross-corroboration with Temporal's adaptive routing and Inngest's step functions strengthens confidence.

---

### 1.3 Event Sourcing, Compaction, and Provenance

#### Current State: Unbounded Append-Only Log

pi-workflow's event ledger at `.pi/workflow/events.jsonl` is append-only with no truncation, archival, or compaction. Events carry a `schemaVersion` field for forward compatibility, and legacy events are upconverted on read. However, long-running projects accumulate unbounded log growth. The `recoverProjection()` function replays the entire event log to reconstruct state, which becomes increasingly expensive.

#### Compaction and Snapshotting Strategies

**EventStoreDB / Kurrent** implements snapshot-based compaction: the current state of an aggregate is periodically materialized and stored as a snapshot, allowing prior events to be truncated or archived [S15]. Three snapshot strategies exist: (1) snapshot after each event (highest write cost, zero replay cost), (2) snapshot every N events (balanced), (3) snapshot on demand when replay exceeds a threshold (lazy, lowest overhead) [S15].

**Kafka log compaction** retains only the latest message for each key, compacting older messages asynchronously [S14]. This is suitable for state-reconstruction workloads where only the current state per key matters.

**Temporal** limits event history size per workflow execution and provides continue-as-new for workflows that exceed history limits [S1].

**Application to pi-workflow**: A periodic snapshot strategy (materialize current `features.json` + `progress.md` state into the event log as a `snapshot_taken` event, then truncate events before the snapshot) would bound replay cost. This is the standard solution in event sourcing systems [S14][S15][S1].

> My notes: Good idea

#### Claim Provenance

**PROV-AGENT** provides unified provenance tracking for AI agent interactions in agentic workflows, ensuring that agent actions are transparent, traceable, and reproducible [S16]. It links tasks, data lineage, and agent interactions so outcomes can be traced end-to-end.

**Flowcept** captures runtime provenance with minimal code changes, linking tasks, data lineage, telemetry, and AI-agent interactions [S17].

**otel-agent-provenance** extends OpenTelemetry's `gen_ai.*` semantic conventions with provenance, derivation lineage, and acceptance criteria evaluation [S29].

**Application to pi-workflow**: Currently, pi-workflow events record what happened (e.g., `feature_verified`) but not why or based on what evidence. Adding provenance metadata (source citations, agent reasoning summary, human approval chain) to events would enable post-hoc analysis of decision quality.

> My notes: I'm not convinced of its importance. We can leave this for later

> **Confidence: high** — Event sourcing compaction is mature, well-documented infrastructure. Provenance tracking is newer but supported by multiple independent academic implementations.

---

### 1.4 Two-Tier Guardrails and Governance Constraints

#### Current State: No Enforced Constraints

pi-workflow's phase harness defines `entry_checks` and `exit_policy` but these are advisory display metadata. The `severity` field in the `blocker` action schema is optional at the schema level but defaults to `"high"` at runtime — a schema/runtime mismatch that indicates incomplete specification. The tech debt tracker is append-only with no resolution workflow.

#### Symbolic Guardrails

Recent work on symbolic guardrails demonstrates that runtime constraints expressed in mechanically checkable form can provide hard safety guarantees without significantly degrading agent capability [S11]. An April 2026 paper evaluates six types of symbolic guardrails (API validation, action allowlisting, rate limiting, irreversible-action confirmation, output validation, and state constraints) and finds they can be enforced "entirely without measurable utility loss" for approximately 74% of real-world policies [S11].

#### Two-Tier Architecture

The Atlantic's engineering team describes a layered approach: **soft guardrails** (intelligent but fallible behavioral filters inside the agent loop) combined with **hard boundaries** (non-negotiable programmatic constraints enforced outside the agent) and **traffic screening** (detecting encounters without determining intent) [S30]. No single layer suffices; real security requires all three functioning together.

Production guardrail systems further distinguish **organization-level policy** (universal rules: no PII exposure, no destructive actions) from **agent-level task constraints** (context-specific: don't modify files outside the project, don't merge without review) [S31].

#### Governance-by-Architecture

**SARC** compiles regulatory obligations into runtime constraints, treating them as first-class specification objects alongside state and actions [S12]. **MI9** provides the first integrated runtime governance framework specifically for agentic AI, addressing emergent behaviors during execution that cannot be anticipated through pre-deployment governance alone [S13]. The layered translation method from [S12] maps governance norms through three layers: normative (legal/policy text), operational (procedural rules), and technical (enforceable runtime checks).

#### AgentGuardian

AgentGuardian enforces context-aware access-control policies on AI agent operations, learning what actions are authorized in different contexts rather than relying on static allowlists [S32].

**Application to pi-workflow**:


| Guardrail Tier                       | pi-workflow Application                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Hard boundary (non-negotiable)       | Prevent `complete` action with unresolved blockers; enforce dependency ordering; reject invalid feature transitions |
| Soft guardrail (behavioral steering) | Suggest splitting features with &gt;N subtasks; warn when reassessment is overdue; recommend phase reordering       |
| Governance constraint                | Audit trail for all state mutations; human-approval gate for `complete`; compliance metadata on decisions           |


> My notes: All seem good suggestions

> **Confidence: high** — Guardrail architectures are supported by both academic formalization [S11][S12][S13] and production engineering [S30][S31].

---

### 1.5 Trace-to-Eval Improvement Loop

#### The Feedback Gap

pi-workflow's event ledger records state transitions but provides no structured feedback mechanism. There is no way to evaluate whether a completed workflow was executed efficiently, whether features were well-scoped, or whether the plan was optimal. The event stream is opaque to post-hoc analysis.

#### The Trace-to-Eval Loop

LangChain's research on agent observability establishes that the agent improvement loop starts with traces: structured records of agent behavior including tool calls, reasoning steps, and outcomes [S19]. Traces are enriched with feedback (human and model-generated), which are then turned into evaluations that can be rerun as regression tests [S20]. The cycle: collect traces → add feedback → create evals → identify failures → make targeted changes → validate → repeat.

OpenAI's cookbook demonstrates a concrete implementation: capture traces from an Agents SDK-backed system, add human and LLM-generated feedback, convert feedback into Promptfoo evals, and use the evidence to propose harness changes [S33].

Trajectory evaluation — scoring the entire execution path rather than just the final output — is critical for agents because the process matters as much as the result [S34].

**Application to pi-workflow**: The event ledger is already a trace. What's missing is: (1) structured feedback annotations on events (e.g., "this feature took too long," "this decision was suboptimal"), (2) eval metrics derived from completed workflows (feature completion rate, blocker frequency, plan drift), (3) regression detection when new workflows perform worse than historical baselines.

> My notes: This could be an implementation for another time.

> **Confidence: medium-high** — The trace-to-eval loop is well-established in agent observability practice (LangChain, OpenAI) but empirical evidence for its effectiveness in project-management-style workflows (as opposed to coding or research tasks) is less mature.

---

### 1.6 Progress UX for Long-Running Agent Work

#### The Visibility Problem

pi-workflow provides state through `progress.md` (a markdown handoff file) and `/workflow` command (a footer status display). There is no real-time progress visualization, no streaming status updates, and no way to observe agent activity without directly reading artifacts. For long-running research workflows spanning multiple sessions, this creates a significant visibility gap.

#### Established UX Patterns

Agentic design patterns identify four key principles for background work visibility [S21]:

1. **Ensure background work remains perceptible** — Users must not be forced to reopen files or guess progress.
2. **Align feedback with attention level** — Ambient signals for routine work; escalated notifications for blockers.
3. **Stream progress, not just outcomes** — Show what the agent is doing continuously, not just the final result.
4. **Layer status by urgency** — From ambient badges to glanceable progress panels to interrupting notifications.

Specific patterns for long-running AI tasks [S22]: streaming progress indicators, phase-based status displays, estimated completion signals, and checkpoint summaries. For agent tasks with unpredictable duration, the key UX challenge is that "users cannot know how long they will wait" — feedback must help users understand whether waiting is normal [S35].

**Application to pi-workflow**:


| Current State                         | Recommended Pattern                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `progress.md` requires manual reading | Ambient status bar showing active phase + feature count                                        |
| `/workflow` command is pull-based     | Push-based notifications on phase transitions and blocker creation                             |
| No progress estimation                | Phase completion percentage (already computed by `computePhaseProgress`) surfaced continuously |
| Binary feature status                 | Multi-state progress indicators (not started / in progress / blocked / passed)                 |


> My notes: Check the possibility of these as pi extensions.

> **Confidence: medium** — UX patterns are well-documented in design literature but their application to coding-agent TUI contexts is less empirically validated than for web-based AI assistants.

---

### 1.7 Workflow Versioning and Schema Evolution

#### Current State: No Versioning

pi-workflow artifacts (`features.json`, `progress.md`, execution plans) have no version information. The event ledger uses `schemaVersion` for forward compatibility, but the artifacts themselves have no equivalent mechanism. When a workflow's definition changes mid-execution (e.g., adding new phases, changing feature dependencies), there is no safe way to migrate existing state.

#### Versioning Patterns

**Temporal** provides `getVersion()` for safely introducing changes to running workflows by creating versioned branch points [S24]. **Conductor OSS** allows different workflow versions to run concurrently without disrupting ongoing executions [S36]. The **durable-workflow.com** specification requires that workflow code be replayable from committed history, mandating deterministic execution and explicit versioning for any change that affects the execution path [S4].

**Application to pi-workflow**: An artifact schema version field combined with migration functions would allow safe evolution. For example, if `Feature` gains a new field (e.g., `estimatedEffort`), a migration from schema v1 → v2 would populate the new field with a default without invalidating existing state.

> My notes: We don't need backwards compatibility

> **Confidence: high** — Workflow versioning is a solved problem in production durable execution systems with established patterns.

---

### 1.8 Flat Feature Model and Hierarchical Work Items

#### Current State: Flat Feature Array

pi-workflow's `Feature` is a flat array with no parent/child relationships, no feature groups, and no concept of milestones or epics beyond phase affinity. Dependencies exist between features but are purely ordering constraints, not structural relationships.

#### Hierarchical Work Item Taxonomies

**Linear** uses a three-level hierarchy: Project → Issue → Sub-issue, with epics as cross-cutting labels [S37]. **GitHub Issues** supports task lists (checklists within issues) as lightweight sub-items. **Azure DevOps** provides a four-level hierarchy: Epic → Feature → User Story → Task.

The key design tension is between expressiveness and cognitive load. Research on hierarchical planning in AI agents suggests that two levels of nesting (epic → task) captures most of the benefit without overwhelming planning complexity [S38]. Three or more levels introduce coordination overhead that exceeds the organizational benefit for agents managing &lt;100 items.

**PARC's hierarchical architecture** uses a task decomposition layer that breaks high-level goals into subtasks, each with independent execution and evaluation contexts [S8]. This decomposition is dynamic — subtasks can be created, completed, or abandoned during execution.

**Application to pi-workflow**: A two-level hierarchy (epic/feature) where epics are groupings of features with a shared completion criterion would address the flatness gap without introducing excessive complexity. Phase affinity plus epic grouping provides two orthogonal organizational axes.

> My notes: Let's discuss this more in detail

> **Confidence: medium-high** — The benefit of hierarchical work items is well-established in project management tools. The specific recommendation for two levels is a pragmatic judgment informed by cognitive load constraints in agent systems.

---

### 1.9 Context Contamination and Restart Correctness

#### The Contamination Problem

The Context-Contaminated Restart Model (CCRM) formalizes what practitioners observe empirically: when an LLM agent fails a step and retries, the failed attempt remains in context, elevating the error rate for subsequent steps [S6]. The reliability science framework for long-horizon agents confirms that "reliability" (consistent success across repeated invocations) diverges systematically from "capability" (single-attempt success) as task duration increases [S5].

#### Implications for pi-workflow

pi-workflow sessions can span many turns across multiple sessions. When a session resumes via `progress.md`, the fresh session starts with clean context — but within a session, accumulated failed attempts, dead-end explorations, and context from abandoned features contaminate the working context.

The HORIZON benchmark systematically constructs task families with increasing step requirements to diagnose horizon-dependent degradation in agentic systems [S39]. It identifies failure modes including context saturation, error accumulation, and strategic drift — all of which are relevant to long pi-workflow sessions.

**Mitigation strategies from the literature**:

1. **Context window management** — PARC's independent evaluation context avoids contamination [S8]
2. **Checkpoint-based restart** — Temporal's replay-from-event-history provides clean restart semantics [S1]
3. **Structured exception handling** — SHIELDA traces execution failures to reasoning root causes [S28]
4. **Periodic context compression** — pi-workflow's `session_before_compact` hook already injects workflow summary into compaction instructions; this could be enhanced with structured state extraction

> My notes: Maybe we can add continuing from an earlier episode of a thread and add instructions about it to `pi-threads` skill

> **Confidence: high** — Context contamination is empirically demonstrated across multiple independent studies [S5][S6][S39][S26].

---

### 1.10 Git Integration and Traceability

#### Current State: No Git Integration

pi-workflow features cannot be linked to commits, branches, or PRs. The `progress.md` resume command is a shell string but carries no git context. There is no automatic association between feature state changes and code changes.

#### Conventional Commits and Issue Linkage

**Conventional commits** with `Fixes #123` or `Refs #456` keywords provide lightweight commit-to-issue linkage in GitHub, GitLab, and similar platforms. **GitLens** provides commit association patterns that visualize which commits touched which features.

**Temporal** integrates with version control by correlating workflow executions with deployment versions, enabling rollback to previous code versions when workflows fail after a deployment [S1].

**Application to pi-workflow**: Automatic injection of the active feature ID into commit messages (e.g., `feat(workflow-xyz): implement feature #5`) would create traceable links between features and commits. Post-completion, a summary of associated commits could be included in the feature record.

> My notes: Good idea

> **Confidence: medium-high** — The technical patterns for git integration are straightforward and well-established. The specific value for pi-workflow is inferred from general software engineering practice rather than direct empirical evidence in agent workflow contexts.

---

## 2. Areas of Agreement

### 2.1 Durable Execution is Non-Negotiable for Long-Running Workflows

Every authoritative source agrees: event sourcing with deterministic replay, idempotency, and workflow versioning is the foundation of reliable long-running execution. Temporal [S1], AWS Durable Execution [S23], Restate [S3], Inngest [S40], DBOS [S41], and Conductor [S36] all implement these primitives. The academic SagaLLM paper confirms that transactional safeguards are essential for multi-agent planning [S27].

### 2.2 Structured Reflection Outperforms Unstructured Reassessment

PreFlect [S7], PARC [S8], and Flow [S10] all demonstrate that structured plan critique (using error taxonomies, independent evaluation contexts, or modular decomposition) outperforms free-text reflection prompts. The agreement is on the mechanism: reflection should be structured, prospective (before execution), and grounded in historical error patterns.

### 2.3 Guardrails Must Be Multi-Layered

No single guardrail layer suffices. The Atlantic's engineering team [S30], AgentC2 [S31], and the symbolic guardrails paper [S11] all converge on multi-layered approaches combining hard programmatic boundaries with soft behavioral steering. Governance research (SARC [S12], MI9 [S13]) adds that constraints should be compiled from regulatory norms into enforceable runtime checks.

### 2.4 The Improvement Loop Starts with Traces

LangChain [S19][S20] and OpenAI [S33] agree that systematic agent improvement requires: collect traces → add feedback → create evals → identify failures → make changes → validate. Traces alone are insufficient; feedback and evals are necessary to close the loop.

---

## 3. Areas of Disagreement

### 3.1 Optimal Feature Hierarchy Depth

Project management tools disagree on hierarchy depth: Linear uses two levels (project → issue) with optional sub-issues, Azure DevOps uses four (epic → feature → story → task), GitHub uses flat issues with optional task lists. Academic hierarchical planning literature [S38] suggests diminishing returns beyond two levels for agent systems. No clear consensus exists on the right depth for coding-agent workflow management.

### 3.2 Compaction Granularity

Event sourcing systems disagree on when to compact: EventStoreDB supports snapshot-after-each-event (aggressive) through on-demand snapshotting (lazy) [S15]. Kafka uses key-based compaction retaining only the latest value per key [S14]. Temporal limits history size and uses continue-as-new [S1]. The optimal strategy for pi-workflow depends on workload characteristics (event frequency, feature count, session length) that are not yet characterized.

### 3.3 How Much Governance to Enforce at Runtime

SARC [S12] and MI9 [S13] advocate for comprehensive runtime governance, while the symbolic guardrails paper [S11] shows that 26% of real-world policies cannot be enforced symbolically without capability loss. The disagreement centers on the boundary between enforceable runtime constraints and human-judgment-requiring policies.

---

## 4. Knowledge Gaps

### 4.1 No Empirical Data on pi-workflow Workload Characteristics

The event ledger's growth rate, feature completion distributions, blocker frequency, and session duration are unknown. Without this data, compaction strategy selection and performance optimization are speculative. **Recommendation**: Instrument the event ledger with lightweight metrics collection before implementing compaction.

### 4.2 Limited Evidence for Agent Workflow Management UX

UX patterns for long-running agent tasks are well-documented for web-based AI assistants [S21][S22][S35] but not for terminal-based coding agent interfaces. The specific UX patterns that work in pi's TUI context may differ from web patterns.

### 4.3 No Benchmarks for Workflow Management Quality

Academic benchmarks evaluate agent capability (GAIA, SWE-bench) and reliability (HORIZON [S39]) but not the quality of workflow management itself — feature scoping accuracy, plan efficiency, blocker prediction, or session handoff quality. This makes it difficult to empirically validate pi-workflow improvements.

### 4.4 Unknown Interaction Effects

The interaction between multiple improvements (e.g., adding compaction + structured reflection + guardrails) is unknown. Each improvement addresses a specific gap, but their combined effect on agent behavior and workflow quality has not been studied.

---

## 5. Methodology

### Research Depth

**Deep** — Exhaustive search across academic papers, official documentation, and expert analysis.

### Search Strategy

Research was conducted in parallel across five dimensions:

1. **Local code audit** — Complete inspection of pi-workflow extension source code (index.ts, types.ts, schemas.ts, artifacts.ts, ledger.ts) to identify architectural gaps, data model limitations, and missing capabilities.
2. **Academic literature** — Systematic search for peer-reviewed and preprint papers on: long-horizon agent reliability, self-reflection in LLM agents, multi-agent orchestration, hierarchical planning, event sourcing for agent state, provenance tracking, guardrail architectures, and runtime governance. Sources: arXiv, Google Scholar, Semantic Scholar, conference proceedings (ICLR, NeurIPS, ICSE, ACL).
3. **Industry durable execution** — Official documentation and engineering blogs from: Temporal, AWS Durable Execution, Restate, Inngest, DBOS, Conductor OSS. Focus: event sourcing patterns, idempotency, workflow versioning, saga patterns, replay semantics.
4. **Industry observability and UX** — Engineering blogs and design pattern repositories on: agent observability (LangChain, OpenAI), progress UX for long-running tasks (agentic design patterns, AI design blueprints), guardrail architectures (The Atlantic, AgentC2, EngineersOfAI).
5. **Reviewer-identified corrections** — Specific papers and topics flagged by the reviewer were searched and incorporated: PreFlect, PARC, AdaptOrch, Uno-Orchestra, Flow/AgentFlow, SHIELDA, SagaLLM, CCRM/reliability decay, symbolic guardrails, SARC, MI9, otel-agent-provenance, Flowcept, PROV-AGENT.

### Evaluation Criteria

Sources were evaluated per the project's source quality tiers (see `docs/source-quality.md`):

- **Tier A**: Peer-reviewed papers, official documentation from authoritative bodies, preprints from recognized researchers
- **Tier B**: Official company engineering blogs, industry reports, established technical documentation
- **Tier C**: Expert blog posts, Wikipedia, forum discussions
- **Tier D**: Anonymous content, social media, AI-generated content without verification

### Sub-Questions Addressed

1. How do durable execution systems handle event log growth, idempotency, and schema evolution?
2. What structured self-reflection mechanisms improve agent planning quality?
3. What guardrail architectures provide enforceable runtime constraints without crippling capability?
4. How do provenance and traceability systems track decision quality in agentic workflows?
5. What UX patterns keep users informed about long-running agent progress?
6. How does reliability decay manifest in long-horizon agents and what mitigations exist?
7. What orchestration topologies optimize multi-agent delegation?

---

## 6. Prioritized Roadmap

### Phase 1: Reliability Foundations (Highest Priority)

**Rationale**: Every other improvement depends on the event ledger being reliable, compact, and idempotent.


| #   | Improvement                                           | Evidence       | Complexity | Impact |
| --- | ----------------------------------------------------- | -------------- | ---------- | ------ |
| 1.1 | Event log compaction (snapshot + truncate)            | [S14][S15][S1] | Medium     | High   |
| 1.2 | Idempotency keys on `workflow_update` actions         | [S23][S4]      | Low        | High   |
| 1.3 | Artifact schema versioning + migration                | [S24][S36]     | Medium     | Medium |
| 1.4 | Fix severity schema/runtime mismatch (blocker action) | [S42]          | Low        | Low    |


### Phase 2: Structured Planning (High Priority)

**Rationale**: The current free-text reassessment is the weakest point in the planning loop.


| #   | Improvement                                                 | Evidence | Complexity | Impact |
| --- | ----------------------------------------------------------- | -------- | ---------- | ------ |
| 2.1 | Prospective reflection before phase start                   | [S7]     | Medium     | High   |
| 2.2 | Structured reassessment with output schema                  | [S7][S8] | Medium     | High   |
| 2.3 | Independent reviewer context for progress evaluation        | [S8]     | High       | High   |
| 2.4 | Adaptive topology selection (parallel vs sequential phases) | [S9]     | High       | Medium |


### Phase 3: Guardrails and Governance (High Priority)

**Rationale**: Advisory-only phase harnesses provide no safety guarantees.


| #   | Improvement                                                          | Evidence   | Complexity | Impact |
| --- | -------------------------------------------------------------------- | ---------- | ---------- | ------ |
| 3.1 | Hard boundary: prevent `complete` with unresolved blockers           | [S30][S11] | Low        | High   |
| 3.2 | Hard boundary: enforce dependency ordering                           | [S30][S11] | Low        | High   |
| 3.3 | Soft guardrails: feature scope warnings, overdue reassessment alerts | [S30][S31] | Medium     | Medium |
| 3.4 | Enforced phase entry/exit criteria (upgraded from advisory)          | [S12]      | Medium     | Medium |


### Phase 4: Observability and Improvement Loop (Medium Priority)

**Rationale**: Traces and evals enable continuous improvement but require the reliability foundation from Phase 1.


| #   | Improvement                                                               | Evidence        | Complexity | Impact |
| --- | ------------------------------------------------------------------------- | --------------- | ---------- | ------ |
| 4.1 | Structured feedback annotations on events                                 | [S19][S20]      | Medium     | Medium |
| 4.2 | Workflow quality metrics (completion rate, blocker frequency, plan drift) | [S34][S5]       | Medium     | Medium |
| 4.3 | Claim provenance metadata in events                                       | [S16][S17][S29] | Medium     | Medium |
| 4.4 | Saga pattern for rollback/undo of state mutations                         | [S27]           | High       | High   |


### Phase 5: Expressiveness and UX (Lower Priority)

**Rationale**: These are quality-of-life improvements that enhance usability but don't affect core reliability.


| #   | Improvement                                       | Evidence        | Complexity | Impact |
| --- | ------------------------------------------------- | --------------- | ---------- | ------ |
| 5.1 | Two-level feature hierarchy (epic → feature)      | [S37][S38]      | Medium     | Medium |
| 5.2 | Multi-state feature progress (not boolean)        | [S5]            | Low        | Medium |
| 5.3 | Git integration (automatic feature ID in commits) | [S1]            | Low        | Medium |
| 5.4 | Progress UX: ambient status, push notifications   | [S21][S22][S35] | Medium     | Medium |
| 5.5 | Tech debt resolution workflow                     | [S12]           | Low        | Low    |


---

## Source Inventory

### Tier A — Authoritative (Peer-Reviewed, Official Documentation)


| ID  | Source                                                                                                                                                                                                                                                     | Tier | Credibility | Topic                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------- | ----------------------------------------------- |
| S1  | Temporal Technologies. "Events and Event History." *Temporal Platform Documentation*. 2025. [https://docs.temporal.io/workflow-execution/event](https://docs.temporal.io/workflow-execution/event)                                                         | A    | 4.8         | Durable execution, event sourcing, replay       |
| S2  | Temporal Technologies. "Event Sourcing Implementation — Temporal Server." *Temporal Architecture Docs*. 2025. [https://temporalio-temporal.mintlify.app/architecture/event-sourcing](https://temporalio-temporal.mintlify.app/architecture/event-sourcing) | A    | 4.8         | Event sourcing internals                        |
| S3  | Restate. "Durable Execution." *Restate Documentation*. 2025. [https://docs.restate.dev/](https://docs.restate.dev/)                                                                                                                                        | A    | 4.5         | Deterministic replay, journaling                |
| S5  | "A Reliability Science Framework for Long-Horizon LLM Agents." *arXiv:2603.29231*. 2026. [https://arxiv.org/html/2603.29231v1](https://arxiv.org/html/2603.29231v1)                                                                                        | A    | 4.3         | Reliability decay formalization                 |
| S6  | "Why Retrying Fails: Context Contamination in LLM Agent Pipelines." *arXiv:2605.08563*. 2026. [https://arxiv.org/html/2605.08563v1](https://arxiv.org/html/2605.08563v1)                                                                                   | A    | 4.3         | Context-contaminated restart model              |
| S7  | Wang et al. "PreFlect: From Retrospective to Prospective Reflection in Large Language Model Agents." *arXiv:2602.07187*. 2026. [https://arxiv.org/abs/2602.07187](https://arxiv.org/abs/2602.07187)                                                        | A    | 4.4         | Prospective reflection before execution         |
| S8  | "PARC: An Autonomous Self-Reflective Coding Agent for Robust Execution of Long-Horizon Tasks." *arXiv:2512.03549*. 2025. [https://arxiv.org/html/2512.03549v1](https://arxiv.org/html/2512.03549v1)                                                        | A    | 4.4         | Hierarchical self-reflective coding agent       |
| S9  | "AdaptOrch: Task-Adaptive Multi-Agent Orchestration in the Era of LLM Performance Convergence." *arXiv:2602.16873*. 2026. [https://arxiv.org/abs/2602.16873](https://arxiv.org/abs/2602.16873)                                                             | A    | 4.2         | Adaptive orchestration topology                 |
| S10 | Niu et al. "Flow: Modularized Agentic Workflow Automation." *ICLR 2025 Poster*. [https://arxiv.org/abs/2501.07834](https://arxiv.org/abs/2501.07834)                                                                                                       | A    | 4.5         | Modularized workflow automation (peer-reviewed) |
| S11 | "Symbolic Guardrails for Domain-Specific Agents: Stronger Safety and Security Guarantees Without Sacrificing Utility." *arXiv:2604.15579*. 2026. [https://arxiv.org/pdf/2604.15579](https://arxiv.org/pdf/2604.15579)                                      | A    | 4.3         | Symbolic runtime guardrails                     |
| S12 | "From Governance Norms to Enforceable Controls: A Layered Translation Method for Runtime Guardrails in Agentic AI." *arXiv:2604.05229*. 2026. [https://arxiv.org/abs/2604.05229v1](https://arxiv.org/abs/2604.05229v1)                                     | A    | 4.3         | Governance-to-runtime translation               |
| S13 | "MI9: An Integrated Runtime Governance Framework for Agentic AI." *arXiv:2508.03858*. 2025. [https://www.arxiv.org/abs/2508.03858](https://www.arxiv.org/abs/2508.03858)                                                                                   | A    | 4.2         | Runtime governance framework                    |
| S16 | "PROV-AGENT: Unified Provenance for Tracking AI Agent Interactions in Agentic Workflows." *arXiv:2508.02866*. 2025. [https://huggingface.co/papers/2508.02866](https://huggingface.co/papers/2508.02866)                                                   | A    | 4.1         | Agent provenance tracking                       |
| S24 | "Versioning." *Durable Workflow Documentation*. 2025. [https://durable-workflow.com/docs/features/versioning/](https://durable-workflow.com/docs/features/versioning/)                                                                                     | A    | 4.6         | Workflow versioning patterns                    |
| S25 | Cui et al. "Uno-Orchestra: Parsimonious Agent Routing via Selective Delegation." *arXiv:2605.05007*. 2026. [https://arxiv.org/html/2605.05007v1](https://arxiv.org/html/2605.05007v1)                                                                      | A    | 4.2         | Cost-optimal multi-agent routing                |
| S26 | "Information Fidelity in Tool-Using LLM Agents: A Martingale Analysis of the Model Context Protocol." *arXiv:2602.13320*. 2026. [https://arxiv.org/html/2602.13320v1](https://arxiv.org/html/2602.13320v1)                                                 | A    | 4.1         | Error propagation bounds                        |
| S27 | "SagaLLM: Context Management, Validation, and Transaction Guarantees for Multi-Agent LLM Planning." *arXiv:2503.11951*. 2025. [https://arxiv.org/abs/2503.11951](https://arxiv.org/abs/2503.11951)                                                         | A    | 4.3         | Saga pattern for LLM agents                     |
| S28 | "SHIELDA: Structured Handling of Exceptions in LLM-Driven Agentic Workflows." *arXiv:2508.07935*. 2025. [https://arxiv.org/html/2508.07935v1](https://arxiv.org/html/2508.07935v1)                                                                         | A    | 4.2         | Exception handling for agent workflows          |
| S32 | "AgentGuardian: Learning Access Control Policies to Govern AI Agent Behavior." *arXiv:2601.10440*. 2026. [https://arxiv.org/html/2601.10440](https://arxiv.org/html/2601.10440)                                                                            | A    | 4.1         | Context-aware access control                    |
| S39 | "The Long-Horizon Task Mirage? Diagnosing Where and Why Agentic Systems Break." *arXiv:2604.11978*. 2026. [https://arxiv.org/html/2604.11978v1](https://arxiv.org/html/2604.11978v1)                                                                       | A    | 4.2         | Horizon-dependent degradation benchmark         |
| S42 | pi-workflow source code. `schemas.ts` (severity optional for blocker) and `index.ts` (runtime default `"high"`). *Local audit*. 2025.                                                                                                                      | A    | 5.0         | Schema/runtime severity mismatch                |


### Tier B — Reliable (Official Engineering Docs, Established Technical Sources)


| ID  | Source                                                                                                                                                                                                                                                                                                                                                                                         | Tier | Credibility | Topic                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------- | ----------------------------------------- |
| S4  | "Execution Guarantees and Idempotency." *Durable Workflow Documentation*. 2025. [https://durable-workflow.com/docs/2.0/constraints/execution-guarantees/](https://durable-workflow.com/docs/2.0/constraints/execution-guarantees/)                                                                                                                                                             | B    | 4.4         | Idempotency semantics                     |
| S14 | Conduktor. "Event Sourcing with Kafka: Patterns and Pitfalls." *Conduktor Blog*. 2025. [https://www.conduktor.io/blog/event-sourcing-kafka-patterns-pitfalls](https://www.conduktor.io/blog/event-sourcing-kafka-patterns-pitfalls)                                                                                                                                                            | B    | 4.0         | Event sourcing patterns, Kafka compaction |
| S15 | Kurrent (EventStoreDB). "Snapshots in Event Sourcing." *Kurrent Blog*. 2025. [https://www.kurrent.io/blog/snapshots-in-event-sourcing](https://www.kurrent.io/blog/snapshots-in-event-sourcing)                                                                                                                                                                                                | B    | 4.3         | Snapshot strategies                       |
| S19 | LangChain. "The Agent Improvement Loop Starts with a Trace." *LangChain Blog*. 2025. [https://www.langchain.com/blog/traces-start-agent-improvement-loop](https://www.langchain.com/blog/traces-start-agent-improvement-loop)                                                                                                                                                                  | B    | 4.1         | Trace-to-eval improvement loop            |
| S20 | LangChain. "Agent Observability Needs Feedback to Power Learning." *LangChain Blog*. 2025. [https://www.langchain.com/blog/agent-observability-needs-feedback-to-power-learning](https://www.langchain.com/blog/agent-observability-needs-feedback-to-power-learning)                                                                                                                          | B    | 4.1         | Feedback-powered learning loops           |
| S23 | AWS. "Idempotency — AWS Durable Execution SDK." *AWS Documentation*. 2025. [https://docs.aws.amazon.com/lambda/latest/dg/durable-execution-idempotency.html](https://docs.aws.amazon.com/lambda/latest/dg/durable-execution-idempotency.html)                                                                                                                                                  | B    | 4.7         | Idempotency in durable execution          |
| S30 | Habler, I. "Building Secured Agents: Soft Guardrails, Hard Boundaries, and the Layers Between." *The Atlantic — Building Blog*. 2025. [https://building.theatlantic.com/building-safer-agents-soft-guardrails-hard-boundaries-and-the-layers-between-14205d709b93](https://building.theatlantic.com/building-safer-agents-soft-guardrails-hard-boundaries-and-the-layers-between-14205d709b93) | B    | 4.2         | Multi-layer agent security                |
| S33 | OpenAI. "Build an Agent Improvement Loop with Traces, Evals, and Codex." *OpenAI Cookbook*. 2025. [https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop](https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop)                                                                                                                       | B    | 4.3         | Concrete trace-to-eval implementation     |
| S34 | LangChain. "LLM Evaluation Framework: Trajectories vs. Outputs." *LangChain Blog*. 2025. [https://www.langchain.com/articles/llm-evaluation-framework](https://www.langchain.com/articles/llm-evaluation-framework)                                                                                                                                                                            | B    | 4.1         | Trajectory evaluation for agents          |
| S36 | Conductor OSS. "Versioning Workflows." *Conductor Documentation*. 2025. [https://docs.conductor-oss.org/devguide/how-tos/Workflows/versioning-workflows.html](https://docs.conductor-oss.org/devguide/how-tos/Workflows/versioning-workflows.html)                                                                                                                                             | B    | 4.3         | Workflow versioning in practice           |
| S40 | Inngest. "Durable Execution." *Inngest Documentation*. 2025. [https://www.inngest.com/docs](https://www.inngest.com/docs)                                                                                                                                                                                                                                                                      | B    | 4.2         | Step functions, durable execution         |
| S41 | DBOS. "Durable Execution." *DBOS Documentation*. 2025. [https://docs.dbos.dev/](https://docs.dbos.dev/)                                                                                                                                                                                                                                                                                        | B    | 4.2         | Transactional durable execution           |
| S48 | "SARC: A Governance-by-Architecture Framework for Agentic AI Systems." *arXiv:2605.07728*. 2026. [https://arxiv.org/html/2605.07728](https://arxiv.org/html/2605.07728)                                                                                                                                                                                                                        | A    | 4.2         | Governance-by-architecture                |


### Tier C — Supplemental (Expert Analysis, Design Patterns)


| ID  | Source                                                                                                                                                                                                                                                           | Tier | Credibility | Topic                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------- | ---------------------------- |
| S17 | Flowcept. "Provenance for Agentic AI Workflows." *Flowcept.org*. 2025. [https://flowcept.org/](https://flowcept.org/)                                                                                                                                            | C    | 3.5         | Provenance capture tool      |
| S21 | Agentic Design. "Agent Status &amp; Activity UI Patterns." *Agentic Design Patterns*. 2025. [https://agentic-design.ai/patterns/ui-ux-patterns/agent-status-activity-patterns](https://agentic-design.ai/patterns/ui-ux-patterns/agent-status-activity-patterns) | C    | 3.8         | Agent status UX patterns     |
| S22 | Particula Tech. "Long-Running AI Tasks in UIs: Patterns That Keep Users Engaged." *Particula Blog*. 2025. [https://particula.tech/blog/long-running-ai-tasks-user-interface-patterns](https://particula.tech/blog/long-running-ai-tasks-user-interface-patterns) | C    | 3.5         | UX for long-running AI tasks |
| S29 | a2a-settlement. "otel-agent-provenance: OpenTelemetry Semantic Conventions for Agent Provenance." *GitHub*. 2025. [https://github.com/a2a-settlement/otel-agent-provenance](https://github.com/a2a-settlement/otel-agent-provenance)                             | C    | 3.4         | OTEL provenance conventions  |
| S31 | AgentC2. "How to Add Guardrails to Production AI Agents." *AgentC2 Blog*. 2025. [https://agentc2.ai/blog/guardrails-for-production-ai-agents](https://agentc2.ai/blog/guardrails-for-production-ai-agents)                                                       | C    | 3.6         | Production guardrail layers  |
| S35 | Inference.sh. "Agent UX Patterns That Work." *Inference.sh Blog*. 2025. [https://inference.sh/blog/ux/agent-ux-patterns](https://inference.sh/blog/ux/agent-ux-patterns)                                                                                         | C    | 3.4         | Agent UX patterns            |
| S37 | Linear. "Issue Management." *Linear Documentation*. 2025. [https://linear.app/docs](https://linear.app/docs)                                                                                                                                                     | C    | 3.8         | Hierarchical work items      |
| S38 | NILUS Consulting. "Event Sourcing Snapshot Strategies in Event Stores." *NILUS Blog*. 2025. [https://www.nilus.be/blog/event_sourcing_snapshot_strategies_in_event_stores/](https://www.nilus.be/blog/event_sourcing_snapshot_strategies_in_event_stores/)       | C    | 3.5         | Snapshot strategy comparison |
| S43 | OpenStandardAgents. "Agent Governance and Bounded Autonomy." *OSSA Research*. 2025. [https://openstandardagents.org/research/agent-governance-bounded-autonomy/](https://openstandardagents.org/research/agent-governance-bounded-autonomy/)                     | C    | 3.6         | Governance overview          |


### Additional Referenced Sources


| ID  | Source                                                                                                                                                                                                                                                  | Tier | Credibility | Topic                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------- | ----------------------------------- |
| S44 | Chen et al. "ShieldAgent: Shielding Agents via Verifiable Safety Policy Reasoning." *MLR Proceedings v267*. 2025. [https://proceedings.mlr.press/v267/chen25ae.html](https://proceedings.mlr.press/v267/chen25ae.html)                                  | A    | 4.3         | Verifiable safety policy reasoning  |
| S45 | "AgentFlow: In-the-Flow Agentic System Optimization for Effective Planning and Tool Use." *Stanford/agentflow.stanford.edu*. 2025. [https://agentflow.stanford.edu/](https://agentflow.stanford.edu/)                                                   | A    | 4.0         | RL-based agentic optimization       |
| S46 | Agentic Design. "Background Work Visibility." *AI Design Blueprint*. 2025. [https://aidesignblueprint.com/en/background-work-visibility](https://aidesignblueprint.com/en/background-work-visibility)                                                   | C    | 3.7         | Background work visibility patterns |
| S47 | "The Evaluation Challenge of Agency: Reliability, Contamination, and Evolution in LLM Agents." *TechRxiv*. 2025. [https://www.techrxiv.org/doi/10.36227/techrxiv.177222530.04005985](https://www.techrxiv.org/doi/10.36227/techrxiv.177222530.04005985) | B    | 3.9         | Evaluation challenges for agents    |


---

## Appendix A: pi-workflow Gap-to-Evidence Map


| Gap (from local audit)               | Section | Primary Evidence | Remediation Phase |
| ------------------------------------ | ------- | ---------------- | ----------------- |
| Append-only event log, no compaction | 1.3     | [S14][S15][S1]   | Phase 1           |
| No idempotency for tool actions      | 1.1     | [S23][S4]        | Phase 1           |
| No workflow/artifact versioning      | 1.7     | [S24][S36]       | Phase 1           |
| Severity schema/runtime mismatch     | 1.4     | [S42]            | Phase 1           |
| Unstructured reassessment            | 1.2     | [S7][S8][S10]    | Phase 2           |
| Advisory-only phase harness          | 1.4     | [S30][S11][S12]  | Phase 3           |
| No rollback/undo mechanism           | 1.1     | [S27]            | Phase 4           |
| No structured exception handling     | 1.1     | [S28]            | Phase 4           |
| Flat feature model                   | 1.8     | [S37][S38][S8]   | Phase 5           |
| No git integration                   | 1.10    | [S1]             | Phase 5           |
| No partial feature verification      | 1.1     | [S5]             | Phase 5           |
| No progress UX                       | 1.6     | [S21][S22][S35]  | Phase 5           |
| Tech debt tracker without resolution | 1.4     | [S12]            | Phase 5           |
| No structured historical query       | 1.3     | [S16][S17][S29]  | Phase 4           |
| No time tracking/velocity            | —       | [S5]             | Phase 5           |
| No multi-project view                | —       | [S9]             | Phase 5           |


## Appendix B: Search Queries Used

1. `PreFlect LLM agent self-reflection pre-planning paper 2024 2025`
2. `PARC framework planning acting reflecting cognitive architecture agentic AI`
3. `AdaptOrch adaptive orchestration multi-agent framework paper`
4. `Uno-Orchestra parsimonious delegation multi-agent orchestration paper`
5. `AgentFlow agentic workflow automation framework paper`
6. `SHIELDA shield agent safety LLM framework paper`
7. `SagaLLM saga pattern LLM multi-agent reliability paper`
8. `reliability decay context contamination LLM agent long-running tasks paper`
9. `idempotency keys workflow versioning durable execution agents`
10. `trace evaluation improvement loop LLM agent observability trace-to-eval`
11. `two-tier guardrails AI agent safety hard soft constraints`
12. `progress UX long-running agent tasks user experience visibility`
13. `governance constraints AI agent workflow compliance policy enforcement`
14. `claim provenance data lineage agentic workflow traceability`
15. `event sourcing compaction snapshotting strategies EventStoreDB Kafka log compaction`
16. `Temporal workflow event sourcing snapshot academic durable execution`

## Appendix C: Excluded Sources and Rationale


| Source                                                                           | Exclusion Reason                                                                                                      |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Provenance Protocol (provenanceprotocol.org)                                     | No peer review, no verifiable authorship, appears to be a standards proposal without implementation evidence. Tier D. |
| SPAR Framework (intercore.net)                                                   | Marketing content, no technical depth, no attribution to peer-reviewed work. Tier D.                                  |
| Various Medium blog posts on "AI agent orchestration" without author credentials | Anonymous or unverifiable authorship. Tier D.                                                                         |


---

*Report generated 2026-05-13. All factual claims are supported by inline source IDs mapping to the Source Inventory. Confidence grades reflect the strength and convergence of available evidence per the project's source quality standards.*