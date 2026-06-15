# Browser-Native Single-Agent Research Curriculum

- **Issue**: BER-163
- **Status**: Draft execution plan
- **Decision source**: [D018](../decisions.md#d018-browser-native-single-agent-curriculum-over-plain-teacher-distillation)
- **Last updated**: 2026-06-15

## 1. Context: why this pivot

BER-145/146 showed that the old raw-student `web_search`/`fetch_content` trajectory path is not ready for scale: prompt/cap tuning did not reliably produce clean grounded trajectories, raw-student reward probes were dominated by process/controller failures, and capture-evolution retries did not produce promotable clean winners.

The target is now a **small browser-native, context-managed, single-agent Deep Research model**. It should learn browser interaction, evidence handling, context compression/recall, gap assessment, and cited synthesis as visible behavior. Raw-student RL/evolution are paused, and the BER-162 data-factory evolution retry is paused, until this boring verifier-backed bootstrap path shows learnability.

## 2. Non-goals / freeze

Do **not** run or design around these in this phase:

- No subagent spawning.
- No adaptive100 or 500-kept generation.
- No GRPO or raw-student primary evolution.
- No BER-162 data-factory evolution retry.
- No `web_search` / `fetch_content` APIs in the final policy.
- No hidden teacher reasoning as a trainable target.

## 3. Runtime architecture decision

Use the **Playwright library directly** for the training harness. Do not wrap the training loop through the `agent-browser` CLI. `agent-browser` remains useful for planner/manual scouting and debugging, but the curriculum runtime needs a stable programmatic environment with deterministic trace capture and verifier hooks.

`BrowserEnv` components:

- Playwright browser context and page lifecycle.
- Action executor with validation, timeouts, and error normalization.
- Bounded accessibility snapshot serializer.
- Stable reference map from observations to interactable elements.
- Visible-text and link extractors.
- URL visit ledger.
- Evidence ledger.
- Trace recorder.
- Replay hooks for deterministic inspection where feasible.
- Verifier hooks for citations, evidence, context actions, and forbidden tools.

## 4. Action and observation schema

Model-native actions should be browser actions over stable observation refs, not raw CSS/XPath selectors.

Initial action set:

- `browser.search(query)`
- `browser.goto(url)`
- `browser.click(ref)`
- `browser.type(ref, text)`
- `browser.scroll(direction | amount)`
- `browser.back()`
- `browser.extract_visible_text(ref? | region?)`
- `browser.extract_links(ref? | region?)`
- `browser.screenshot()` — optional, used sparingly for visual debugging or visual pages.

Observation rules:

- Every observation gets stable refs scoped to a **ref-map epoch**.
- Actions refer to refs from the current or explicitly carried epoch.
- Observations are bounded and canonicalized: page title, normalized URL, viewport/accessibility summary, key visible text snippets, selected links/buttons/inputs, and relevant warnings.
- Never train on raw unbounded DOM dumps or raw full-page HTML.

## 5. Visible research/context primitives

Train the policy on explicit, visible primitives rather than hidden reasoning:

- `evidence_card`: record a source-backed finding with URL, quote/span, claim, and relevance.
- `stash_finding`: move useful evidence/context out of the active window.
- `recall_finding`: retrieve stashed evidence when needed.
- `compress_findings`: produce a compact, source-preserving summary of accumulated evidence.
- `context_usage`: report context pressure and what should be compressed/recalled.
- `gap_assessment`: name missing evidence, uncertainty, and next search/read action.
- `final_answer`: synthesize only from visited/cited evidence.

## 6. Trace format

Record one structured event per step. Required fields:

- `step_id`, timestamp, teacher/model, prompt/task id.
- `action` and normalized arguments.
- `url_before`, `url_after`, navigation status, redirects.
- Bounded canonical `observation`.
- `visible_text_hash` and content hash for observation payloads.
- `ref_map_epoch` and compact ref-map metadata.
- Errors, blocked actions, timeouts, captcha/login/paywall flags.
- Evidence/context events (`evidence_card`, stash/recall/compress/context/gap/final).
- Runtime metadata: browser version, viewport, caps, token counts, wall time.
- Verifier metadata and later verifier results.

The trace should be sufficient for audit, replay where possible, SFT rendering, auxiliary target generation, and negative-fixture construction without storing unsafe raw page dumps.

## 7. Verifier gates and negative fixtures

Build deterministic verifier gates before scale:

- **Visited URL citation verifier**: every cited URL must have been visited in the trace ledger.
- **Quote/span support verifier**: quoted or paraphrased support must appear in bounded page text or approved extracted text.
- **Source diversity/quality verifier**: enforce minimum source count/diversity for nontrivial tasks and flag low-quality/source-stuffing behavior.
- **Claim-to-evidence / citation-density verifier**: major claims require nearby evidence; penalize citation spam and unsupported synthesis.
- **Context-action/process verifier**: required evidence/context primitives must be used coherently, not as empty ritual.
- **Forbidden-tool verifier**: reject `web_search`, `fetch_content`, local filesystem reads, subagent dispatch, and any non-browser retrieval path.

Reward-hacking negative fixtures:

- Fake citation or hallucinated visited URL.
- Irrelevant quote attached to a claim.
- Unsupported claim in final answer.
- Source stuffing with low relevance/diversity.
- Captcha/login/paywall wall mishandling.
- Context primitive spam with no useful evidence movement.

## 8. Tiny smoke before scale

Run only after the harness/verifiers exist:

- 3–6 Sonnet 4.6 browser-only traces.
- No `web_search` / `fetch_content`.
- No subagents.
- Citations only from visited URLs.
- Visible evidence/context actions present.
- Manual audit of trace readability and verifier behavior.

Gate before any scale:

- `>=80%` verifier pass on the tiny smoke.
- `0` forbidden-tool events.
- `0` fake citations / hallucinated visited URLs.
- Manual audit says traces are research-like and not verifier-gamed.

## 9. Data bank taxonomy

Buckets:

- Browser basics.
- Search/navigation/retry.
- Single-page evidence extraction.
- Multi-source evidence cards.
- Context compression/recall.
- Gap assessment and uncertainty.
- Short cited synthesis.
- Hard browser research.
- Negative/contrastive examples.

Metadata labels:

- `bucket`, `difficulty`, domains, source count.
- Browser steps, context tokens, wall time.
- Verifier results and failure reasons.
- Teacher model and route.
- Trace cleanliness, intervention count, replayability.
- Unique example id, dedupe keys, repeat counts.

## 10. SFT-A / SFT-B

- **SFT-A**: browser policy/process SFT on actions plus visible research/context primitives.
- **SFT-B**: the same policy/process targets as SFT-A, plus bounded observation-prediction auxiliary loss.

SFT-B auxiliary targets should not train raw page/DOM reconstruction. Acceptable bounded auxiliary targets:

- Compact next-observation summary or delta.
- Page type and task relevance.
- Likely usefulness / evidence availability.
- Bad-action, captcha/login/paywall, or low-value-page risk.

A/B invariant: SFT-A and SFT-B use the same policy traces and splits; B only adds the auxiliary objective.

## 11. Training schedule and sampling

Use staged mixture training with replay from the labeled data bank:

1. Browser basics + navigation + negative fixtures.
2. Single-page evidence extraction.
3. Multi-source evidence cards and cited synthesis.
4. Context compression/recall and gap assessment.
5. Hard browser research, while replaying easy buckets.

For same-objective SFT/midtraining stages, prefer continuous optimizer state, global step, and LR schedule with dataloader mixture shifts. WSD is preferred. Restart only when objective or parameterization changes, e.g. SFT → DPO/RL or full-rank → LoRA.

Sampling policy:

- Training mostly weighted with replacement.
- Evaluation frozen and without replacement.
- Use repeat caps, temperature smoothing, dedupe, and logging of unique examples, max repeats, and effective sample size.

## 12. Promotion gates before BER-146 real RL

Do not wire real GRPO/BER-146 weight updates until bootstrap rollouts show:

- Nontrivial clean zero-intervention rollout rate.
- Acceptable citation/verifier pass rate.
- Correct use of context actions (not spam or dead code).
- Manual audit says traces are research-like.
- Negative fixtures catch known reward hacks.

Raw student can remain a shadow diagnostic, but it is not the primary policy for evolution/RL until these gates pass.

## 13. References

- BER-163: Browser-native single-agent research curriculum and verifier gates.
- [docs/decisions.md D018](../decisions.md#d018-browser-native-single-agent-curriculum-over-plain-teacher-distillation): settled browser-native curriculum decision and source map.
- Kotha & Liang, "Replaying pre-training data improves fine-tuning" (2026): replay/midtraining data improves data efficiency and target-task performance.
- Liu, Neubig & Xiong, "Midtraining Bridges Pretraining and Posttraining Distributions" (2026): midtraining as a distribution bridge with mixture/timing interactions.
- Hu et al., "MiniCPM" (2024): WSD schedule for continuous training and domain adaptation.
- Gururangan et al., "Don't Stop Pretraining" (2020): DAPT/TAPT evidence for domain/task adaptation.
- "The Verifier is the Moat" user-provided bundle: strategy hypothesis/source map for verifier-first agent training; hard gates should cite and verify primary sources before becoming permanent criteria.
