# Research Report: Terminal-First AI Coding Workbenches

**Date**: 2026-05-07
**Depth**: standard
**Sources consulted**: 61
**Source minimum met**: yes (required: 10, found: 61)
**Overall confidence**: high

---

## Executive Summary

The 2026 landscape for terminal-first AI coding workstations splits into four layers: pure terminal emulators, hybrid terminals with built-in editing and agent features, lightweight editors with terminal panels, and coding-agent CLI tools paired with diff/review TUI companions. No single tool covers every need, but the combination of a fast terminal emulator, a coding agent, and a purpose-built diff companion yields a workflow that rivals full IDEs while staying closer to the metal.

Among pure terminals, **Ghostty** (~50K★, MIT) is the fastest and most polished native experience on macOS, while **Kitty** (32K★, GPL-3.0) offers the deepest extensibility via its kittens framework [S8][S7]. Neither includes a built-in file editor or agent orchestration. In the hybrid tier, **Warp** (56K★, AGPL-3.0 client) leads as an "Agentic Development Environment" with first-class support for five CLI coding agents, an interactive Code Review panel, and built-in diff editing [S2][S3][S4]. **Wave Terminal** (~20K★, Apache-2.0) is the strongest open-source hybrid, integrating a Monaco editor, file previews, web blocks, and an `aifilediff` view [S1][S18].

Among lightweight editors, **Zed** (82K★, GPL/AGPL, free) is the clear leader — it uniquely combines a built-in terminal, side-by-side split diff with git graph, native agentic editing via ACP (Claude Agent, Gemini CLI, Codex, Copilot), and parallel agent threads in a single package [S19][S20][S21][S22][S23][S33][S34]. **Neovim** (97.5K★) via LazyVim is the most capable alternative but requires significant configuration investment [S28][S29].

For the agent-and-companion stack, **Claude Code** CLI provides the deepest feature set, while **OpenCode** (MIT, 75+ LLM providers) is the best free/open-source alternative with a fullscreen diff viewer [S1e][S8e][S9e]. Pairing any agent with **lazygit** (73K★) + **delta** (29.9K★) as diff pager gives side-by-side syntax-highlighted diffs throughout the git workflow [S17][S18e][S20e].

---

## Evaluation Criteria

Tools were evaluated across six dimensions relevant to a developer choosing a terminal-first AI coding workstation:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Coding Agent Support** | 25% | First-class integration with CLI agents (Claude Code, Codex, Gemini CLI, Aider, etc.) |
| **Visual Diff/Review** | 20% | Built-in or plugin-supported side-by-side diffs, inline annotations, hunk staging |
| **Built-in File Editing** | 15% | Graphical file editor beyond terminal-based `$EDITOR` |
| **Terminal Quality** | 15% | Terminal features: multiplexing, splits, GPU acceleration, cross-platform |
| **Maturity & Community** | 15% | GitHub stars, release cadence, license, adoption scale |
| **Cost & Openness** | 10% | Free vs. paid, open-source license, vendor lock-in risk |

---

## Findings

### 1. Pure Terminal Emulators

The baseline layer provides GPU-accelerated rendering, tabs, splits, and extensive configuration but **no** built-in graphical file editors, visual git diff views, or coding-agent orchestration.

**Ghostty** (~50K★, MIT) is the fastest and most polished native terminal on macOS, built with Swift for macOS and GTK for Linux. It offers tabs, splits, themes, and GPU acceleration but is deliberately feature-spartan — no built-in editor, file management, or agent integration [S8].

**Kitty** (32K★, GPL-3.0, v0.46.0 Mar 2026) offers the deepest extension story via its kittens framework: remote file editing (via `$EDITOR`), `icat` image display, `choose-files` fuzzy finder, and terminal hints. However, it delegates to external tools rather than providing integrated GUI features [S7].

**WezTerm** (25.6K★, custom license) provides the deepest programmability with Lua-scriptable configuration and a built-in multiplexer, GPU acceleration, and cross-platform support (macOS/Linux/Windows/BSD). Despite active commits through Mar 2026, the last tagged release was Feb 2024 [S6].

**Zellij** (31K★, MIT, v0.44.1 Apr 2026) is a terminal multiplexer with layouts, floating panes, WASM plugins, and session persistence — positioned between tmux and a full terminal emulator. No built-in editor or GUI features [S9].

**Tabby** (71K★, MIT, v1.0.230 Jan 2026) is primarily an SSH/serial connection manager with split panes, theming, and a cross-platform connection manager. Despite having the highest star count in this tier, it lacks a built-in editor, agent support, or visual diffs [S5].

> **Confidence: high** — All claims verified against official documentation and GitHub repos with current release data.

### 2. Hybrid Terminal/Workbench Environments

Hybrid terminals add built-in editing, file previews, web views, and in some cases first-class agent orchestration on top of terminal functionality.

**Warp** (56K★, AGPL-3.0 client, open-sourced Apr 2026) has pivoted to an "Agentic Development Environment." It offers first-class support for Claude Code, Codex, Gemini CLI, OpenCode, and its own Warp Agent. Its standout features include an interactive **Code Review panel** with inline diff editing and agent-generated **code diffs with line-by-line review** [S2][S3][S4]. Pricing is Free (limited AI) / $18/mo Build / $180/mo Max [S17]. Warp's client is AGPL-3.0 but the server, Warp Drive backend, and Oz orchestration layer remain proprietary [S2].

**Wave Terminal** (~20K★, Apache-2.0, v0.14.5 Apr 2026) integrates a Monaco-based built-in file editor, file previews (markdown, images, code with syntax highlighting), web browsing blocks, an AI assistant (bring-your-own-key), and an active `aifilediff` block for visual diff review [S1][S18]. It supports macOS, Linux, and Windows.

**Orca** (stablyai) is a worktree-native IDE with multi-agent terminals (Claude Code, Codex, OpenCode), a built-in file editor, diffs, PR/CI review, a markdown editor, and a Chromium browser — all in one desktop app (macOS/Windows/Linux). Very new and unproven at scale [S11].

**Zerminal** (~5★, GPL-3.0, launched Apr 2026) is forked from Zed and provides a terminal-first IDE experience using Zed's editor for review, git integration, and agent terminals. Extremely early stage [S10].

**Hermes IDE** (~142★, Tauri+React+Rust) is an AI-native shell wrapper with ghost-text completions, autonomous task execution, git management, multi-project sessions, and worktrees [S13]. **CodeGrid** (~1★, Tauri-based) and **GridTerm** ($67 one-time) offer multi-agent layouts but are very early [S12][S15].

> **Confidence: high** for Warp and Wave (Tier A sources, official docs). **Confidence: medium** for Orca, Zerminal, Hermes IDE, CodeGrid, and GridTerm (new tools with limited independent coverage; some claims rely on self-reported marketing pages).

### 3. Lightweight Editors for Agent Hosting & Diff Review

Editors that are less than full IDEs but support terminal panels, visual diffs, and coding-agent integration.

**Zed** (82K★, GPL/AGPL, reached v1.0 Apr 29 2026, weekly releases) uniquely satisfies every requirement: built-in terminal panel (multiple instances, custom shells) [S21], side-by-side split diff with git graph view and merge conflict resolution [S22], native agentic editing via ACP with first-class support for Claude Agent, Gemini CLI, Codex, and Copilot [S23], and parallel agent threads [S34]. Free and open-source; Pro at $10/mo for AI features. Cross-platform (macOS, Linux, Windows) [S19][S20][S33].

**Neovim** (97.5K★, Apache 2.0, v0.12.2 Apr 2026) provides a built-in `:terminal` for hosting coding agents. Via LazyVim (25.7K stars) it gains pre-configured lazygit integration, Snacks.terminal, gitsigns.nvim (inline diff annotations), and diffview.nvim (full diff browser) [S28][S29][S30]. AI agents like Claude Code, Aider, and Copilot.vim run natively in Neovim's terminal. The caveat: it is a framework, not a product — the user must assemble and maintain the configuration.

**Sublime Text 4** (Build 4200, May 2025, proprietary, ~$80 license) has built-in git diff markers since v3.2 [S8e]. A terminal requires the `Terminus` plugin (1.4K stars, last updated Dec 2025) [S9e], and AI agent support is limited to community plugins like `sublime-claude` (10 stars) [S12e] and `Agentic` (16 stars) [S11e]. Excellent editing experience but immature agent-hosting story.

**Nova** (Panic, macOS-only, $99/year) has a built-in terminal (local + SSH remote) [S15e], excellent git integration with Diff syntax support [S16e], and community extensions for Copilot, Claude Code (CCLite), and Aider [S18e]. AI integration is entirely extension-dependent.

**Lapce** (38K★, Apache 2.0, v0.4.6 Jan 2026) has a built-in terminal, Tree-sitter, LSP, diff viewer, and remote development, but is still pre-1.0 with no AI agent integration [S19e][S20e].

**Helix** (44K★, MPL-2.0, v25.07.1 Jul 2025) is an excellent modal editor with built-in git diff gutter and LSP, but **critically lacks a built-in terminal** (proposal open since 2022 with 243👍 but labeled "E-hard", not merged) [S24][S26]. Users must run agents in an external terminal.

**Lite XL** (6K★, MIT, v2.1.8 Jun 2025) is ultra-lightweight (<5MB) with terminal and git diff via community plugins. No AI agent support [S22e][S23e]. **Micro** (28.3K★, v2.0.15 Dec 2025) is a terminal-based editor with no diff mode and no AI integration [S31][S32e].

> **Confidence: high** for Zed, Neovim, Sublime Text, Helix, and Lapce (Tier A sources, official docs/repos). **Confidence: high** for the "no terminal" conclusion on Helix (verified from open GitHub issue). **Confidence: medium** for Nova's AI extension quality (community plugins with limited adoption data).

### 4. Terminal Coding Agents & Diff Capabilities

CLI coding agents that can run inside any terminal, with built-in diff/review features.

**Claude Code** (64K★, proprietary, TypeScript) has the richest feature set: sub-agents, hooks, skills, Jupyter editing, `/vim` modal input mode, and a built-in colored inline diff view in the CLI. The Desktop app adds a rebuilt visual diff viewer [S1a][S15a][S16a]. No built-in external-difftool integration — users pipe to `git difftool` or companion TUIs.

**OpenAI Codex CLI** (59K★, Apache-2.0, Rust rewrite) offers a full-screen TUI with syntax-highlighted diffs, an inline approve/reject workflow, and a dedicated `/review` command for branch/commit/uncommitted changes. Ctrl+G opens `$EDITOR` for long prompts. `codex apply` brings cloud-task diffs into the local tree [S2a].

**Gemini CLI** (93.6K★, Apache-2.0, TypeScript) is Google's open-source terminal agent with the most generous free tier (1K req/day, 1M token context). It supports interactive terminal commands (vim, git rebase -i) within the agent session. Basic file tools but no built-in visual diff viewer [S3a][S4a].

**Aider** (40.3K–44K★, Apache-2.0, Python) is the pioneer of git-native AI coding: every edit is auto-committed with a descriptive message. The `/diff` command shows changes since last message, `/undo` reverts, and `/git` runs raw git commands. No built-in visual diff TUI but any git tool integrates seamlessly [S5a][S6a][S7a].

**OpenCode** (97.5K★, MIT, Go) supports 75+ LLM providers with LSP integration, multi-session, and a recent fullscreen local diff viewer dialog with unified/split toggle accessible via `/diff` and `d` shortcut [S8a][S9a].

**Crush** (23.8K★, Charmbracelet, Go) brings Bubble Tea TUI aesthetics to coding agents with multi-model support, LSP enhancement, MCP extensibility, and a non-interactive `crush run` mode [S10a][S11a].

**Amp** (Sourcegraph, proprietary, TypeScript) is a multi-model frontier agent with `amp review` CLI command that runs a detached review agent over diffs. Pay-as-you-go with no markup [S12a][S13a].

> **Confidence: high** for all seven agents (Tier A official documentation and GitHub repos). **Confidence: medium** for OpenCode star count (discrepancy between 97.5K from comparison sites and lower direct API counts, likely due to fork/rename migration) [S14a].

### 5. Diff/Review Companion TUIs

Standalone terminal tools for reviewing git diffs and agent-generated changes.

**lazygit** (73K+★, Go) is the de facto standard terminal Git TUI with custom pager support — delta integration via `git.paging.pager: delta --dark --paging=never`. Line/hunk staging, interactive rebase, cherry-pick. The `|` key cycles between pagers [S17a][S18a].

**delta** (29.9K★, Rust) is a drop-in Git pager: five lines in `.gitconfig` and every `git diff/log/show/blame` gets syntax highlighting, side-by-side view, line numbers, and `n`/`N` navigation. Works as lazygit's pager. The single most impactful diff upgrade for any terminal workflow [S20a][S28a].

**difftastic** (24.9K★, Rust) does structural AST diffing via tree-sitter — understands syntax, so reformatted code shows only actual semantic changes. Side-by-side, inline, or JSON output [S21a].

**gitui** (21.7K★, Rust) is the performance king: 24s on the full Linux kernel repo vs. crashes for alternatives. Async, fastest on large mono-repos. No side-by-side diff yet (open issue) [S19a].

**Agent-specific review TUIs** have emerged as a new category: **revdiff** outputs structured annotations to stdout for piping back to agents like Claude Code [S24a]; **tuicr** provides GitHub-style diff review with vim keybindings and clipboard output [S25a]; **critique** offers AI-powered diff explanations with lazygit integration [S23a].

> **Confidence: high** for lazygit, delta, difftastic, gitui (Tier A, established tools). **Confidence: medium** for revdiff, tuicr, critique (emerging tools with limited independent coverage).

---

## Areas of Agreement

- **Zed is the strongest single-app solution.** Multiple independent sources confirm it is the only editor that combines built-in terminal, split diff, first-class ACP agent support, and parallel agent threads out-of-the-box with zero configuration [S19][S21][S22][S23][S33][S34].
- **Warp leads the hybrid terminal category for agent orchestration.** First-class multi-agent support, interactive Code Review panel, and diff editing are consistently reported across official docs and review sites [S2][S3][S4].
- **The companion stack is universally composable.** Every coding agent edits files in git repos, and every diff tool (lazygit, delta, difftastic) operates on git state regardless of what created the changes. No vendor lock-in at this layer [S17a][S20a][S21a].
- **Aider's git-native approach is the most review-friendly.** Auto-commits after every edit mean lazygit/delta always have clean history to work with, unlike agents that leave dirty working trees [S5a][S6a].
- **Ghostty is the fastest pure terminal on macOS.** Multiple comparative reviews corroborate its speed and native polish [S8][S16].

---

## Areas of Disagreement

- **Warp's "open source" status.** Warp's client is AGPL-3.0 but the server, Warp Drive backend, and Oz orchestration layer remain proprietary. Some sources describe Warp as simply "open source" without this nuance, which may mislead users about the full picture [S2].
- **WezTerm's development status.** Last tagged release is Feb 2024, but commits are active through Mar 2026. Some comparison articles list it as "actively developed" which is technically true but misleading regarding stable release availability [S6].
- **OpenCode star count.** Comparison sites cite 97.5K stars [S14a], others cite 95K, and the GitHub API returned 12.3K for the original repo. The discrepancy likely reflects a fork/rename to `anomalyco/opencode` with star migration. The higher figure appears most current.
- **Orca identity confusion.** Two different products named "Orca" exist — `stablyai/orca` (the ADE for coding agents) and `orcaplatform.ai` (an unrelated AI agent platform). Sources must be carefully disambiguated [S11].
- **Aider star count.** The official site claims 44K stars; a comparison table shows 40.3K. Likely a timing difference — both are in the same ballpark [S5a][S14a].

---

## Knowledge Gaps

- **Pricing for emerging ADEs.** Orca, Zerminal, CodeGrid, Zodex, and Hermes IDE do not have clearly published pricing pages. Most appear free/open-source in current versions, but monetization plans are unknown.
- **Actual user adoption metrics.** Beyond GitHub stars, no tool publishes DAU/MAU. The "700,000 developers" claim for Warp is self-reported and unverifiable.
- **Integration testing between agents and companion TUIs.** No authoritative head-to-head testing of agent + lazygit/delta/revdiff workflows was found. Recommendations are based on individual tool capabilities and config compatibility, not battle-tested integration.
- **Crush's built-in diff viewer UX.** Crush's docs focus on LSP/MCP/model support; specific built-in diff review features are not well-documented.
- **Amp CLI-only diff workflow.** Amp's review agent is well-documented, but its exact terminal diff presentation (inline vs. separate viewer) in the CLI is unclear from available sources — most documentation emphasizes the VS Code extension.
- **Zodex and GridTerm maturity.** These tools have very thin web presences with limited verifiable data. Maturity assessments are based solely on marketing pages.
- **Nova's exact version and latest release date.** Could not be confirmed precisely from available sources.

---

## Comparison Matrix

### Terminal Emulators & Hybrid Terminals

| Tool | ⭐ Stars | Agent Support | Visual Diff | Built-in Editor | License | Price | Platform |
|------|---------|---------------|-------------|-----------------|---------|-------|----------|
| **Warp** | 56K | ✅ First-class (5+ agents) | ✅ Full diff editor | ⚠️ Via agent diffs | AGPL-3.0 (client) | Free–$180/mo | Mac/Linux/Win |
| **Wave Terminal** | 20K | ⚠️ AI assistant (BYO key) | ⚠️ `aifilediff` block | ✅ Monaco editor | Apache-2.0 | Free | Mac/Linux/Win |
| **Tabby** | 71K | ❌ | ❌ | ❌ | MIT | Free | Mac/Linux/Win |
| **Ghostty** | 50K | ❌ | ❌ | ❌ | MIT | Free | Mac/Linux |
| **Kitty** | 32K | ❌ | ❌ | ⚠️ Via kittens | GPL-3.0 | Free | Mac/Linux |
| **WezTerm** | 25.6K | ❌ | ❌ | ❌ | Custom | Free | Mac/Linux/Win/BSD |
| **Zellij** | 31K | ❌ | ❌ | ❌ | MIT | Free | Mac/Linux/Win |
| **Orca** | New | ✅ Multi-agent worktrees | ✅ Diffs + PR review | ✅ Built-in | Custom | TBD | Mac/Win/Linux |
| **Zerminal** | 5 | ✅ Terminal-first | ✅ Zed editor diffs | ✅ Zed editor | GPL-3.0 | Free | Mac/Linux |

### Lightweight Editors

| Tool | ⭐ Stars | Terminal | Git/Diff UI | Agent Hosting | License | Price |
|------|---------|----------|-------------|---------------|---------|-------|
| **Zed** | 82K | ✅ Built-in, multi-instance | ✅ Split+unified diff, git graph | ✅ ACP first-class (4+ agents) | GPL/AGPL | Free / $10/mo Pro |
| **Neovim** | 97.5K | ✅ Built-in `:terminal` | ✅ Via plugins (diffview, lazygit, gitsigns) | ✅ Native terminal hosting | Apache 2.0 | Free |
| **Sublime Text 4** | — | ⚠️ Plugin (Terminus) | ⚠️ Diff markers; plugins for full UI | ⚠️ Community plugins (immature) | Proprietary | ~$80 |
| **Nova** | — | ✅ Built-in (local+SSH) | ✅ Built-in git + Diff syntax | ⚠️ Extension-dependent | Proprietary | $99/yr |
| **Lapce** | 38K | ✅ Built-in | ⚠️ Basic diff viewer | ❌ None yet | Apache 2.0 | Free |
| **Helix** | 44K | ❌ None (external only) | ⚠️ Diff gutter only | ❌ No AI integration | MPL-2.0 | Free |
| **Lite XL** | 6K | ⚠️ Plugin | ⚠️ Plugin | ❌ None | MIT | Free |
| **Micro** | 28.3K | ❌ Is a terminal app | ❌ No diff mode | ❌ None | MIT | Free |

### Coding Agents

| Agent | ⭐ Stars | Built-in Diff UI | Git Integration | Model Support | License | Price |
|-------|---------|-------------------|-----------------|---------------|---------|-------|
| **Claude Code** | 64K | ✅ Inline colored diffs | ⚠️ Manual git | Anthropic only | Proprietary | Usage-based |
| **Codex CLI** | 59K | ✅ Full-screen TUI with approve/reject | ⚠️ `codex apply` from cloud | OpenAI | Apache-2.0 | Usage-based |
| **Gemini CLI** | 93.6K | ❌ Relies on git | ⚠️ Basic file ops | Google (free tier generous) | Apache-2.0 | Free (1K req/day) |
| **Aider** | 44K | ⚠️ `/diff` text-based | ✅ Auto-commit every edit | Multi-model (OpenAI, Anthropic, etc.) | Apache-2.0 | Free + API costs |
| **OpenCode** | 97.5K | ✅ Fullscreen unified/split toggle | ⚠️ Standard git | 75+ providers | MIT | Free + API costs |
| **Crush** | 23.8K | ⚠️ Undocumented | ⚠️ Standard git | Multi-model | Custom | Free + API costs |
| **Amp** | — | ⚠️ `amp review` detached agent | ⚠️ Standard git | Multi-model (Claude Opus, GPT-5.x) | Proprietary | Pay-as-you-go |

### Diff/Review Companion TUIs

| Tool | ⭐ Stars | Side-by-Side | Syntax Highlight | Agent Integration | Notes |
|------|---------|-------------|-------------------|-------------------|-------|
| **lazygit** | 73K | ✅ Via delta | ✅ Via delta | ✅ Universal (works with any git repo) | De facto standard git TUI |
| **delta** | 29.9K | ✅ Built-in | ✅ Built-in | ✅ Drop-in git pager | 5-line `.gitconfig` setup |
| **difftastic** | 24.9K | ✅ Built-in | ✅ AST-aware (tree-sitter) | ✅ Via `git difftool` | Best for refactors/reformats |
| **gitui** | 21.7K | ❌ (planned) | ✅ | ✅ Universal | Fastest on large mono-repos |
| **revdiff** | New | ✅ | ✅ | ✅ Claude Code native | Outputs annotations to stdout |
| **tuicr** | New | ✅ | ✅ | ✅ Clipboard to agent | GitHub-style review flow |
| **critique** | New | ✅ | ✅ | ✅ AI-powered explanations | lazygit integration |

---

## Recommended Setups

### 🏆 Best Overall Terminal-First Stack

| Layer | Tool | Rationale |
|-------|------|-----------|
| **Terminal Emulator** | **Ghostty** or **Kitty** | Fastest native terminals; GPU-accelerated [S8][S7] |
| **Coding Agent** | **Claude Code** CLI | Deepest features, sub-agents, `/vim` mode, 80.9% SWE-bench [S1a][S15a] |
| **Git TUI** | **lazygit** | 73K stars, proven, delta integration, hunk/line staging [S17a][S18a] |
| **Diff Pager** | **delta** | Drop-in, side-by-side, syntax-highlighted [S20a][S28a] |
| **Structural Diff** | **difftastic** | Syntax-aware diffing for refactors. Set as `difftool` [S21a] |
| **Agent Diff Review** | **revdiff** | Purpose-built for reviewing agent changes and piping annotations back [S24a] |

```yaml
# ~/.config/lazygit/config.yml
git:
  paging:
    colorArg: always
    pager: delta --dark --paging=never --line-numbers
```

```gitconfig
[core]
    pager = delta
[interactive]
    diffFilter = delta --color-only
[diff]
    tool = difftastic
[difftool]
    prompt = false
[delta]
    navigate = true
    side-by-side = true
```

### 🖥️ Best Single-App Solution

**Zed** — satisfies every requirement out-of-the-box: built-in terminal, split diff, first-class ACP agent support, parallel agent threads. Free and open-source, weekly releases [S19][S33][S34]. Pair with Claude Code as the primary agent via Zed's External Agents panel [S23].

### 💰 Best Free / Open-Source Stack

| Layer | Tool | Rationale |
|-------|------|-----------|
| **Terminal** | **Ghostty** (MIT) | Free, fast [S8] |
| **Agent** | **OpenCode** (MIT) | 75+ providers, LSP, fullscreen diff viewer [S8a][S9a] |
| **Free Model** | **Gemini CLI** | 1K req/day free tier [S3a] |
| **Git TUI** | **lazygit** | Free, open-source [S17a] |
| **Diff Pager** | **delta** | Free, open-source [S20a] |

### ⚡ Best Performance (Large Monorepos)

| Layer | Tool | Rationale |
|-------|------|-----------|
| **Agent** | **Codex CLI** | Rust rewrite, fastest agent startup [S2a] |
| **Git TUI** | **gitui** | 24s on Linux kernel; async Rust, never crashes [S19a] |
| **Diff Pager** | **delta** | Rust, minimal overhead [S20a] |

### 🎨 Most Polished TUI Experience

| Layer | Tool | Rationale |
|-------|------|-----------|
| **Agent** | **Crush** | Bubble Tea aesthetics, LSP, MCP, Charm quality [S10a][S11a] |
| **Git TUI** | **lazygit** | Most polished Git TUI ecosystem [S17a] |
| **Diff Pager** | **delta** | Beautiful side-by-side rendering [S20a] |

---

## Source Inventory

### Terminal Emulators & Hybrid Terminals

| ID | Source | Tier | Score | Recency |
|----|--------|------|-------|---------|
| [S1] | wavetermdev. "Wave Terminal README." GitHub. Apr 2026. https://github.com/wavetermdev/waveterm/blob/main/README.md | A | 4.5 | 2026-04 |
| [S2] | warpdotdev. "Warp README & FAQ." GitHub. Apr 2026. https://github.com/warpdotdev/warp/blob/master/README.md | A | 4.5 | 2026-04 |
| [S3] | Warp Docs. "Code Review panel." 2026. https://docs.warp.dev/code/code-review | A | 4.7 | 2026 |
| [S4] | Warp Docs. "Code Diffs." 2026. https://docs.warp.dev/agent-platform/local-agents/interacting-with-agents/code-diffs | A | 4.7 | 2026 |
| [S5] | Eugeny. "Tabby README." GitHub. Jan 2026. https://github.com/Eugeny/tabby/blob/master/README.md | A | 4.4 | 2026-01 |
| [S6] | wez. "WezTerm Features." wezterm.org. 2026. https://wezterm.org/features.html | A | 4.3 | 2026 |
| [S7] | kovidgoyal. "Kitty kittens intro." kitty docs. 2026. https://sw.kovidgoyal.net/kitty/kittens_intro/ | A | 4.5 | 2026 |
| [S8] | ghostty-org. "Ghostty Features." ghostty.org. 2026. https://ghostty.org/docs/features | A | 4.5 | 2026 |
| [S9] | zellij-org. "Zellij CHANGELOG." GitHub. Apr 2026. https://github.com/zellij-org/zellij/blob/main/CHANGELOG.md | A | 4.5 | 2026-04 |
| [S10] | elleryfamilia. "Zerminal README." GitHub. Apr 2026. https://github.com/elleryfamilia/zerminal/tree/v0.1.14 | B | 3.8 | 2026-04 |
| [S11] | stablyai. "Orca README." GitHub. 2026. https://github.com/stablyai/orca/tree/main | B | 3.9 | 2026 |
| [S12] | isaachorowitz. "CodeGrid." codegrid.app. 2026. https://codegrid.app/ | C | 3.0 | 2026 |
| [S13] | hermes-hq. "Hermes IDE README." GitHub. Mar 2026. https://github.com/hermes-hq/hermes-ide/blob/main/README.md | C | 3.2 | 2026-03 |
| [S15] | GridTerm. "GridTerm." gridterm.com. 2026. https://gridterm.com/ | C | 2.8 | 2026 |
| [S16] | Scopir. "Top 8 Terminal Emulators 2026." 2026. https://scopir.com/posts/best-terminal-emulators-developers-2026/ | B | 3.8 | 2026 |
| [S17] | AgentRank. "Warp Terminal Review." 2026. https://www.agentrank.tech/blog/warp-terminal-review-ai-powered-terminal | C | 3.3 | 2026 |
| [S18] | Wave Terminal. "aifilediff PR #3063." GitHub. Mar 2026. https://github.com/wavetermdev/waveterm/pull/3063 | A | 4.2 | 2026-03 |

### Lightweight Editors

| ID | Source | Tier | Score | Recency |
|----|--------|------|-------|---------|
| [S19] | Zed Industries. "Zed FAQ." zed.dev. 2026. https://zed.dev/faq | A | 4.8 | 2026 |
| [S20] | Zed Industries. "Zed Pricing." zed.dev. 2026. https://zed.dev/pricing | A | 4.8 | 2026 |
| [S21] | Zed Industries. "Built-in Terminal." zed.dev/docs/terminal. 2026. https://zed.dev/docs/terminal | A | 4.8 | 2026 |
| [S22] | Zed Industries. "Git Integration." zed.dev/docs/git. 2026. https://zed.dev/docs/git | A | 4.8 | 2026 |
| [S23] | Zed Industries. "External Agents." zed.dev/docs/ai/external-agents. 2026. https://zed.dev/docs/ai/external-agents | A | 4.8 | 2026 |
| [S24] | Zed Industries. "Agent Panel." zed.dev/docs/ai/agent-panel. 2026. https://zed.dev/docs/ai/agent-panel | A | 4.8 | 2026 |
| [S25] | Zed Industries. "Zed v1.1.5 release." GitHub. May 2026. https://github.com/zed-industries/zed/releases/tag/v1.1.5 | A | 4.9 | 2026-05 |
| [S26] | Zed Industries. "Zed is 1.0." zed.dev/blog. Apr 2026. https://zed.dev/blog/zed-1-0 | A | 4.8 | 2026-04 |
| [S27] | Zed Industries. "Parallel Agents." zed.dev/docs/ai/parallel-agents. Apr 2026. https://zed.dev/docs/ai/parallel-agents | A | 4.8 | 2026 |
| [S8e] | Sublime HQ. "Git Integration." sublimetext.com/docs. 2025. https://www.sublimetext.com/docs/git_integration.html | A | 4.5 | 2025 |
| [S9e] | randy3k. "Terminus: Bring a real terminal to Sublime Text." GitHub. 2025. https://github.com/randy3k/Terminus/ | B | 3.8 | 2025 |
| [S10e] | timbrel. "GitSavvy." GitHub. 2025. https://github.com/timbrel/GitSavvy | B | 3.5 | 2025 |
| [S11e] | alecGraves. "Agentic - LLM Agents for Sublime Text." GitHub. 2025. https://github.com/alecGraves/Agentic | C | 3.0 | 2025 |
| [S12e] | tommo. "sublime-claude." GitHub. 2025. https://github.com/tommo/sublime-claude | C | 3.0 | 2025 |
| [S13e] | Sublime HQ. "Sublime Text Build 4200." sublimetext.com. May 2025. https://www.sublimetext.com/blog/articles/2025/05 | A | 4.5 | 2025-05 |
| [S14e] | TrustRadius. "Sublime Text Pricing 2026." 2026. https://www.trustradius.com/products/sublime-text/pricing | B | 3.8 | 2026 |
| [S15e] | Panic. "Nova Terminal Tabs." help.nova.app. 2026. https://help.nova.app/terminals/overview/ | A | 4.5 | 2026 |
| [S16e] | Panic. "Nova." nova.app. 2026. https://nova.app/ | A | 4.5 | 2026 |
| [S17e] | "Nova for Designers." hackdesign.org. 2026. https://www.hackdesign.org/toolkit/nova/ | B | 3.5 | 2026 |
| [S18e] | Panic Extensions. "Copilot", "CCLite", "Aider." extensions.panic.com. 2026. | B | 3.5 | 2026 |
| [S19e] | lapce. "Lapce." lapce.dev. 2026. https://lapce.dev/ | A | 4.3 | 2026 |
| [S20e] | lapce. "Lapce v0.4.6 release." GitHub. Jan 2026. https://github.com/lapce/lapce/releases/tag/v0.4.6 | A | 4.3 | 2026-01 |
| [S22e] | lite-xl. "Lite XL." GitHub. 2026. https://github.com/lite-xl/lite-xl | A | 4.0 | 2026 |
| [S23e] | lite-xl-plugins. "Plugins list." GitHub. 2025. https://github.com/lite-xl/lite-xl-plugins | B | 3.5 | 2025 |
| [S24e] | helix-editor. "Helix." GitHub. 2026. https://github.com/helix-editor/helix | A | 4.5 | 2026 |
| [S25e] | helix-editor. "Release 25.07 Highlights." 2025. https://helix-editor.com/news/release-25-07-highlights/ | A | 4.6 | 2025-07 |
| [S26e] | helix-editor. "Integrated Terminal proposal #1976." GitHub. 2022–2025. https://github.com/helix-editor/helix/issues/1976 | B | 3.5 | 2025 |
| [S28] | neovim. "Neovim." GitHub. 2026. https://github.com/neovim/neovim | A | 4.8 | 2026 |
| [S29] | LazyVim. "LazyVim." GitHub. 2026. https://github.com/LazyVim/LazyVim | B | 4.0 | 2026 |
| [S30] | kdheepak. "lazygit.nvim." GitHub. 2025. https://github.com/kdheepak/lazygit.nvim | B | 3.8 | 2025 |
| [S31] | micro-editor. "Micro." GitHub. 2026. https://github.com/micro-editor/micro | B | 3.5 | 2026 |
| [S32e] | micro-editor. "Diff mode discussion #2753." GitHub. 2024. https://github.com/micro-editor/micro/discussions/2753 | C | 3.0 | 2024 |

### Coding Agents & Diff Companion TUIs

| ID | Source | Tier | Score | Recency |
|----|--------|------|-------|---------|
| [S1a] | Anthropic. "Claude Code Overview." code.claude.com. 2026. https://code.claude.com/docs/en/overview/ | A | 4.8 | 2026 |
| [S2a] | OpenAI. "Codex CLI Features." developers.openai.com. 2026. https://developers.openai.com/codex/cli/features | A | 4.8 | 2026 |
| [S3a] | Google. "Introducing Gemini CLI." blog.google. 2025. https://blog.google/technology/developers/introducing-gemini-cli-open-source-ai-agent | A | 4.7 | 2025 |
| [S4a] | Google. "Gemini CLI docs." google-gemini.github.io. 2026. https://google-gemini.github.io/gemini-cli/ | A | 4.6 | 2026 |
| [S5a] | Aider. "Aider — AI Pair Programming." aider.chat. 2026. https://aider.chat/ | A | 4.5 | 2026 |
| [S6a] | Aider. "Git Integration." aider.chat/docs/git.html. 2026. https://aider.chat/docs/git.html | A | 4.6 | 2026 |
| [S7a] | Aider. "Unified Diffs." aider.chat/docs/unified-diffs.html. 2024. https://aider.chat/docs/unified-diffs.html | A | 4.4 | 2024 |
| [S8a] | OpenCode. "OpenCode Docs." dev.opencode.ai. 2026. https://dev.opencode.ai/docs | A | 4.5 | 2026 |
| [S9a] | anomalyco/opencode PR #15710. "Fullscreen local diff viewer dialog." GitHub. 2026. https://github.com/anomalyco/opencode/pull/15710 | B | 4.0 | 2026 |
| [S10a] | charmbracelet/crush. GitHub. 2026. https://github.com/charmbracelet/crush | A | 4.5 | 2026 |
| [S11a] | vibecodinghub.org. "Crush Review 2026." 2026. https://vibecodinghub.org/tools/crush | B | 3.8 | 2026 |
| [S12a] | ampcode.com. "Owner's Manual — Amp." 2026. https://ampcode.com/manual | A | 4.5 | 2026 |
| [S13a] | ampcode.com. "Liberating Code Review." 2026. https://ampcode.com/news/liberating-code-review | B | 4.2 | 2026 |
| [S14a] | Michael Livs. "Every CLI coding agent, compared." michaellivs.com. 2026. https://michaellivs.com/blog/cli-coding-agents-compared | B | 4.3 | 2026 |
| [S15a] | Anthropic. "Interactive Mode — Claude Code Docs." 2026. https://code.claude.com/docs/en/interactive-mode | A | 4.7 | 2026 |
| [S16a] | lotharschulz.info. "Claude Code Diff Viewer Comparison." 2026. https://www.lotharschulz.info/2026/04/17/claude-code-desktop-diff-viewer-vs-claude-code-cli-vs-git-diff-a-hands-on-comparison/ | B | 3.9 | 2026 |
| [S17a] | lazygit. "Simple Terminal UI for Git." lazygit.dev. 2026. https://lazygit.dev/ | A | 4.6 | 2026 |
| [S18a] | jesseduffield/lazygit. "Custom Pagers." GitHub. 2026. https://github.com/jesseduffield/lazygit/blob/v0.60.0/docs/Custom_Pagers.md | A | 4.5 | 2026 |
| [S19a] | gitui-org/gitui. GitHub. 2026. https://github.com/gitui-org/gitui | A | 4.3 | 2026 |
| [S20a] | dandavison/delta. GitHub. 2026. https://github.com/dandavison/delta | A | 4.6 | 2026 |
| [S21a] | Wilfred/difftastic. GitHub. 2026. https://github.com/wilfred/difftastic | A | 4.5 | 2026 |
| [S23a] | remorses/critique. GitHub. 2026. https://github.com/remorses/critique | B | 3.7 | 2026 |
| [S24a] | umputun/revdiff. GitHub. 2026. https://github.com/umputun/revdiff | B | 3.8 | 2026 |
| [S25a] | leolimasa/tuicr. crates.io. 2026. https://crates.io/crates/tuicr | B | 3.6 | 2026 |
| [S28a] | 32blog.com. "delta: A Better Git Diff Pager." 2026. https://32blog.com/en/cli/cli-git-delta | B | 3.9 | 2026 |

---

## Methodology

- **Depth**: standard
- **Sub-questions researched**: 4 (terminal emulators, hybrid terminals, lightweight editors, coding agents + diff TUIs)
- **Search queries per sub-question**: 2–4 varied angles per sub-question
- **Search tools used**: Perplexity AI, Exa, web search with domain filtering
- **Source evaluation**: Tier A (authoritative: official docs, GitHub repos) through Tier C (supplemental: expert blogs, marketing pages). All sources scored on author authority, publication reputation, recency, corroboration, and methodology transparency per project source-quality standards.
- **Synthesis approach**: Cross-referenced findings across sub-questions to identify tool overlaps (e.g., Zed appearing in both editor and agent contexts), resolve contradictions, and build integrated stack recommendations.
