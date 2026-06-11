# Research Workflow

The complete pipeline from topic to report. See [ARCHITECTURE.md](../ARCHITECTURE.md) for system-level context.

> **Orchestration**: This pipeline is executed by the pi-coding-agent skill inside a planner pi. For `deep` research, Stages 2-3 (Search + Evaluate) are parallelised by dispatching one **Orca worker terminal** per sub-question. Each worker runs `ORCA_ROLE=worker pi` with its system prompt set to `.pi/agents/researcher.md` (loaded via `--system-prompt`), and each worker must `fetch_content` the top results and run at least one refinement round. The planner creates tasks via `orca orchestration task-create`, spawns worker terminals, injects dispatch preambles, and waits for `worker_done` payloads. For durable intent tracking, a **Linear issue** is created per `deep` run (skipped for `quick`).

## Stage 1: Plan

**Goal**: Decompose the topic into researchable sub-questions.

### Steps

1. **Analyze the topic** - Identify the core question, scope, and key dimensions
2. **Generate sub-questions** - 3-8 focused questions that together cover the topic
3. **Prioritize** - Order by importance and dependency (foundational questions first)
4. **Assign source types** - Per sub-question, note which source types are most relevant:
   - Academic (papers, proceedings)
   - Technical (documentation, specs, RFCs)
   - News (recent reporting, press releases)
   - Primary (official sources, raw data)
   - Opinion (blogs, commentary, analysis)

### Depth Settings

| Depth | Sub-questions | Searches per sub-Q | Read full content | Refinement round | Minimum sources | Target sources |
|-------|--------------|-------------------|-------------------|------------------|-----------------|----------------|
| Quick | 3 | 2 | optional (snippets ok) | no | **5** | 5-10 |
| Deep (default) | 6-8 | 4 | **required** (top 4+/sub-Q) | **≥1 required** | **30** | 30-50 |

`quick` is a fast snippet-level lookup that runs inline. `deep` is the full pipeline: parallel workers, mandatory full-text reads, and at least one refinement round seeded by first-round findings. The read-and-iterate requirement — not the raw search count — is what makes `deep` research rather than a search skim.

### Output

```markdown
## Research Plan: <topic>

**Depth**: deep
**Scope**: <one-line scope statement>

### Sub-questions
1. [SQ1] <question> - expected sources: <types>
2. [SQ2] <question> - expected sources: <types>
...
```

## Stage 2: Search

**Goal**: Gather raw source material for each sub-question.

### Parallel Execution with Researcher Subagents (default)

**Deep research must use parallel execution.** The planner dispatches one Orca worker per sub-question. Each worker runs `pi` with the isolation envelope (see snippet below); the worker's system prompt **is** `.pi/agents/researcher.md`, loaded via `--system-prompt`. Each worker executes the full Search → Evaluate cycle (Stages 2–3) for its assigned sub-question — including the mandatory `fetch_content` reads and refinement round. The planner collects all `worker_done` payloads and proceeds to Stage 4 (Synthesize).

```bash
# Orca dispatch pattern - one worker per sub-question

# 1. Create a task for each sub-question
TASK_SQ1=$(orca orchestration task-create --spec "Search + Evaluate SQ1: <sub-question>. The worker's system prompt is .pi/agents/researcher.md (loaded via --system-prompt). Use bash only for orchestration/Linear CLIs, not for file mutation." --json | jq -r '.result.task.id')
TASK_SQ2=$(orca orchestration task-create --spec "Search + Evaluate SQ2: <sub-question>. The worker's system prompt is .pi/agents/researcher.md (loaded via --system-prompt). Use bash only for orchestration/Linear CLIs, not for file mutation." --json | jq -r '.result.task.id')
# ... repeat for SQ3...SQN

# 2. Spawn worker terminals (one per task) with the isolation envelope.
#    Matches the standard Orca worker dispatch pattern in orca-linear-workflow:
#    interactive pi → wait for tui-idle → dispatch --inject → wait for worker_done.
#    What's different here: the isolation envelope flags after `pi` make this worker
#    a sealed Researcher process instead of a full coding agent.
#    --model and --thinking keep in sync with .pi/agents/researcher.md frontmatter.
TERM_SQ1=$(orca terminal create --worktree active --title "researcher-sq1" \
  --command "ORCA_ROLE=worker pi --system-prompt /Users/bertugmirasyedi/projects/deep-researcher/.pi/agents/researcher.md --append-system-prompt /dev/null --no-context-files --no-skills --no-prompt-templates --no-extensions --extension /opt/homebrew/lib/node_modules/pi-web-access/index.ts --tools read,grep,find,ls,web_search,fetch_content,bash --model zai/glm-5.1 --thinking high" \
  --json | jq -r '.result.terminal.handle')
TERM_SQ2=$(orca terminal create --worktree active --title "researcher-sq2" \
  --command "ORCA_ROLE=worker pi --system-prompt /Users/bertugmirasyedi/projects/deep-researcher/.pi/agents/researcher.md --append-system-prompt /dev/null --no-context-files --no-skills --no-prompt-templates --no-extensions --extension /opt/homebrew/lib/node_modules/pi-web-access/index.ts --tools read,grep,find,ls,web_search,fetch_content,bash --model zai/glm-5.1 --thinking high" \
  --json | jq -r '.result.terminal.handle')
# ... repeat for SQ3...SQN

# 3. Wait for each terminal to become idle (agent ready)
orca terminal wait --terminal "$TERM_SQ1" --for tui-idle --timeout-ms 60000 --json
orca terminal wait --terminal "$TERM_SQ2" --for tui-idle --timeout-ms 60000 --json
# ... repeat for remaining terminals

# 4. Dispatch tasks - inject preamble telling the worker to run
#    Search + Evaluate for its SQ and report worker_done with
#    structured findings JSON.
orca orchestration dispatch --task "$TASK_SQ1" --to "$TERM_SQ1" --inject --json
orca orchestration dispatch --task "$TASK_SQ2" --to "$TERM_SQ2" --inject --json
# ... repeat for remaining task/terminal pairs

# 5. Collect results - block until all workers report
orca orchestration check --wait \
  --types worker_done,escalation \
  --timeout-ms 600000 --json

# 6. Close terminals after collection
orca terminal close --terminal "$TERM_SQ1" --json
orca terminal close --terminal "$TERM_SQ2" --json
# ... repeat for remaining terminals
```

The auto-injected dispatch preamble tells each worker to run Search + Evaluate for its assigned sub-question and send `worker_done` with the structured findings JSON. The worker's system prompt is already `.pi/agents/researcher.md` (loaded via `--system-prompt` at terminal creation), so the injected preamble only needs to carry the sub-question and any run-specific instructions.

> **Exception**: Single-threaded (sequential) search is only for `quick` depth, executed directly in the planner pi.

### Steps (per sub-question, inside each `researcher` worker)

1. **Craft queries** - For each sub-question, generate 2-4 search queries with varied phrasing and scope
2. **Execute searches** - If a search tool (`web_search`, etc.) is available, run queries via batched execution. If no search tool is installed, use user-provided sources, local files, and training knowledge - but never fabricate citations; mark claims without verifiable sources.
3. **Fetch content** - For `deep`, **required**: extract readable markdown via `fetch_content` from the top 4+ URLs per sub-question and work from full text. For `quick`, search snippets are acceptable. If no content tool is available, work with snippets and user-provided materials and note the limitation.
4. **Refine** - For `deep`, **required**: run at least one follow-up query round seeded by first-round findings (named entities, contradictions, cited works) before handing off. `quick` does a single pass.
5. **Collect metadata** - For each source: author, date, domain, publication type, URL

### Query Variation Strategy

Avoid redundant queries. Vary along these dimensions:

- **Scope**: Broad context → specific detail
- **Angle**: Technical → business → social impact
- **Recency**: Historical → recent developments
- **Perspective**: Proponent → critic → neutral analyst

### Output

Collection of source objects, each containing:

- `sub_question`: Which sub-question this source addresses
- `query`: The search query that found it
- `url`: Source URL
- `title`: Page title
- `snippet`: Relevant extracted content (500-2000 words)
- `metadata`: Author, date, domain, publication type

## Stage 3: Evaluate

**Goal**: Score and tier sources, identify conflicts and gaps.

### Steps

1. **Apply quality tiers** - Per [source-quality.md](source-quality.md), classify each source
2. **Score credibility** - Rate each source on author authority, publication reputation, recency
3. **Deduplicate** - Merge sources covering the same finding; keep highest-quality instance
4. **Map conflicts** - Identify where sources disagree
5. **Identify gaps** - Note sub-questions with insufficient source coverage

### Scoring

| Dimension | Weight | Scale |
|-----------|--------|-------|
| Author authority | 30% | 1-5 |
| Publication reputation | 25% | 1-5 |
| Recency relevance | 20% | 1-5 |
| Corroboration | 15% | 1-5 |
| Methodology transparency | 10% | 1-5 |

Minimum credibility threshold: **3.0 weighted average**. Sources below threshold are flagged but not discarded - they may appear in the report as counterpoints.

### Output

Scored source list with:
- Quality tier (A/B/C/D)
- Credibility score (1.0-5.0)
- Conflict flags (links to conflicting sources)
- Coverage assessment per sub-question

## Stage 4: Synthesize & Report

**Goal**: Produce a structured report that synthesizes findings across sources.

### Steps

1. **Synthesize per sub-question** - For each sub-question, combine findings from all scored sources
2. **Identify themes** - Extract cross-cutting themes that span multiple sub-questions
3. **Assess confidence** - Assign confidence grades based on source quality and agreement
4. **Note gaps** - Explicitly state what the research could not determine
5. **Format output** - Apply the requested format per [output-format.md](output-format.md)
6. **Save report** - Write the final Markdown report to `researches/YYYY-MM-DD-<topic-slug>.md` (see [researches/README.md](../researches/README.md) for naming convention)
7. **Present summary** - Summarize key findings to the user; report is archived for future reference

### Synthesis Rules

- **Agreements**: When multiple high-quality sources agree, state as established fact with confidence
- **Conflicts**: When credible sources disagree, present both sides with reasoning for each
- **Gaps**: When no source adequately addresses a sub-question, state the gap explicitly
- **Single-source claims**: Mark as such; reduce confidence grade

## Error Handling

| Situation | Response |
|-----------|----------|
| Search returns no results | Reformulate query; try broader phrasing; note in report |
| All sources are low quality | Report with explicit caveat; recommend manual verification |
| Sources heavily conflict | Present disagreement neutrally; assess which side has stronger evidence |
| Sub-question unanswerable | State in report; suggest alternative angles |
| Minimum source count not met | Disclose in Knowledge Gaps section; lower and justify confidence on affected conclusions; document which sub-questions lacked sufficient sources |
