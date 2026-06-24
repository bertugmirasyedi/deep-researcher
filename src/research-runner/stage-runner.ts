import { z } from 'zod';
import { runOmpJsonAgent } from './omp-acp';
import {
  COVERAGE_REVIEW_SYSTEM_PROMPT,
  BIAS_REVIEW_SYSTEM_PROMPT,
  CITATION_AUDIT_SYSTEM_PROMPT,
  DISCOVERY_SYSTEM_PROMPT,
  FINAL_WRITER_SYSTEM_PROMPT,
  PLANNER_SYSTEM_PROMPT,
  REPAIR_SYSTEM_PROMPT,
  RESEARCHER_SYSTEM_PROMPT,
  WRITER_SYSTEM_PROMPT,
} from './prompts';
import {
  DiscoveryMapSchema,
  DraftReportSchema,
  FinalReportSchema,
  ResearchPlanSchema,
  ReviewResultSchema,
  SubquestionFindingSchema,
  type DiscoveryMap,
  type DraftReport,
  type FinalReport,
  type ResearchInput,
  type ResearchPlan,
  type ResearchTaskPayload,
  type ReviewDecision,
  type ReviewResult,
  type SubquestionFinding,
} from './schemas';

export const STAGE_MODEL_CONFIG = {
  discovery: { model: 'openai-codex/gpt-5.5', thinkingLevel: 'minimal' },
  planner: { model: 'openai-codex/gpt-5.5', thinkingLevel: 'medium' },
  researcher: { model: 'openai-codex/gpt-5.5', thinkingLevel: 'minimal' },
  writer: { model: 'openai-codex/gpt-5.5', thinkingLevel: 'medium' },
  coverageReview: { model: 'openai-codex/gpt-5.5', thinkingLevel: 'medium' },
  biasReview: { model: 'openai-codex/gpt-5.5', thinkingLevel: 'medium' },
  citationReview: { model: 'openai-codex/gpt-5.5', thinkingLevel: 'medium' },
  repair: { model: 'openai-codex/gpt-5.5', thinkingLevel: 'minimal' },
  finalWriter: { model: 'openai-codex/gpt-5.5', thinkingLevel: 'medium' },
} as const;

export interface StageRunner {
  runDiscovery(input: ResearchInput, neutralQueries: string[]): Promise<DiscoveryMap>;
  runPlanner(input: ResearchInput, discovery: DiscoveryMap): Promise<ResearchPlan>;
  runResearcher(payload: ResearchTaskPayload): Promise<SubquestionFinding>;
  runWriter(input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, findings: SubquestionFinding[]): Promise<DraftReport>;
  runCoverageReview(input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, draft: DraftReport, findings: SubquestionFinding[]): Promise<ReviewResult>;
  runBiasReview(input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, draft: DraftReport, findings: SubquestionFinding[]): Promise<ReviewResult>;
  runCitationReview(input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, draft: DraftReport, findings: SubquestionFinding[]): Promise<ReviewResult>;
  runRepair(input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, draft: DraftReport, findings: SubquestionFinding[], decision: ReviewDecision): Promise<SubquestionFinding | null>;
  runFinalWriter(input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, findings: SubquestionFinding[], draft: DraftReport, reviews: ReviewResult[]): Promise<FinalReport>;
}

export class OmpAcpStageRunner implements StageRunner {
  constructor(private readonly cwd?: string) {}

  async runDiscovery(input: ResearchInput, neutralQueries: string[]): Promise<DiscoveryMap> {
    return runOmpJsonAgent({
      ...STAGE_MODEL_CONFIG.discovery,
      id: 'discovery-scan',
      name: 'Discovery Scan',
      description: 'Neutral source discovery over OMP ACP',
      cwd: this.cwd,
      systemPrompt: DISCOVERY_SYSTEM_PROMPT,
      userPrompt: `Topic: ${input.topic}
Depth: ${input.depth}
Date: ${input.dateIso ?? new Date().toISOString()}
Neutral queries, exact strings to run:
${neutralQueries.map((query) => `- ${query}`).join('\n')}

Use only these neutral queries. Do not run named-entity queries unless the entity name already appears in the user topic. Read promising search results and return a DiscoveryMap with evidence-grounded entities, dimensions, source reads, and gaps.`,
      schema: DiscoveryMapSchema,
      schemaName: 'DiscoveryMap',
    });
  }

  async runPlanner(input: ResearchInput, discovery: DiscoveryMap): Promise<ResearchPlan> {
    return runOmpJsonAgent({
      ...STAGE_MODEL_CONFIG.planner,
      id: 'evidence-grounded-plan',
      name: 'Evidence Grounded Planner',
      description: 'Plans only from DiscoveryMap evidence',
      cwd: this.cwd,
      systemPrompt: PLANNER_SYSTEM_PROMPT,
      userPrompt: `Input:
${JSON.stringify(input, null, 2)}

DiscoveryMap:
${JSON.stringify(discovery, null, 2)}

Do not use live web search. Do not add entities outside DiscoveryMap.entities. For deep depth produce six to eight subquestions; for quick depth produce exactly three.`,
      schema: ResearchPlanSchema,
      schemaName: 'ResearchPlan',
    });
  }

  async runResearcher(payload: ResearchTaskPayload): Promise<SubquestionFinding> {
    const requiredFullReads = payload.input.depth === 'deep' ? 4 : 2;
    return runOmpJsonAgent({
      ...STAGE_MODEL_CONFIG.researcher,
      id: `research-${payload.subQuestion.id.toLowerCase()}`,
      name: `Research ${payload.subQuestion.id}`,
      description: 'Subquestion research over OMP ACP',
      cwd: this.cwd,
      systemPrompt: RESEARCHER_SYSTEM_PROMPT,
      userPrompt: `Original topic: ${payload.input.topic}
Required source count: ${payload.plan.sourceMinimum}
Required full reads for this subquestion: ${requiredFullReads}
Refinement requirement: run one refinement query round seeded by first-round evidence.

DiscoveryMap:
${JSON.stringify(payload.discovery, null, 2)}

SubQuestion:
${JSON.stringify(payload.subQuestion, null, 2)}

Return low confidence with explicit gaps if source coverage cannot be met; do not throw or fabricate sources.`,
      schema: SubquestionFindingSchema,
      schemaName: 'SubquestionFinding',
    });
  }

  async runWriter(input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, findings: SubquestionFinding[]): Promise<DraftReport> {
    return runOmpJsonAgent({
      ...STAGE_MODEL_CONFIG.writer,
      id: 'draft-report',
      name: 'Draft Report Writer',
      description: 'Writes sourced draft report',
      cwd: this.cwd,
      systemPrompt: WRITER_SYSTEM_PROMPT,
      userPrompt: `Input:
${JSON.stringify(input, null, 2)}

DiscoveryMap:
${JSON.stringify(discovery, null, 2)}

ResearchPlan:
${JSON.stringify(plan, null, 2)}

Findings:
${JSON.stringify(findings, null, 2)}

Create a DraftReport with claimMap source IDs for every factual claim.`,
      schema: DraftReportSchema,
      schemaName: 'DraftReport',
    });
  }

  async runCoverageReview(input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, draft: DraftReport, findings: SubquestionFinding[]): Promise<ReviewResult> {
    return this.runReview('coverage', COVERAGE_REVIEW_SYSTEM_PROMPT, STAGE_MODEL_CONFIG.coverageReview, input, discovery, plan, draft, findings);
  }

  async runBiasReview(input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, draft: DraftReport, findings: SubquestionFinding[]): Promise<ReviewResult> {
    return this.runReview('bias', BIAS_REVIEW_SYSTEM_PROMPT, STAGE_MODEL_CONFIG.biasReview, input, discovery, plan, draft, findings);
  }

  async runCitationReview(input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, draft: DraftReport, findings: SubquestionFinding[]): Promise<ReviewResult> {
    return this.runReview('citation', CITATION_AUDIT_SYSTEM_PROMPT, STAGE_MODEL_CONFIG.citationReview, input, discovery, plan, draft, findings);
  }

  async runRepair(input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, draft: DraftReport, findings: SubquestionFinding[], decision: ReviewDecision): Promise<SubquestionFinding | null> {
    if (decision.needsRepair === false) {
      return null;
    }

    return runOmpJsonAgent({
      ...STAGE_MODEL_CONFIG.repair,
      id: 'repair1',
      name: 'Repair Researcher',
      description: 'Targeted repair over OMP ACP',
      cwd: this.cwd,
      systemPrompt: REPAIR_SYSTEM_PROMPT,
      userPrompt: `Synthetic subQuestionId: REPAIR1
Input:
${JSON.stringify(input, null, 2)}

DiscoveryMap:
${JSON.stringify(discovery, null, 2)}

ResearchPlan:
${JSON.stringify(plan, null, 2)}

DraftReport:
${JSON.stringify(draft, null, 2)}

Findings:
${JSON.stringify(findings, null, 2)}

ReviewDecision:
${JSON.stringify(decision, null, 2)}

Return a SubquestionFinding with subQuestionId exactly REPAIR1, addressing only failed reviewers' requiredActions and targeted queries.`,
      schema: SubquestionFindingSchema.refine((finding) => finding.subQuestionId === 'REPAIR1', 'repair finding must use subQuestionId REPAIR1'),
      schemaName: 'SubquestionFinding',
    });
  }

  async runFinalWriter(input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, findings: SubquestionFinding[], draft: DraftReport, reviews: ReviewResult[]): Promise<FinalReport> {
    return runOmpJsonAgent({
      ...STAGE_MODEL_CONFIG.finalWriter,
      id: 'final-report',
      name: 'Final Report Writer',
      description: 'Writes final report JSON',
      cwd: this.cwd,
      systemPrompt: FINAL_WRITER_SYSTEM_PROMPT,
      userPrompt: `Input:
${JSON.stringify(input, null, 2)}

DiscoveryMap:
${JSON.stringify(discovery, null, 2)}

ResearchPlan:
${JSON.stringify(plan, null, 2)}

DraftReport:
${JSON.stringify(draft, null, 2)}

Findings including repair evidence:
${JSON.stringify(findings, null, 2)}

Reviews:
${JSON.stringify(reviews, null, 2)}

Return FinalReport JSON. Preserve sourced claims, include a ## Source Inventory table, and disclose unresolved gaps.`,
      schema: FinalReportSchema,
      schemaName: 'FinalReport',
    });
  }

  private async runReview(
    reviewer: 'coverage' | 'bias' | 'citation',
    systemPrompt: string,
    modelConfig: (typeof STAGE_MODEL_CONFIG)['coverageReview'],
    input: ResearchInput,
    discovery: DiscoveryMap,
    plan: ResearchPlan,
    draft: DraftReport,
    findings: SubquestionFinding[],
  ): Promise<ReviewResult> {
    return runOmpJsonAgent({
      ...modelConfig,
      id: `${reviewer}-review`,
      name: `${reviewer} Review`,
      description: `${reviewer} review over supplied inputs`,
      cwd: this.cwd,
      systemPrompt,
      userPrompt: `Reviewer value must be exactly ${reviewer}.
Input:
${JSON.stringify(input, null, 2)}

DiscoveryMap:
${JSON.stringify(discovery, null, 2)}

ResearchPlan:
${JSON.stringify(plan, null, 2)}

DraftReport:
${JSON.stringify(draft, null, 2)}

Findings:
${JSON.stringify(findings, null, 2)}`,
      schema: ReviewResultSchema.extend({ reviewer: z.literal(reviewer) }),
      schemaName: 'ReviewResult',
    });
  }
}
