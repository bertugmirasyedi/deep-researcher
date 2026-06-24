import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { writeReportArchive } from './archive';
import { findCitationAuditFailures } from './citation-audit';
import { buildNeutralDiscoveryQueries } from './discovery';
import { FixtureStageRunner } from './fixtures';
import { validatePlanAgainstDiscovery, validateSubQuestionsAgainstDiscovery } from './plan-validation';
import {
  AdaptiveReviewCycleStateSchema,
  DiscoveryMapSchema,
  DraftReportSchema,
  FinalReportSchema,
  ResearchInputSchema,
  ResearchPlanSchema,
  ResearchTaskPayloadSchema,
  ReviewControllerDecisionSchema,
  ReviewDecisionSchema,
  ReviewResultSchema,
  SubquestionFindingSchema,
  WorkflowStateSchema,
  type AdaptiveReviewCycleState,
  type DiscoveryMap,
  type DraftReport,
  type FinalReport,
  type ResearchInput,
  type ResearchPlan,
  type ReviewControllerDecision,
  type ReviewResult,
  type SubQuestion,
  type SubquestionFinding,
  type WorkflowState,
} from './schemas';
import { OmpAcpStageRunner, type StageRunner } from './stage-runner';

const reviewParallelOutputSchema = z.object({
  'coverage-review': ReviewResultSchema,
  'bias-review': ReviewResultSchema,
  'citation-review': ReviewResultSchema,
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
      return runnerForInput(input).runCoverageReview(input, requireStateValue(state.discovery, 'discovery'), requireStateValue(state.plan, 'plan'), inputData, normalizeFindings(state.findings ?? []));
    },
  });

  const biasReview = createStep({
    id: 'bias-review',
    inputSchema: DraftReportSchema,
    outputSchema: ReviewResultSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state }) => {
      const input = requireStateValue(state.input, 'input');
      return runnerForInput(input).runBiasReview(input, requireStateValue(state.discovery, 'discovery'), requireStateValue(state.plan, 'plan'), inputData, normalizeFindings(state.findings ?? []));
    },
  });

  const citationReview = createStep({
    id: 'citation-review',
    inputSchema: DraftReportSchema,
    outputSchema: ReviewResultSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state }) => {
      const input = requireStateValue(state.input, 'input');
      return runnerForInput(input).runCitationReview(input, requireStateValue(state.discovery, 'discovery'), requireStateValue(state.plan, 'plan'), inputData, normalizeFindings(state.findings ?? []));
    },
  });

  const prepareAdaptiveReviewCycle = createStep({
    id: 'prepare-adaptive-review-cycle',
    inputSchema: reviewParallelOutputSchema,
    outputSchema: AdaptiveReviewCycleStateSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state, setState }) => {
      const draft = requireStateValue(state.draft, 'draft');
      const reviewResults = [
        ReviewResultSchema.parse(inputData['coverage-review']),
        ReviewResultSchema.parse(inputData['bias-review']),
        ReviewResultSchema.parse(inputData['citation-review']),
      ];
      await setState({ ...state, reviewResults });
      return AdaptiveReviewCycleStateSchema.parse({
        findings: normalizeFindings(state.findings ?? []),
        draft,
        reviewResults,
        controllerDecisions: [],
        iteration: 0,
        complete: false,
        repairApplied: false,
      });
    },
  });

  const adaptiveReviewCycle = createStep({
    id: 'adaptive-review-cycle',
    inputSchema: AdaptiveReviewCycleStateSchema,
    outputSchema: AdaptiveReviewCycleStateSchema,
    stateSchema: WorkflowStateSchema,
    execute: async ({ inputData, state, setState }) => {
      const input = requireStateValue(state.input, 'input');
      const discovery = requireStateValue(state.discovery, 'discovery');
      let plan = requireStateValue(state.plan, 'plan');
      let draft = inputData.draft;
      let findings = normalizeFindings(inputData.findings);
      let reviewResults = normalizeReviewResults(inputData.reviewResults);
      let repairFinding: SubquestionFinding | undefined;
      let repairApplied = inputData.repairApplied;
      const runner = runnerForInput(input);
      const rawDecision = await runner.runReviewController(input, discovery, plan, draft, findings, reviewResults, inputData.iteration);
      let decision = ReviewControllerDecisionSchema.parse(rawDecision);

      if (inputData.iteration >= input.maxReviewRepairRounds && decision.action !== 'finalize') {
        decision = ReviewControllerDecisionSchema.parse({
          ...decision,
          action: 'finalize',
          reason: `max_review_rounds_reached; ${decision.reason}`,
          newSubQuestions: [],
          replanInstructions: [],
        });
      }

      const controllerDecisions = [...(state.controllerDecisions ?? []), decision];

      if (decision.action === 'finalize') {
        await setState({ ...state, findings, draft, reviewResults, controllerDecisions });
        return AdaptiveReviewCycleStateSchema.parse({ ...inputData, findings, draft, reviewResults, controllerDecisions, complete: true, repairApplied });
      }

      if (decision.action === 'targeted_repair') {
        const repairDecision = ReviewDecisionSchema.parse({
          needsRepair: true,
          reviewResults,
          repairQueries: decision.repairQueries,
          repairReason: decision.requiredActions.join('; ') || decision.reason,
        });
        const maybeRepairFinding = await runner.runRepair(input, discovery, plan, draft, findings, repairDecision);
        if (maybeRepairFinding !== null) {
          repairFinding = maybeRepairFinding;
          findings = [...findings, maybeRepairFinding];
          repairApplied = true;
        }
      } else if (decision.action === 'additional_research') {
        if (decision.newSubQuestions.length === 0) {
          throw new Error('review_controller_missing_subquestions');
        }
        const errors = validateSubQuestionsAgainstDiscovery(decision.newSubQuestions, discovery);
        if (errors.length > 0) {
          throw new Error(`review_controller_failed_discovery_validation:${errors.join('; ')}`);
        }
        ensureNoDuplicateSubQuestionIds(plan, decision.newSubQuestions);
        plan = ResearchPlanSchema.parse({ ...plan, subQuestions: [...plan.subQuestions, ...decision.newSubQuestions] });
        const newFindings = await Promise.all(decision.newSubQuestions.map((subQuestion) => runner.runResearcher({ input, discovery, plan, subQuestion })));
        findings = [...findings, ...newFindings];
      } else if (decision.action === 'replan') {
        if (decision.replanInstructions.length === 0) {
          throw new Error('review_controller_missing_replan_instructions');
        }
        const nextPlan = await runner.runReplanner(input, discovery, plan, findings, reviewResults, decision);
        const errors = validatePlanAgainstDiscovery(nextPlan, discovery);
        if (errors.length > 0) {
          throw new Error(`plan_failed_discovery_validation:${errors.join('; ')}`);
        }
        assertReplanDoesNotMutateResearchedSubquestions(plan, nextPlan, findings);
        const existingFindingIds = new Set(findings.map((finding) => finding.subQuestionId));
        const subQuestionsToResearch = nextPlan.subQuestions.filter((subQuestion) => !existingFindingIds.has(subQuestion.id));
        plan = nextPlan;
        const newFindings = await Promise.all(subQuestionsToResearch.map((subQuestion) => runner.runResearcher({ input, discovery, plan, subQuestion })));
        findings = [...findings, ...newFindings];
      }

      draft = await runner.runWriter(input, discovery, plan, findings);
      reviewResults = await runAllReviews(runner, input, discovery, plan, draft, findings);

      const nextState: WorkflowState = WorkflowStateSchema.parse({
        ...state,
        plan,
        findings,
        draft,
        reviewResults,
        controllerDecisions,
        repairFinding: repairFinding ?? state.repairFinding,
      });
      await setState(nextState);

      return AdaptiveReviewCycleStateSchema.parse({
        findings,
        draft,
        reviewResults,
        controllerDecisions,
        iteration: inputData.iteration + 1,
        complete: false,
        repairApplied,
      });
    },
  });

  const finalReport = createStep({
    id: 'final-report',
    inputSchema: AdaptiveReviewCycleStateSchema,
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
    .then(prepareAdaptiveReviewCycle)
    .dountil(adaptiveReviewCycle, async ({ inputData, state }) => {
      const workflowState = WorkflowStateSchema.parse(state);
      const input = requireStateValue(workflowState.input, 'input');
      return inputData.complete || inputData.iteration >= input.maxReviewRepairRounds;
    })
    .then(finalReport)
    .then(finalAuditAndArchive)
    .commit();
}

export async function runDeepResearch(input: ResearchInput): Promise<FinalReport> {
  const stageRunner = input.fixture === undefined ? new OmpAcpStageRunner() : new FixtureStageRunner(input.fixture);
  const workflow = createDeepResearchWorkflow(stageRunner);
  const run = await workflow.createRun();
  const result = await run.start({ inputData: input, initialState: { findings: [], reviewResults: [], controllerDecisions: [] } });

  if (result.status === 'success') {
    return result.result;
  }

  if (result.status === 'failed') {
    throw result.error;
  }

  throw new Error(`workflow_not_success:${result.status}`);
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

async function runAllReviews(runner: StageRunner, input: ResearchInput, discovery: DiscoveryMap, plan: ResearchPlan, draft: DraftReport, findings: SubquestionFinding[]): Promise<ReviewResult[]> {
  const [coverage, bias, citation] = await Promise.all([
    runner.runCoverageReview(input, discovery, plan, draft, findings),
    runner.runBiasReview(input, discovery, plan, draft, findings),
    runner.runCitationReview(input, discovery, plan, draft, findings),
  ]);
  return [coverage, bias, citation];
}

function ensureNoDuplicateSubQuestionIds(existing: ResearchPlan, additions: SubQuestion[]): void {
  const existingIds = new Set(existing.subQuestions.map((subQuestion) => subQuestion.id));
  for (const addition of additions) {
    if (existingIds.has(addition.id)) {
      throw new Error(`review_controller_duplicate_subquestion:${addition.id}`);
    }
  }
}

function assertReplanDoesNotMutateResearchedSubquestions(oldPlan: ResearchPlan, newPlan: ResearchPlan, findings: SubquestionFinding[]): void {
  const researchedIds = new Set(findings.map((finding) => finding.subQuestionId));
  const oldById = new Map(oldPlan.subQuestions.map((subQuestion) => [subQuestion.id, subQuestion]));

  for (const nextSubQuestion of newPlan.subQuestions) {
    if (!researchedIds.has(nextSubQuestion.id)) {
      continue;
    }
    const oldSubQuestion = oldById.get(nextSubQuestion.id);
    if (oldSubQuestion === undefined) {
      continue;
    }
    const changed = oldSubQuestion.question !== nextSubQuestion.question
      || oldSubQuestion.rationale !== nextSubQuestion.rationale
      || JSON.stringify(oldSubQuestion.initialQueries) !== JSON.stringify(nextSubQuestion.initialQueries);
    if (changed) {
      throw new Error(`replan_changed_researched_subquestion_id:${nextSubQuestion.id}`);
    }
  }
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
