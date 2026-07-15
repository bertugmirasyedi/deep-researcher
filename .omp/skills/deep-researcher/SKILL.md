---
name: deep-researcher
description: Produce a structured, citation-backed research report on a topic. Use when the user explicitly asks to research a topic, produce a research report, or do a deep dive on a subject. Triggers include "research", "deep dive", "research report", "investigate", or "report on".
---

# Deep Researcher

Prompt-orchestrated OMP TUI workflow for structured, citation-backed research. It
directs the current interactive agent to coordinate stages and spawn subagents in
the same shape as the separate Mastra + OMP ACP workflow.

## Quick Start

```text
/skill:deep-researcher <topic>
/skill:deep-researcher <topic> --depth quick|deep
/skill:deep-researcher <topic> --format brief|full|academic
```

Parse arguments as:

- First positional argument: research topic (required)
- `--depth`: `deep` by default; otherwise `quick`
- `--format`: `full` by default; otherwise `brief` or `academic`

If the topic is missing, ask only for the topic. Resolve all other omissions with
the defaults above.

## Interactive-Only Execution Contract

This skill is exclusively the OMP TUI path. Loading it prompts the current agent
to act as the workflow coordinator and use OMP tools and subagents directly.

Never invoke, recommend, or fall back to the CLI-backed Mastra runner from this
skill. The `mastra-omp-acp` CLI workflow is a separate execution path with its own
control plane; it remains unchanged and outside this skill's contract.

An interactive run must label itself `Workflow: omp-tui-native`; it must never
claim that Mastra executed. It mimics Mastra through the same stage order, typed
handoffs, bounded fan-out, parallel review gates, bounded repair loop, final
audit, and archive contract.

## Mastra-to-OMP Mapping

| Mastra behavior | OMP TUI implementation |
|---|---|
| `.then(step)` | Main agent dispatches one named stage agent, validates its JSON, then advances |
| typed `inputSchema` / `outputSchema` | Explicit JSON field contracts in prompts plus coordinator validation |
| workflow state | Coordinator-approved JSON handoffs persisted in transient `local://` state |
| `.foreach(..., { concurrency: 4 })` | `task` batches in waves of at most four researchers |
| `.parallel([...])` | One `task` batch containing all three independent reviewers |
| `.dountil()` | Main-agent controller with at most one adaptive repair iteration |
| final audit step | Exact citation rules, source threshold calculation, then `write` |

The main agent owns orchestration and state. Named stage agents perform only their
assigned stage; they do not decide stage order, source thresholds, whether another
loop is allowed, or when the report is complete.

## Stage Agent Roster

Dispatch these exact project agents:

| Workflow stage | Agent |
|---|---|
| Discovery scan | `discovery-researcher` |
| Evidence-grounded plan | `research-planner` |
| Parallel subquestion research | `researcher` |
| Draft synthesis | `research-writer` |
| Coverage gate | `coverage-reviewer` |
| Bias gate | `bias-reviewer` |
| Citation gate | `citation-reviewer` |
| Adaptive decision | `review-controller` |
| Replan action | `research-replanner` |
| Targeted repair action | `repair-researcher` |
| Final report writing | `final-writer` |

The coordinator must not substitute the generic `task` agent for a stage with a
named agent. Every dispatch supplies the accepted upstream `local://` state URIs,
the exact stage objective, explicit non-goals, and its output field contract.

Every `task` batch context uses `# Goal`, `# Constraints`, and `# Contract`.
Every task item uses `# Target`, `# Change`, and `# Acceptance`, including
singleton stages. Stage agents start without the parent conversation, so prompts
must name every required URI and acceptance condition explicitly.

## Structured Handoff Contracts

Do not use custom output tools. The coordinator asks every subagent for one JSON
object with explicitly named fields, validates the returned object, and only then
admits it into workflow state.

Use these stage shapes:

- `DiscoveryMap`: `topic`, `neutralQueries`, `searchResults`, `sourceReads`,
  `entities`, `dimensions`, `gaps`
- `ResearchPlan`: `topic`, `depth`, `scope`, `subQuestions`, `sourceMinimum`,
  `targetSources`
- `SubquestionFinding`: `subQuestionId`, `sources`, `synthesis`, `confidence`,
  `conflicts`, `gaps`, `refinementQueries`, `sourceCount`
- `DraftReport`: `title`, `markdown`, `sources`, `claimMap`
- `ReviewResult`: `reviewer`, `passed`, `findings`, `requiredActions`,
  `targetedQueries`
- `ReviewControllerDecision`: `action`, `round`, `reason`, `failedReviewers`,
  `requiredActions`, `repairQueries`, `newSubQuestions`, `replanInstructions`
- `FinalReportDraft`: `topic`, `depth`, `format`, `markdown`
- Final state: `topic`, `depth`, `format`, `markdown`, `outputPath`,
  `sourcesConsulted`, `sourceMinimumMet`, `reviewStatus`, `reviewResults`

Every delegated task must end with: `Return one JSON object only, with exactly
these fields: ...` followed by the relevant field list. The coordinator checks
required fields, value types, allowed enum values, URL validity, ID references,
and internal counts. If output is malformed, ask the same subagent through `irc`
to correct only the shape; do not spawn a replacement or invent missing data.

Preserve each accepted handoff as JSON beneath a run-specific
`local://deep-research/<slug>/` path and give downstream subagents those URIs.
Do not create transient state files in the repository.

## Workflow

### 0. Normalize Input and Initialize State

1. Record topic, depth, format, current ISO date, and `maxReviewRepairRounds: 1`.
2. Use the OMP `todo` tool to track every stage below. The todo list is workflow
   state, not a substitute for validating structured handoffs.
3. Use these depth controls:
   - `quick`: exactly 3 subquestions and at least 5 unique sources overall.
   - `deep`: 6–8 subquestions and at least 30 unique sources overall.

### 1. Discovery Scan

Discovery always precedes planning.

1. Create 2–4 neutral landscape queries from the topic and current year. Do not
   inject named entities unless they appeared in the user's topic.
2. Spawn one `discovery-researcher` with the topic, depth, date, and exact neutral
   queries. It owns all discovery `web_search` and `read` work.
3. Require one `DiscoveryMap` JSON object containing exact queries, search
   results, source reads, evidence-grounded entities and dimensions, and gaps.
4. Verify that every entity and dimension cites observed discovery source IDs and
   that no unobserved named entity was introduced.
5. Validate and persist the accepted `DiscoveryMap`.

### 2. Evidence-Grounded Plan

Spawn one `research-planner` with the validated `DiscoveryMap` URI and normalized
input. It must not browse.

1. Require `SQ1...SQn` in stable order.
2. Verify that every named entity exists in `DiscoveryMap.entities`.
3. Verify entity IDs, exact dimension names, 2–5 initial queries, expected source
   types, source minimum, and target range.
4. Validate and persist the accepted `ResearchPlan`.
5. Before research dispatch, show the user a concise discovery summary and the
   complete evidence-grounded subquestion list.

### 3. Parallel Research Foreach

Use the project `researcher` task agent. Dispatch subquestions in stable `SQ`
order, in waves containing at most four tasks. A wave must complete before the
next wave starts; this preserves Mastra's concurrency cap even when the OMP
session allows more workers.

Each `task` batch must include shared context with these headings:

```text
# Goal
Answer the assigned grounded subquestions for the research report.
# Constraints
Read-only research; no file edits; no tests or formatters; cite every factual
claim; use only DiscoveryMap-grounded entities unless a new entity is surfaced
by live evidence and cited; perform the required refinement round.
# Contract
Read the supplied local:// DiscoveryMap and ResearchPlan. Return one
SubquestionFinding-shaped JSON object for the assigned SQ.
```

Each task must use these headings:

```text
# Target
Exact SQ id, question, state URIs, and explicit non-goals.
# Change
Run the initial queries, read full sources, score each source, run one
evidence-seeded refinement query round, then synthesize.
# Acceptance
Return sources, synthesis, confidence, conflicts, gaps, refinementQueries, and
sourceCount; every source URL was actually read or is marked unread/failed.
```

Additional requirements:

- For `deep`, each researcher should fully read at least four credible sources
  when available. For `quick`, at least two.
- Source-quality tiers and scores must follow `references/source-quality.md`.
- Do not let one failed worker cancel unrelated results. Preserve explicit gaps.
- Wait for every wave, then read the full result from `agent://<id>` when the
  delivered preview is truncated.
- The main agent validates and normalizes each `SubquestionFinding`. A malformed
  result is corrected from the worker's cited evidence; it is not silently
  accepted.

After all waves, deduplicate sources by canonical URL, assign stable global IDs
`S1...Sn` in first-appearance order, and retain the per-subquestion provenance.

### 4. Draft Synthesis

Spawn one `research-writer` with the DiscoveryMap, ResearchPlan, validated
findings, and global source ledger URIs. It must not browse.

1. Require cross-source synthesis rather than concatenated worker summaries.
2. Require a claim map in which every factual claim has one or more existing
   global source IDs.
3. Require conflicts, knowledge gaps, and confidence reasoning.
4. Validate and persist the accepted `DraftReport`.

### 5. Parallel Review Gates

Launch exactly three tasks in one `task` batch:

- `coverage-reviewer`
- `bias-reviewer`
- `citation-reviewer`

Give every reviewer the DiscoveryMap, ResearchPlan, findings, global source
ledger, and draft URIs. They must not browse or modify files. Each returns one
`ReviewResult` JSON object:

- Coverage checks high-signal entity/dimension coverage, unanswered
  subquestions, source depth, and Tier A/B representation.
- Bias checks incumbent/vendor/model-prior overrepresentation against neutral
  discovery evidence.
- Citation checks claim-map coverage, absent source IDs, unread/failed sources,
  and unsupported factual claims.

Validate the three results separately. Reviewer failure is controller input; it is
not permission to stop the workflow.

### 6. Review Controller

Spawn one `review-controller` with all current state URIs, review round, and
remaining repair allowance. Require one validated `ReviewControllerDecision`.

The agent must choose exactly one action:

- `finalize` when all gates pass or no repair rounds remain.
- `targeted_repair` when existing scope is sound but focused evidence is needed.
- `additional_research` when 1–3 new DiscoveryMap-grounded subquestions can close
  evidence gaps.
- `replan` when the plan omitted or distorted a discovered entity or dimension.

Verify that the decision preserves failed reviewers, required actions, and
targeted queries. New subquestions may name only DiscoveryMap entities. Never
reuse an existing `SQ` ID for changed question content.

### 7. Bounded Adaptive Cycle

Run at most one repair iteration:

1. For `targeted_repair`, spawn `repair-researcher`.
2. For `additional_research`, dispatch the new questions to `researcher` in the
   normal waves-of-four flow.
3. For `replan`, spawn `research-replanner`, then dispatch only new or materially
   changed questions to `researcher`.
4. Validate and persist every new structured handoff.
5. Rebuild the global source ledger and spawn `research-writer` for a new draft.
6. Rerun the three named reviewers in one parallel batch and validate all results.

After this iteration, do not start another repair loop. Remaining failures become
disclosed gaps unless the deterministic citation audit fails, in which case final
status is `failed`.

### 8. Final Writer, Deterministic Audit, and Archive

Spawn one `final-writer` with every accepted state URI and the requested report
format. Require a `FinalReportDraft` with these headers:

```text
Workflow: omp-tui-native
Discovery-first plan: yes
Review status: <status>
```

Validate the draft structure before the coordinator performs the final audit.

1. Count unique global sources. Thresholds are `quick >= 5` and `deep >= 30`.
2. Apply the repository's deterministic citation rules from
   `src/research-runner/citation-audit.ts`: every source ID referenced in the
   report must exist in **Source Inventory**, and every prose paragraph under
   **Findings**, **Areas of Agreement**, and **Areas of Disagreement** must contain
   an `[S#]` citation.
3. Set status:
   - `failed` if deterministic citation failures remain.
   - `passed` if all three latest reviews pass and the source minimum is met.
   - `passed_with_disclosed_gaps` otherwise.
4. Include neutral discovery queries, entities/dimensions, review outcomes,
   repair actions, source threshold, and audit result in **Methodology**.
5. Write the report to
   `researches/YYYY-MM-DD-<topic-slug>.md` using `write`.
6. Validate and persist the final state with the actual archive path, source
   count, threshold result, review status, and latest review results.

Only after the archive write and final-state validation may the main agent
summarize the result to the user.

## Failure and Resume Rules

- A missing or failed source read remains explicit; never fabricate a replacement.
- Empty or suspiciously narrow searches require a different neutral or refinement
  query before declaring a gap.
- A failed subagent may be retried once for the same assignment. Do not restart
  successful siblings.
- If the TUI session is interrupted, reconstruct the latest valid stage from
  `local://` state, then resume at the first incomplete stage.
- Do not present a partial draft as a completed report.

## Critical Rules

1. Discovery first; planning from model priors is non-compliant.
2. Every factual claim traces to a verifiable source.
3. Every included source has a quality tier, score, read status, and relevance.
4. Synthesize across sources; expose agreements, conflicts, and gaps.
5. Grade every conclusion `high`, `medium`, or `low` with reasoning.
6. Keep the main TUI agent in control of stage order and loop bounds.
7. Never claim `mastra-omp-acp` for a TUI-native run.
8. Archive under `researches/` before reporting completion.

Output format details: see [output-format.md](references/output-format.md).
Source quality details: see [source-quality.md](references/source-quality.md).
