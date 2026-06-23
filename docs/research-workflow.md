# Research Workflow

The complete pipeline from topic to report. See [ARCHITECTURE.md](../ARCHITECTURE.md) for system-level context.

> **Orchestration**: This pipeline is executed by the OMP `deep-researcher` skill inside the main OMP session. For `deep` research, Stages 2–3 (Search + Evaluate) are parallelised by spawning one project `researcher` task agent per sub-question with OMP's `task` tool. Each worker uses `web_search`, reads full source text with `read <url>`, runs at least one refinement round, and returns structured findings through normal task output / `agent://` artifacts. `quick` runs inline without worker fan-out.

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
| Deep (default) | 6-8 | 4 | **required** (top 4+/sub-Q via `read`) | **≥1 required** | **30** | 30-50 |

`quick` is a fast snippet-level lookup that runs inline. `deep` is the full pipeline: parallel task agents, mandatory full-text reads, and at least one refinement round seeded by first-round findings. The read-and-iterate requirement — not the raw search count — is what makes `deep` research rather than a search skim.

### Output

```markdown
## Research Plan: <topic>

**Depth**: deep
**Scope**: <one-line scope statement>

### Sub-questions
1. [SQ1] <question> - expected sources: <types>
2. [SQ2] <question> - expected sources: <types>
...

### Dispatch Map
| Worker | Sub-question | Searches | Full reads |
|--------|--------------|----------|------------|
| ResearcherSQ1 | SQ1 | 3-4 | top 4+ URLs |
| ResearcherSQ2 | SQ2 | 3-4 | top 4+ URLs |
```

## Stage 2: Search

**Goal**: Gather raw source material for each sub-question.

### Parallel Execution with Researcher Task Agents (default for `deep`)

**Deep research must use parallel execution.** The planner spawns one OMP `researcher` task agent per sub-question in a single `task` batch. Each worker executes the full Search → Evaluate cycle (Stages 2–3) for its assigned sub-question — including mandatory full-source `read` calls and the refinement round. The planner collects task outputs and proceeds to Stage 4 (Synthesize).

Use this shape conceptually when dispatching:

```text
task:
  agent: researcher
  context: |
    Goal: research <topic> at depth=deep.
    Constraints: read-only; cite every factual claim; use web_search; read top URLs with read; run one refinement round; no project-wide commands.
    Contract: return the Research Findings markdown block from this workflow.
  tasks:
    - id: ResearcherSQ1
      role: Research sub-question specialist
      assignment: Search + Evaluate SQ1: <sub-question> ...
    - id: ResearcherSQ2
      role: Research sub-question specialist
      assignment: Search + Evaluate SQ2: <sub-question> ...
```

Each assignment must be self-contained: include the exact sub-question, source-type expectations, search count, required full-text URL reads, refinement requirement, and the output format.

The auto-created task outputs are the join point. Use `agent://<id>` to recover full output if an inline result is truncated, and `history://<id>` only when the transcript is needed for debugging or audit.

> **Exception**: Single-threaded sequential search is only for `quick` depth, executed directly in the planner.

### Steps (per sub-question, inside each `researcher` worker)

1. **Craft queries** - For each sub-question, generate 2-4 search queries with varied phrasing and scope
2. **Execute searches** - Use `web_search` when configured. If no search provider is available, use user-provided sources, local files, and training knowledge - but never fabricate citations; mark claims without verifiable sources.
3. **Read content** - For `deep`, **required**: extract readable text by calling `read` on the top 4+ URLs per sub-question and work from full text. For `quick`, search snippets are acceptable. If a URL cannot be read, note the limitation and prefer another source.
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

### Quality Scoring

For each source, assign:

- **Tier**: A / B / C / D (see [source-quality.md](source-quality.md))
- **Credibility score**: 0.0 - 5.0
- **Recency**: current / recent / dated / historical
- **Relevance**: direct / supporting / tangential

### Steps

1. **Classify source type** - Academic, official, news, blog, forum, etc.
2. **Score credibility** - Apply weighted criteria:
   - Author authority (30%)
   - Publication reputation (25%)
   - Recency (20%)
   - Corroboration (15%)
   - Methodology transparency (10%)
3. **Deduplicate** - Merge duplicate reports of the same fact
4. **Map conflicts** - Record contradictory claims and relative source strength
5. **Identify gaps** - Note missing perspectives, weak evidence, or unresolved questions

### Output

```markdown
### Evaluated Sources: [Sub-question]

| ID | Source | Tier | Score | Key Finding | Notes |
|----|--------|------|-------|-------------|-------|
| S1 | [Title](url) | A | 4.5 | ... | official data |
| S2 | [Title](url) | B | 3.8 | ... | corroborates S1 |

**Conflicts**: ...
**Gaps**: ...
```

## Stage 4: Synthesize and Write

**Goal**: Produce the final report.

### Steps

1. **Merge worker findings** - Combine all sub-question outputs, deduplicate cross-sub-question overlaps
2. **Synthesize themes** - Identify patterns, causal links, and disagreements
3. **Answer the core question** - Directly address the user's topic
4. **Assign confidence** - Every major conclusion gets high/medium/low confidence with evidence
5. **Document gaps** - Explicitly state what could not be established
6. **Save report** - Write to `researches/YYYY-MM-DD-<topic-slug>.md`

### Report Structure

Use [output-format.md](output-format.md). Required sections:

1. Executive Summary
2. Key Findings
3. Detailed Analysis (organized by sub-question or theme)
4. Source Assessment
5. Knowledge Gaps
6. Sources

## Failure Handling

| Failure | Response |
|---------|----------|
| Search provider unavailable | Use provided/local sources where possible; disclose limitation; do not fabricate citations |
| URL cannot be read | Note failed read; prefer alternative sources; do not cite unread content as if verified |
| Worker output incomplete | Use `agent://<id>` / `history://<id>` for audit; if still incomplete, lower confidence and disclose gap |
| Conflicting sources | Present both claims, weight by tier/score, explain confidence |
| Minimum source count not met | Disclose in Knowledge Gaps; lower and justify confidence on affected conclusions; document which sub-questions lacked sufficient sources |
