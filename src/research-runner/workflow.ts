import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { writeReportArchive } from './archive';
import { findCitationAuditFailures } from './citation-audit';
import { buildNeutralDiscoveryQueries } from './discovery';
import { FixtureStageRunner } from './fixtures';
import { validatePlanAgainstDiscovery } from './plan-validation';
import {
  DiscoveryMapSchema,
  DraftReportSchema,
  FinalReportSchema,
  ResearchInputSchema,
  ResearchPlanSchema,
  ResearchTaskPayloadSchema,
  ReviewDecisionSchema,
  ReviewResultSchema,
  SubquestionFindingSchema,
  WorkflowStateSchema,
  type DiscoveryMap,
  type DraftReport,
  type FinalReport,
  type ResearchInput,
  type ResearchPlan,
  type ReviewDecision,
  type ReviewResult,
  type SubquestionFinding,
  type WorkflowState,
} from './schemas';
import { OmpAcpStageRunner, type StageRunner } from './stage-runner';

const reviewParallelOutputSchema = z.object({
  'coverage-review': ReviewResultSchema,
  'bias-review': ReviewResultSchema,
  'citation-review': ReviewResultSchema,
});

const reviewRepairOutputSchema = z.object({
  findings: z.array(SubquestionFindingSchema),
  reviewResults: z.array(ReviewResultSchema),
  repairApplied: z.boolean(),
});

export function createDeepResearchWorkflow(stageRunner: StageRunner) {
  const runnerForInput = (input: ResearchInput): StageRunner => (
    input.fixture === undefined ? stageRunner : new FixtureStageRunner(input.fixture)
  );

  const normalizeInput = createStep({
    id: 'normalize-input',
    inputSchema: ResearchInputSchema,
    outputSchema: ResearchInputSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state, setState }) => {
      const parsed = ResearchInputSchema.parse(inputData);
      await setState({ ...state, input: parsed });
      return parsed;
    },
  });

  const discoveryScan = createStep({
    id: 'discovery-scan',
    inputSchema: ResearchInputSchema,
    outputSchema: DiscoveryMapSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state, setState }) => {
      const neutralQueries = buildNeutralDiscoveryQueries(inputData);
      const discovery = await runnerForInput(inputData).runDiscovery(inputData, neutralQueries);

      if (discovery.searchResults.length === 0) {
        throw new Error('discovery_failed_no_search_results');
      }

      if (inputData.depth === 'deep' && discovery.sourceReads.every((sourceRead) => sourceRead.readOk === false)) {
        throw new Error('discovery_failed_no_readable_sources');
      }

      await setState({ ...state, discovery });
      return discovery;
    },
  });

  const evidenceGroundedPlan = createStep({
    id: 'evidence-grounded-plan',
    inputSchema: DiscoveryMapSchema,
    outputSchema: ResearchPlanSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state, setState }) => {
      const input = requireStateValue(state.input, 'input');
      const plan = await runnerForInput(input).runPlanner(input, inputData);
      const errors = validatePlanAgainstDiscovery(plan, inputData);

      if (errors.length > 0) {
        throw new Error(`plan_failed_discovery_validation:${errors.join('; ')}`);
      }

      await setState({ ...state, plan });
      return plan;
    },
  });

  const prepareResearchTasks = createStep({
    id: 'prepare-research-tasks',
    inputSchema: ResearchPlanSchema,
    outputSchema: z.array(ResearchTaskPayloadSchema),
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state }) => {
      const input = requireStateValue(state.input, 'input');
      const discovery = requireStateValue(state.discovery, 'discovery');
      return inputData.subQuestions.map((subQuestion) => ({ input, discovery, plan: inputData, subQuestion }));
    },
  });

  const researchSubquestion = createStep({
    id: 'research-subquestion',
    inputSchema: ResearchTaskPayloadSchema,
    outputSchema: SubquestionFindingSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData }) => runnerForInput(inputData.input).runResearcher(inputData),
  });

  const draftReport = createStep({
    id: 'draft-report',
    inputSchema: z.array(SubquestionFindingSchema),
    outputSchema: DraftReportSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state, setState }) => {
      const findings = normalizeFindings(inputData);
      const input = requireStateValue(state.input, 'input');
      const discovery = requireStateValue(state.discovery, 'discovery');
      const plan = requireStateValue(state.plan, 'plan');
      const draft = await runnerForInput(input).runWriter(input, discovery, plan, findings);

      await setState({ ...state, findings, draft });
      return draft;
    },
  });

  const coverageReview = createStep({
    id: 'coverage-review',
    inputSchema: DraftReportSchema,
    outputSchema: ReviewResultSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state }) => {
      const input = requireStateValue(state.input, 'input');
      return runnerForInput(input).runCoverageReview(
        input,
        requireStateValue(state.discovery, 'discovery'),
        requireStateValue(state.plan, 'plan'),
        inputData,
        normalizeFindings(state.findings ?? []),
      );
    },
  });

  const biasReview = createStep({
    id: 'bias-review',
    inputSchema: DraftReportSchema,
    outputSchema: ReviewResultSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state }) => {
      const input = requireStateValue(state.input, 'input');
      return runnerForInput(input).runBiasReview(
        input,
        requireStateValue(state.discovery, 'discovery'),
        requireStateValue(state.plan, 'plan'),
        inputData,
        normalizeFindings(state.findings ?? []),
      );
    },
  });

  const citationReview = createStep({
    id: 'citation-review',
    inputSchema: DraftReportSchema,
    outputSchema: ReviewResultSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state }) => {
      const input = requireStateValue(state.input, 'input');
      return runnerForInput(input).runCitationReview(
        input,
        requireStateValue(state.discovery, 'discovery'),
        requireStateValue(state.plan, 'plan'),
        inputData,
        normalizeFindings(state.findings ?? []),
      );
    },
  });

  const reviewDecisionAndRepair = createStep({
    id: 'review-decision-and-repair',
    inputSchema: reviewParallelOutputSchema,
    outputSchema: reviewRepairOutputSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state, setState }) => {
      const input = requireStateValue(state.input, 'input');
      const discovery = requireStateValue(state.discovery, 'discovery');
      const plan = requireStateValue(state.plan, 'plan');
      const draft = requireStateValue(state.draft, 'draft');
      const reviewResults = [
        ReviewResultSchema.parse(inputData['coverage-review']),
        ReviewResultSchema.parse(inputData['bias-review']),
        ReviewResultSchema.parse(inputData['citation-review']),
      ];
      const decision = createReviewDecision(reviewResults, input.maxReviewRepairRounds);
      let findings = normalizeFindings(state.findings ?? []);
      let repairApplied = false;
      const nextState: WorkflowState = WorkflowStateSchema.parse({ ...state, reviewResults });

      if (decision.needsRepair) {
        const repairFinding = await runnerForInput(input).runRepair(input, discovery, plan, draft, findings, decision);
        if (repairFinding !== null) {
          findings = [...findings, repairFinding];
          nextState.repairFinding = repairFinding;
          nextState.findings = findings;
          repairApplied = true;
        }
      }

      await setState(nextState);
      return { findings, reviewResults, repairApplied };
    },
  });

  const finalReport = createStep({
    id: 'final-report',
    inputSchema: reviewRepairOutputSchema,
    outputSchema: FinalReportSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ state }) => {
      const input = requireStateValue(state.input, 'input');
      return runnerForInput(input).runFinalWriter(
        input,
        requireStateValue(state.discovery, 'discovery'),
        requireStateValue(state.plan, 'plan'),
        normalizeFindings(state.findings ?? []),
        requireStateValue(state.draft, 'draft'),
        normalizeReviewResults(state.reviewResults ?? []),
      );
    },
  });

  const finalAuditAndArchive = createStep({
    id: 'final-audit-and-archive',
    inputSchema: FinalReportSchema,
    outputSchema: FinalReportSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state }) => {
      const input = requireStateValue(state.input, 'input');
      const findings = normalizeFindings(state.findings ?? []);
      const sourcesConsulted = new Set(findings.flatMap((finding) => finding.sources.map((source) => source.id))).size;
      const sourceMinimumMet = sourcesConsulted >= (input.depth === 'quick' ? 5 : 30);
      const deterministicFailures = findCitationAuditFailures(inputData);
      const reviewResults = normalizeReviewResults(state.reviewResults ?? []);
      let reviewStatus: FinalReport['reviewStatus'];
      if (deterministicFailures.length > 0) {
        reviewStatus = 'failed';
      } else if (reviewResults.every((review) => review.passed) && sourceMinimumMet) {
        reviewStatus = 'passed';
      } else {
        reviewStatus = 'passed_with_disclosed_gaps';
      }
      const markdown = ensureWorkflowHeaders(inputData.markdown, reviewStatus);
      const outputPath = writeReportArchive({ topic: inputData.topic, markdown }, input.dateIso ?? new Date().toISOString());

      return FinalReportSchema.parse({
        ...inputData,
        markdown,
        outputPath,
        sourcesConsulted,
        sourceMinimumMet,
        reviewStatus,
        reviewResults,
      });
    },
  });

  return createWorkflow({
    id: 'deep-researcher-mastra-omp-acp',
    inputSchema: ResearchInputSchema,
    outputSchema: FinalReportSchema,
  })
    .then(normalizeInput)
    .then(discoveryScan)
    .then(evidenceGroundedPlan)
    .then(prepareResearchTasks)
    .foreach(researchSubquestion, { concurrency: 4 })
    .then(draftReport)
    .parallel([coverageReview, biasReview, citationReview])
    .then(reviewDecisionAndRepair)
    .then(finalReport)
    .then(finalAuditAndArchive)
    .commit();
}

export async function runDeepResearch(input: ResearchInput): Promise<FinalReport> {
  const stageRunner = input.fixture === undefined ? new OmpAcpStageRunner() : new FixtureStageRunner(input.fixture);
  const workflow = createDeepResearchWorkflow(stageRunner);
  const run = await workflow.createRun();
  const result = await run.start({ inputData: input, initialState: { findings: [], reviewResults: [] } });

  if (result.status === 'success') {
    return result.result;
  }

  if (result.status === 'failed') {
    throw result.error;
  }

  throw new Error(`workflow_not_success:${result.status}`);
}

function createReviewDecision(reviewResults: ReviewResult[], maxReviewRepairRounds: number): ReviewDecision {
  const failedReviews = reviewResults.filter((review) => !review.passed);
  const repairQueries = [...new Set(failedReviews.flatMap((review) => review.targetedQueries))];

  return ReviewDecisionSchema.parse({
    needsRepair: failedReviews.length > 0 && maxReviewRepairRounds > 0,
    reviewResults,
    repairQueries,
    repairReason: failedReviews.length > 0 ? failedReviews.flatMap((review) => review.requiredActions).join('; ') : undefined,
  });
}

function normalizeFindings(value: unknown): SubquestionFinding[] {
  return z.array(SubquestionFindingSchema).parse(value);
}

function normalizeReviewResults(value: unknown): ReviewResult[] {
  return z.array(ReviewResultSchema).parse(value);
}

function requireStateValue<T>(value: T | undefined, name: 'input'): ResearchInput;
function requireStateValue<T>(value: T | undefined, name: 'discovery'): DiscoveryMap;
function requireStateValue<T>(value: T | undefined, name: 'plan'): ResearchPlan;
function requireStateValue<T>(value: T | undefined, name: 'draft'): DraftReport;
function requireStateValue<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(`workflow_state_missing:${name}`);
  }
  return value;
}

function ensureWorkflowHeaders(markdown: string, reviewStatus: FinalReport['reviewStatus']): string {
  const requiredHeaders = [
    'Workflow: mastra-omp-acp',
    'Discovery-first plan: yes',
    `Review status: ${reviewStatus}`,
  ];
  const body = markdown
    .split('\n')
    .filter((line) => !line.startsWith('Workflow: ') && !line.startsWith('Discovery-first plan: ') && !line.startsWith('Review status: '))
    .join('\n')
    .trimStart();

  return `${requiredHeaders.join('\n')}\n\n${body}`;
}
