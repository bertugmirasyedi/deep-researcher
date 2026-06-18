# SFT Dataset Generation for Agentic Tool Use

_Date: 2026-06-14_

## Executive summary

BER-145 should treat SFT data generation as a **quality-filtered teacher bootstrap problem**, not as a generic instruction-data scaling problem. The strongest evidence across synthetic SFT, tool-use datasets, web-agent datasets, and distillation papers points to the same recipe: generate multiple frontier-teacher trajectories, keep only trajectories that are replayable under the student's exact tool contract, filter with deterministic gates before any LLM judge, and supervise only the student-visible policy tokens. This is closest to the combination of Self-Instruct-style bootstrapping ([Self-Instruct](https://arxiv.org/abs/2212.10560)), quality-first data selection ([LIMA](https://arxiv.org/abs/2305.11206), [AlpaGasus](https://arxiv.org/abs/2307.08701)), best-of-N/rejection-sampled reasoning ([STaR](https://arxiv.org/abs/2203.14465), [Let's Verify Step by Step](https://arxiv.org/abs/2305.20050)), ToolBench-style tool-trajectory construction ([ToolLLM / ToolBench](https://arxiv.org/abs/2307.16789)), and WebGPT-style browsing demonstrations plus rejection sampling ([WebGPT](https://arxiv.org/abs/2112.09332)).

For BER-145 specifically, the report's bottom line is:

1. **Start with a 100-200 episode smoke/gate set, but do not stop there.** Use 100-200 accepted traces to validate the renderer, replay harness, validators, loss masks, split isolation, and a tiny SFT run. If those pass and budget is approved, scale SFT-0 to **~1k-2k accepted Opus teacher traces** before expecting a small student to learn robust web-search/fetch behavior. The 100-200 idea is a pipeline/gate size; the 1k-2k recommendation is the first meaningful bootstrap size for policy learning.
2. **Main policy SFT should use zero-intervention, replayable clean traces only.** Controller-assisted traces are useful diagnostics and candidate-generation material, but they should not become positive demonstrations unless converted into a clean replay/teacher demonstration under the exact student-visible contract, or explicitly labeled as negative/contrastive data. Otherwise the student is trained to imitate an impossible hidden controller.
3. **Use Opus teacher best-of-N + hard gates + optional judge.** Generate several candidate trajectories per prompt, reject by deterministic validators first, then use an LLM judge only after hard gates for comparative quality, coverage, and style. This follows the quality-first lesson from [LIMA](https://arxiv.org/abs/2305.11206), [AlpaGasus](https://arxiv.org/abs/2307.08701), [Llama 2](https://arxiv.org/abs/2307.09288), and [MT-Bench/Chatbot Arena](https://arxiv.org/abs/2306.05685), while avoiding proxy-only selection risks highlighted by reward-overoptimization work ([Gao et al.](https://arxiv.org/abs/2210.10760)).
4. **Train SFT-A/B on identical policy trajectories.** Variant B may add bounded, canonical observation-auxiliary records, but A and B must share the same prompts, tool calls, observations, final answers, filters, splits, and policy text. Otherwise the comparison confounds data quality with experimental treatment.
5. **Never train on hidden/provider thinking traces.** Mask hidden reasoning and tool observations for policy loss; supervise concise student-visible planning/action/final-answer text and optionally bounded canonical observation auxiliaries. This is both an implementation hygiene requirement and a faithfulness risk mitigation given evidence that chain-of-thought can be unfaithful ([Turpin et al.](https://arxiv.org/abs/2305.04388)) and may omit important internal reasons in reasoning models ([Anthropic](https://www.anthropic.com/research/reasoning-models-dont-say-think)).
6. **Generate from train split only; leave validation/test untouched.** Hash prompts, URLs, fetched content, rubric text, expected answers, and eval-derived generations to quarantine leakage. This is necessary because benchmark contamination is common and hard to detect after the fact ([Deng et al.](https://arxiv.org/abs/2311.09783), [Open contamination report](https://arxiv.org/abs/2310.17589)).

## Key papers and datasets

| Paper / dataset | Data-generation method | Filtering / evaluation | Relevance to BER-145 | Caveat |
|---|---|---|---|---|
| [Self-Instruct](https://arxiv.org/abs/2212.10560) | Bootstraps new instructions and instances from a small seed set using a strong LM. | Heuristic filtering, deduplication, and task-format checks. | Template for generating train-only research questions and structured teacher episodes from seed tasks. | Generic instruction format; does not solve web citation grounding or tool replay. |
| [Stanford Alpaca](https://crfm.stanford.edu/2023/03/13/alpaca.html) | Distills 52k teacher instruction-following demonstrations into a 7B student. | Lightweight dataset generation and small human/qualitative evals. | Shows cheap teacher distillation can move small models if task format is close. | Weak safety/factual filters by modern standards; not agentic or citation grounded. |
| [WizardLM / Evol-Instruct](https://arxiv.org/abs/2304.12244) | Evolves seed instructions into harder variants. | Evolves and eliminates low-quality instructions. | Useful for gradually increasing BER-145 task difficulty: conflicts, stale pages, cap pressure, recency constraints. | Difficulty mutation can create unanswerable or unverifiable tasks unless checked. |
| [UltraChat](https://arxiv.org/abs/2305.14233) / [OpenHermes](https://huggingface.co/datasets/teknium/OpenHermes-2.5) | Large-scale multi-turn synthetic conversations and curated mixtures. | Mixture curation and benchmark evaluation. | Supports role-simulated dialogue and broad mixture design. | Public mixture details are not always reproducible enough for trace-level scientific control. |
| [LIMA](https://arxiv.org/abs/2305.11206) | Small set of carefully curated high-quality instruction responses. | Human curation and evaluation. | Supports prioritizing clean, high-signal traces over bulk synthetic volume. | LIMA-style surface alignment is not enough for tool-call reliability. |
| [AlpaGasus](https://arxiv.org/abs/2307.08701) | Filters instruction data with an LLM quality scorer. | Keeps high-scoring data and compares smaller filtered sets against larger noisy sets. | Justifies quality filters after hard validators. | LLM scorer can Goodhart on verbosity/style; must be calibrated. |
| [STaR](https://arxiv.org/abs/2203.14465) | Iteratively samples rationales, keeps those leading to correct answers, then retrains. | Answer-correctness rejection and bootstrapping. | Analogous to best-of-N teacher trajectory generation followed by deterministic acceptance. | Reasoning traces must be student-visible and faithful; hidden CoT should not be copied. |
| [Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) | Trains process reward models from step-level correctness signals. | Process-level supervision beats outcome-only for some reasoning tasks. | Supports validating intermediate tool decisions, citation support, and fetch/search choices. | BER-145 lacks cheap ground truth for all reasoning steps; use deterministic proxies carefully. |
| [Llama 2](https://arxiv.org/abs/2307.09288) | SFT plus RLHF with rejection sampling and safety/helpfulness data. | Human preference data, safety evaluation, and iterative tuning. | Supports staged SFT, rejection sampling, and held-out safety/eval discipline. | Full RLHF process is heavier than BER-145 SFT-0 needs. |
| [MT-Bench / Chatbot Arena](https://arxiv.org/abs/2306.05685) | LLM-as-judge and pairwise arena-style evaluation. | Judge agreement and benchmark-style comparative scoring. | Useful only after hard gates for tie-breaking quality and style. | Judge bias and contamination mean it cannot be the first acceptance gate. |
| [Toolformer](https://arxiv.org/abs/2302.04761) | Self-supervised insertion of API calls into text when calls improve likelihood. | Keeps API calls that help prediction. | Shows tool use can be learned from generated call annotations. | Toolformer optimizes text likelihood, not replayable web-research outcomes. |
| [ToolLLM / ToolBench](https://arxiv.org/abs/2307.16789) | Builds instruction/tool trajectories over many real APIs using teacher planning. | Tool execution, answer quality, and benchmark evaluation. | Closest general template for SFT over action/observation/final-answer tool traces. | General API calls differ from BER-145's capped web_search/fetch_content contract. |
| [API-Bank](https://arxiv.org/abs/2304.08244) | Multi-turn API-use benchmark with tool-augmented dialogues. | Evaluates API calls, dialogue state, and tool results. | Useful for schema-valid call checks and action/result supervision. | Does not target citation-grounded web research. |
| [Gorilla / APIBench](https://arxiv.org/abs/2305.15334) | Trains models to select and call APIs from documentation. | API call correctness and hallucination evaluation. | Supports conditioning tool calls on exact schemas/docs to reduce hallucinated tools. | Mostly API selection/function-call syntax, not multi-source synthesis. |
| [FireAct](https://arxiv.org/abs/2310.05915) | Fine-tunes open models on ReAct-style trajectories. | Evaluates task success after agent fine-tuning. | Supports process imitation of action/observation loops. | Blindly cloning poor trajectories can teach shortcuts. |
| [AgentTuning](https://arxiv.org/abs/2310.12823) | Instruction-tunes LLMs on multi-agent/task trajectories. | Agent benchmark evaluation and mixture design. | Supports mixing diverse agent skills while preserving general ability. | Public tasks are broader than BER-145 and may not match its citation constraints. |
| [WebGPT](https://arxiv.org/abs/2112.09332) | Human/LM demonstrations browse web pages, collect references, and answer with citations. | Rejection sampling and human preference comparisons. | Best direct precedent for browse/search/fetch-to-cited-answer SFT. | Browser environment differs from fixed web_search/fetch_content tools. |
| [ReAct](https://arxiv.org/abs/2210.03629) | Interleaves reasoning traces with actions and observations. | Evaluates grounded reasoning/action tasks. | Natural schema for BER-145 traces: plan/search/fetch/evidence/final answer. | The paper's free-form thoughts should be converted into concise visible summaries, not hidden CoT. |
| [Mind2Web](https://arxiv.org/abs/2306.06070) | Human demonstrations for web navigation tasks across websites. | Action prediction and website generalization. | Useful for web task diversity and held-out domain splitting. | DOM navigation is not the same as search/fetch research episodes. |
| [WebShop](https://arxiv.org/abs/2207.01206) | Simulated web shopping environment with search/navigation decisions. | Task success/reward in an online environment. | Useful for cap-aware search and decision sequencing. | Shopping rewards are easier to verify than open research answers. |
| [WebArena](https://arxiv.org/abs/2307.13854) | Realistic web task benchmark over websites. | End-to-end web task success. | Teaches that web-agent eval should use held-out sites/domains and realistic observations. | Too browser/action-heavy for direct dataset reuse. |
| [ALCE](https://arxiv.org/abs/2305.14627) | Citation-grounded long-form answer generation benchmark. | Citation precision/recall and support checks. | Directly relevant to fetched/cited overlap and claim support filters. | Citation metrics do not fully judge research quality or synthesis. |
| [WebVoyager](https://arxiv.org/abs/2401.13919) | Multimodal web-agent benchmark over real websites. | Online task completion. | Useful for web-agent realism and failure taxonomy. | Multimodal browser actions are outside BER-145's current tool abstraction. |
| [AutoWebGLM](https://arxiv.org/abs/2404.03648) | Web navigation agent training/evaluation around HTML/browser interactions. | Web task execution metrics. | Provides lessons for observation compression and realistic tool feedback. | Not a direct fit for text-only search/fetch traces. |
| [Search-R1](https://arxiv.org/abs/2503.09516) | Reinforcement learning for search-augmented reasoning. | Outcome/retrieval reward signals. | Suggests later RL can improve search behavior after SFT syntax is stable. | SFT-0 should not start with RL-style sparse rewards. |
| [Distilling Step-by-Step](https://arxiv.org/abs/2305.02301) | Distills both labels and rationales from larger models into smaller models. | Task accuracy vs. data/parameter efficiency. | Supports process supervision for small students when rationales are clean and visible. | Does not license copying provider-hidden thinking; use visible summaries only. |
| [QLoRA](https://arxiv.org/abs/2309.08632) | Efficient low-rank fine-tuning of quantized models. | Downstream task performance with limited memory. | Practical path for LoRA SFT on Qwen3-30B-A3B-like student checkpoints. | Optimization method, not a data-quality solution. |
| [Model collapse](https://www.nature.com/articles/s41586-024-07566-y) | Studies recursive training on generated data. | Shows tail loss/degradation when generated data recursively replaces real data. | Requires retaining gold/human/real seed traces and lineage. | Does not mean synthetic data is unusable; it means unanchored recursion is risky. |
| [Synthetic + real data mitigation](https://arxiv.org/abs/2404.01413) | Studies synthetic data mixed with accumulating real data. | Finds real-data anchoring can avoid collapse under studied settings. | Supports mixing teacher traces with stable gold anchors and deployment-like logs. | Conditions may not transfer to all agent distributions. |
| [Reward overoptimization](https://arxiv.org/abs/2210.10760) | Analyzes optimizing learned reward models too hard. | Shows proxy reward overoptimization can reduce true preference quality. | Warns against selecting only by one judge/proxy score. | About reward models/RLHF, but the Goodhart lesson applies to filtering. |
| [Unfaithful CoT](https://arxiv.org/abs/2305.04388) / [Anthropic CoT faithfulness](https://www.anthropic.com/research/reasoning-models-dont-say-think) | Tests whether verbalized reasoning reflects actual causes. | Finds reasoning can be incomplete or misleading. | Justifies masking hidden thinking and preferring verifiable action/evidence traces. | Does not forbid all visible reasoning summaries; it constrains what to trust/train. |
| [Benchmark contamination](https://arxiv.org/abs/2311.09783) / [Open contamination report](https://arxiv.org/abs/2310.17589) | Measures or documents test-data leakage risks. | Finds contamination can distort benchmark results. | Requires split hashing, source quarantine, and no eval-derived training examples. | Detection is imperfect; prevention is cheaper. |
| [Sleeper Agents](https://arxiv.org/abs/2401.05566) | Studies persistence of deceptive/backdoored behavior through safety training. | Shows some hidden behaviors can survive training. | Add filters for trigger-like traces, hidden policies, secrets, and deceptive strategies. | Not specific to web research, but relevant to synthetic data provenance and safety. |

## 1. Synthetic instruction and SFT dataset recipes

The baseline recipe from synthetic instruction tuning is: start with a small trusted seed, ask a stronger model to expand it, filter aggressively, then fine-tune a smaller student. [Self-Instruct](https://arxiv.org/abs/2212.10560) demonstrates this pattern with generated instructions and instances, while [Stanford Alpaca](https://crfm.stanford.edu/2023/03/13/alpaca.html) shows that a 7B model can gain useful instruction-following behavior from a relatively small teacher-generated corpus. For BER-145, the direct translation is not "generate generic instructions"; it is "generate deployment-shaped single-question research episodes" with the exact system prompt, tool schema, cap profile, observation format, citation contract, and final-answer renderer that the student will see.

Instruction evolution is useful, but only under answerability constraints. [WizardLM / Evol-Instruct](https://arxiv.org/abs/2304.12244) suggests mutating seed tasks into more complex variants; for BER-145 that means adding source conflicts, recency constraints, sparse results, inaccessible pages, cap pressure, or source-tier tradeoffs. However, every mutated task must remain solvable under the 10/18-style cap profile and available tools; otherwise SFT trains the student on impossible demonstrations.

Large synthetic mixtures such as [UltraChat](https://arxiv.org/abs/2305.14233) and [OpenHermes](https://huggingface.co/datasets/teknium/OpenHermes-2.5) support broad role simulation and multi-turn coverage, but BER-145 should resist imitating their scale-first posture. The relevant lesson is mixture design and curation, not raw volume. A small research student needs a sharply matched distribution: one user question, bounded web_search/fetch_content calls, evidence selection, citation-grounded answer, and explicit abstain/failure behavior.

## 2. Rejection sampling and filtering

The strongest filtering lesson is to put deterministic gates before subjective scoring. [STaR](https://arxiv.org/abs/2203.14465) keeps generated rationales that lead to correct answers; [Let's Verify Step by Step](https://arxiv.org/abs/2305.20050) shows that process-level checks can outperform outcome-only supervision in reasoning settings; [LIMA](https://arxiv.org/abs/2305.11206) and [AlpaGasus](https://arxiv.org/abs/2307.08701) show that smaller, cleaner datasets can beat larger noisy ones; and [Llama 2](https://arxiv.org/abs/2307.09288) uses iterative SFT/RLHF-style data pipelines with rejection sampling and safety filtering. For BER-145, this implies best-of-N Opus trajectories, hard acceptance filters, then optional LLM judge scoring.

Recommended hard gates for BER-145 accepted traces:

- **Cap compliance:** attempted and executed calls stay within the selected cap profile; blocked-cap messages and cap-violating attempts reject the trace.
- **Allowed tools only:** no local filesystem, shell, code execution, browser, or hidden controller tools in policy traces.
- **Tool schema validity:** every web_search and fetch_content call parses against the exact student schema; no plural/batched form if the student contract is singular.
- **Replayability:** the trace can be replayed from stored tool calls and canonical observations; fetched content hashes and search metadata are stored.
- **Citation validity:** every final-answer citation URL was fetched; every material claim maps to fetched evidence; cited/fetched overlap is high; fabricated or unsupported citations reject.
- **Source quality:** source tiers, domain diversity, primary/official source preference, and conflict handling meet the prompt-specific rubric.
- **No secrets or unsafe leakage:** reject traces containing credentials, private data, hidden policies, controller instructions, or accidental local artifacts.
- **No hidden reasoning contamination:** provider-hidden thinking is never included; visible reasoning is a concise plan/evidence summary only.
- **No validation/test leakage:** generated only from train prompts; prompt/source/rubric hashes are checked against val/test quarantine lists.
- **Deduplication and diversity:** dedupe by prompt, query family, source set, final answer, trace shape, and embedding similarity; maintain coverage of easy/medium/hard and success/recovery cases.

LLM-as-judge is still useful after those gates. [MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) support using LLM judges for comparative helpfulness/quality, and [AlpaGasus](https://arxiv.org/abs/2307.08701) supports quality-based data selection. But [reward overoptimization](https://arxiv.org/abs/2210.10760) warns that optimizing a proxy too hard can degrade true quality, so BER-145 should calibrate judge thresholds on a small human-reviewed set and audit for verbosity, source-count, and familiar-domain bias.

## 3. Agent and tool-use trajectory datasets

Tool-use datasets converge on action/observation trajectory supervision. [Toolformer](https://arxiv.org/abs/2302.04761) shows a model can learn where to call tools from generated annotations; [ToolLLM / ToolBench](https://arxiv.org/abs/2307.16789) builds multi-step tool-use trajectories over real APIs; [API-Bank](https://arxiv.org/abs/2304.08244) evaluates multi-turn API-call correctness; and [Gorilla / APIBench](https://arxiv.org/abs/2305.15334) emphasizes API documentation grounding and hallucination reduction. The common BER-145 implication is that the dataset should record the exact tool schema, arguments, observations, and terminal answer, not just final answers.

However, public general-API corpora are not sufficient substitutes for BER-145 data. Most of them train API selection/function-call behavior, while BER-145 needs capped research behavior: query formulation, search result triage, fetch choice, evidence compression, citation support, source-tier tradeoffs, and graceful stopping. ToolBench-like generation is a template for process data, not a reusable domain corpus.

[FireAct](https://arxiv.org/abs/2310.05915) and [AgentTuning](https://arxiv.org/abs/2310.12823) are closer to agent process imitation: they fine-tune models on agent trajectories and show that process traces can improve open-model agents. Their caution for BER-145 is that imitation quality matters. Blindly cloning trajectories with failed loops, hidden help, stale tool syntax, or unsupported final answers teaches the small student exactly those failures.

## 4. Web, search, and citation-grounded agent datasets

[WebGPT](https://arxiv.org/abs/2112.09332) is the closest direct precedent for BER-145: browsing demonstrations collect references and produce citation-backed answers, and training uses demonstration plus rejection/preference signals. [ReAct](https://arxiv.org/abs/2210.03629) supplies the natural trace grammar: visible reasoning summary, action, observation, next action, and final answer. For BER-145, the trace should be rendered as a student-visible sequence such as: task/caps, short plan, web_search call, canonical search observation, fetch_content call, canonical evidence observation, optional refinement search, and final cited answer.

Web-agent benchmarks also inform split design and failure cases. [Mind2Web](https://arxiv.org/abs/2306.06070), [WebShop](https://arxiv.org/abs/2207.01206), [WebArena](https://arxiv.org/abs/2307.13854), [WebVoyager](https://arxiv.org/abs/2401.13919), and [AutoWebGLM](https://arxiv.org/abs/2404.03648) all stress the gap between static text tasks and realistic web interaction. BER-145 does not need to clone DOM/browser actions, but it should adopt their held-out-domain discipline, observation compression lessons, and recovery/failure taxonomies.

Citation-grounded generation needs its own filters. [ALCE](https://arxiv.org/abs/2305.14627) evaluates citation support for long-form answers, which maps directly to BER-145's fetched/cited overlap and claim-support checks. Later RL can explore search behavior with outcome/retrieval rewards, as in [Search-R1](https://arxiv.org/abs/2503.09516), but SFT-0 should first make the model reliably emit valid tool syntax, respect caps, fetch before citing, and produce concise grounded answers.

## 5. Teacher-student distillation and process imitation

The strongest teacher-student pattern for BER-145 is **frontier teacher process distillation with execution filters**. [Distilling Step-by-Step](https://arxiv.org/abs/2305.02301) shows that rationales from larger models can improve smaller models' data efficiency, while [ToolLLM](https://arxiv.org/abs/2307.16789), [FireAct](https://arxiv.org/abs/2310.05915), [AgentTuning](https://arxiv.org/abs/2310.12823), [WebGPT](https://arxiv.org/abs/2112.09332), [Toolformer](https://arxiv.org/abs/2302.04761), and [Gorilla](https://arxiv.org/abs/2305.15334) show complementary ways to convert tool-using behavior into trainable traces.

For BER-145, process imitation should mean imitating the teacher's **student-visible contract**, not the teacher's private cognition. The target sequence is visible instruction, allowed tool call, observed tool result, concise evidence-bearing reasoning summary, and final answer. Provider-hidden thinking, chain-of-thought scratchpads, controller notes, or planner interventions are not valid policy targets. If a controller helped generate a trajectory, either replay it cleanly through a teacher under the exact student contract or label it as diagnostic/contrastive data rather than a positive SFT trace.

QLoRA is a practical training mechanism for small-to-mid models rather than a data recipe. If BER-145 fine-tunes Qwen3-30B-A3B with LoRA/QLoRA-style efficiency, [QLoRA](https://arxiv.org/abs/2309.08632) supports doing so under limited memory, but data cleanliness, loss masks, and split isolation remain the primary success factors.

## 6. Risks and failure modes

Synthetic data can degrade a model if generated data recursively replaces real/gold data. The Nature model-collapse result shows loss of distribution tails under recursive generated-data training ([Shumailov et al.](https://www.nature.com/articles/s41586-024-07566-y)), while follow-up work suggests that accumulating real data alongside synthetic data can mitigate collapse under some settings ([Gerstgrasser et al.](https://arxiv.org/abs/2404.01413)). BER-145 should therefore preserve seed/gold traces, log synthetic lineage, keep real deployment-like traces separate, and avoid training future generations only on previous model outputs.

Proxy overoptimization is the second major risk. A single judge score, citation count, or source-count metric can be gamed, and reward-model overoptimization work shows that pushing a learned proxy too hard can reduce true quality ([Gao et al.](https://arxiv.org/abs/2210.10760)). BER-145 should use multiple gates: deterministic replay/citation/cap checks, source-quality checks, judge scoring, diversity caps, and human spot audits.

Reasoning contamination is the third risk. Chain-of-thought can be unfaithful to actual model behavior ([Turpin et al.](https://arxiv.org/abs/2305.04388)), and Anthropic reports that reasoning models' verbalized chains do not always disclose important causal factors ([Anthropic](https://www.anthropic.com/research/reasoning-models-dont-say-think)). BER-145 should not train on hidden/provider thinking. It should supervise visible, concise plans and evidence summaries only when they are canonicalized and paired with verifiable actions/evidence.

Contamination and leakage are fourth. Benchmark contamination can inflate evaluation and hide regressions ([Deng et al.](https://arxiv.org/abs/2311.09783), [open contamination report](https://arxiv.org/abs/2310.17589)). BER-145 must generate from train split only, quarantine validation/test prompts and rubrics, and hash prompt/source/fetched-content/rubric artifacts.

Finally, synthetic traces can carry unsafe latent behaviors or shortcuts. [Sleeper Agents](https://arxiv.org/abs/2401.05566) is not a web-research dataset paper, but it is a useful warning: do not assume SFT/RL removes hidden triggers or deceptive strategies. Reject traces with hidden policy references, benchmark hints, trigger-like conditions, fabricated citations, impossible observations, or controller-only affordances.

## 7. Concrete BER-145 data-generation protocol

### 7.1 Dataset stages

**Stage 0: renderer and validator smoke set (100-200 accepted traces).** Generate a small set only from train prompts. Use Opus best-of-N, run all hard filters, replay traces, produce loss masks, and run a tiny SFT smoke test. Success criteria: zero schema/render crashes, deterministic replay succeeds, no val/test hash collisions, citations validate, and a small training job consumes the data with intended masks.

**Stage 1: SFT-0 bootstrap (~1k-2k accepted traces).** After Stage 0 passes and budget is approved, scale generation to about 1k-2k accepted zero-intervention Opus traces. This reconciles the earlier 100-200 idea with the worker recommendation: 100-200 is a pipeline validation size; 1k-2k is the first plausible policy-learning bootstrap for a small research agent.

**Stage 2: main SFT expansion.** Expand only after held-out train-dev eval improves. Add diversity along topic family, source domain, answerability, recency, conflict, source quality, cap pressure, and recovery behavior. Preserve a general-instruction regression anchor if needed, but do not mix in generic instruction data that changes the tool contract.

**Stage 3: RL readiness.** Move to GRPO/RL only after the student reliably emits valid tool calls, respects caps, fetches before citing, and produces grounded final answers. RL should use verifiable components such as citation validity, fetched/cited overlap, source quality, and rubric score, not opaque judge reward alone.

### 7.2 Generation loop

For each train prompt:

1. Sample N Opus teacher trajectories under the exact BER-145 prompt, caps, tool schema, and observation renderer.
2. Store raw candidate metadata separately from supervised text: teacher model, date, prompt hash, split, cap profile, tool-call list, fetched-content hashes, final answer, source list, and validator results.
3. Run deterministic validators: cap compliance, allowed tools, schema validity, replayability, citation support, source tier, no secrets, no hidden thinking, no leakage, dedupe/diversity.
4. Optionally run an LLM judge only on candidates that passed hard gates; score coverage, synthesis, source quality, concision, and failure/uncertainty handling.
5. Keep the best accepted candidate per prompt/source-family bucket, subject to diversity caps; retain rejects for diagnostics, not positive SFT.
6. Render the accepted trace into policy training format and a separate metadata/auxiliary record.

### 7.3 Zero-intervention vs controller-assisted traces

Main policy SFT should include **zero-intervention clean traces only**: the teacher/student-visible messages and tools must be enough to reproduce the behavior. Controller-assisted traces should be handled in one of three ways:

- **Diagnostic only:** use them to identify failure modes and generate new prompts.
- **Candidate generation:** use controller-assisted output to design a clean prompt or expected source set, then ask the teacher to produce a fresh zero-intervention demonstration.
- **Negative/contrastive data:** label them explicitly as examples of over-budget loops, unsupported citations, or hidden assistance, if the training method supports contrastive/negative supervision.

They should not be included as positive next-token targets while hiding the controller, because that trains the student on behavior it cannot causally produce.

### 7.4 SFT-A/B invariant

SFT-A and SFT-B must use the **same exact policy trajectories**. B may add bounded/canonical observation auxiliary records, such as structured source-tier labels, evidence spans, or citation-support annotations, but the policy text, prompts, tool calls, observations, final answer, accepted example IDs, train/val/test split, and loss masks should remain identical. If B uses different trajectories, the comparison no longer isolates the observation auxiliary.

### 7.5 Loss masking

Policy loss should include student-visible assistant text and tool-call tokens as appropriate for the target runtime. It should mask:

- provider-hidden thinking;
- raw tool observations unless intentionally training an observation reconstruction auxiliary;
- metadata fields, validator labels, judge scores, hashes, and split labels;
- controller messages or planner interventions;
- any hidden chain-of-thought captured by the provider or harness.

Visible reasoning, if included, should be short and canonical: plan, evidence decision, source-quality note, or uncertainty statement. It should not be a raw private scratchpad.

## Implementation checklist for BER-145

- [ ] Create train-only prompt pool; freeze validation/test and hash all eval artifacts.
- [ ] Define exact web_search/fetch_content schema, cap profile, observation renderer, and final-answer citation format.
- [ ] Generate 100-200 accepted Opus best-of-N clean traces for pipeline smoke.
- [ ] Run hard validators before judge scoring.
- [ ] Store provenance and lineage for every candidate and reject.
- [ ] Verify replay from stored calls/observations.
- [ ] Confirm loss masks exclude hidden reasoning, raw observations, controller notes, metadata, and eval labels.
- [ ] Run SFT smoke and held-out train-dev eval.
- [ ] Scale to 1k-2k accepted clean traces only after renderer/filters/training pipeline are stable and budget is approved.
- [ ] Keep controller-assisted traces outside positive policy SFT unless replayed cleanly or labeled contrastively.

## Confidence and gaps

**Confidence: medium-high.** The recommendation is supported by many primary papers and official dataset sources across synthetic instruction tuning, data filtering, tool-use datasets, web-agent datasets, distillation, and risk literature. The strongest evidence is directional rather than BER-145-specific: WebGPT, ToolBench, ReAct, ALCE, Self-Instruct, LIMA, AlpaGasus, STaR, and Distilling Step-by-Step all support pieces of the protocol, but no single paper exactly studies a small Qwen-style student trained on capped single-question web_search/fetch_content research-agent episodes.

**Coverage gap.** The worker/planner environment reported unavailable `web_search` providers during the research fan-out. Coverage therefore used direct primary-source fetches, arXiv/API refinement, official dataset cards/repos, and worker evidence bundles rather than broad general web search. Source coverage is strong for the named primary papers and datasets in the task, but it is not exhaustive over every recent SFT-data-generation paper.

**Empirical gap.** The exact accepted-trace count, best-of-N value, judge threshold, and SFT-A/B auxiliary design must be tuned on BER-145 held-out train-dev evaluations. The 100-200 smoke set and 1k-2k SFT-0 target are evidence-backed starting points, not final hyperparameters.

**Operational gap.** Licensing/access terms for any reused public datasets still need review. The safest path is to generate BER-145-owned traces from train prompts, cite public datasets as design precedents, and avoid copying their examples into the training set unless licenses and contamination constraints are cleared.
