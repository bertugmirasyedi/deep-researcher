import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StageRunner } from './stage-runner';
import {
  DiscoveryMapSchema,
  DraftReportSchema,
  FinalReportSchema,
  ResearchPlanSchema,
  ReviewControllerDecisionSchema,
  ReviewResultSchema,
  SubquestionFindingSchema,
  type DiscoveryMap,
  type DraftReport,
  type FinalReport,
  type ResearchInput,
  type ResearchPlan,
  type ResearchTaskPayload,
  type ReviewControllerDecision,
  type ReviewDecision,
  type ReviewResult,
  type SubquestionFinding,
} from './schemas';

const BASE_FIXTURE = 'agent-frameworks';
const KNOWN_FIXTURES = new Set([BASE_FIXTURE, 'agent-frameworks-adaptive-review']);

export class FixtureStageRunner implements StageRunner {
  private readonly discovery: DiscoveryMap;
  private readonly plan: ResearchPlan;
  private readonly findings: SubquestionFinding[];
  private readonly draft: DraftReport;
  private readonly reviews: ReviewResult[];
  private readonly controllerDecisions: ReviewControllerDecision[];
  private readonly reviewsAfterAdditionalResearch?: ReviewResult[];
  private readonly final: FinalReport;

  constructor(name: string) {
    if (!KNOWN_FIXTURES.has(name)) {
      throw new Error(`unknown_fixture:${name}`);
    }

    this.discovery = DiscoveryMapSchema.parse(readFixture(name, 'discovery.json'));
    this.plan = ResearchPlanSchema.parse(readFixture(name, 'plan.json'));
    this.findings = SubquestionFindingSchema.array().parse(readFixture(name, 'findings.json'));
    this.draft = DraftReportSchema.parse(readFixture(name, 'draft.json'));
    this.reviews = ReviewResultSchema.array().parse(readFixture(name, 'reviews.json'));
    this.controllerDecisions = ReviewControllerDecisionSchema.array().parse(readOptionalFixture(name, 'controller-decisions.json') ?? [{
      action: 'finalize',
      round: 0,
      reason: 'fixture reviews accepted',
      failedReviewers: [],
      requiredActions: [],
      repairQueries: [],
      newSubQuestions: [],
      replanInstructions: [],
    }]);
    const reviewsAfterAdditionalResearch = readOptionalFixture(name, 'reviews-after-additional-research.json');
    this.reviewsAfterAdditionalResearch = reviewsAfterAdditionalResearch === undefined ? undefined : ReviewResultSchema.array().parse(reviewsAfterAdditionalResearch);
    this.final = FinalReportSchema.parse(readFixture(name, 'final.json'));
  }

  async runDiscovery(_input: ResearchInput, neutralQueries: string[]): Promise<DiscoveryMap> {
    return { ...this.discovery, neutralQueries };
  }

  async runPlanner(input: ResearchInput): Promise<ResearchPlan> {
    const quick = input.depth === 'quick';
    return {
      ...this.plan,
      depth: input.depth,
      subQuestions: this.plan.subQuestions.slice(0, quick ? 3 : 6),
      sourceMinimum: quick ? 5 : 30,
      targetSources: quick ? { min: 5, max: 12 } : this.plan.targetSources,
    };
  }

  async runResearcher(payload: ResearchTaskPayload): Promise<SubquestionFinding> {
    const finding = this.findings.find((candidate) => candidate.subQuestionId === payload.subQuestion.id);
    if (!finding) {
      throw new Error(`fixture_missing_finding:${payload.subQuestion.id}`);
    }
    return finding;
  }

  async runWriter(): Promise<DraftReport> {
    return this.draft;
  }

  async runCoverageReview(_input: ResearchInput, _discovery: DiscoveryMap, _plan: ResearchPlan, _draft: DraftReport, findings: SubquestionFinding[]): Promise<ReviewResult> {
    return this.reviewFor('coverage', findings);
  }

  async runBiasReview(_input: ResearchInput, _discovery: DiscoveryMap, _plan: ResearchPlan, _draft: DraftReport, findings: SubquestionFinding[]): Promise<ReviewResult> {
    return this.reviewFor('bias', findings);
  }

  async runCitationReview(_input: ResearchInput, _discovery: DiscoveryMap, _plan: ResearchPlan, _draft: DraftReport, findings: SubquestionFinding[]): Promise<ReviewResult> {
    return this.reviewFor('citation', findings);
  }

  async runReviewController(_input: ResearchInput, _discovery: DiscoveryMap, _plan: ResearchPlan, _draft: DraftReport, _findings: SubquestionFinding[], _reviewResults: ReviewResult[], round: number): Promise<ReviewControllerDecision> {
    return this.controllerDecisions.find((decision) => decision.round === round) ?? ReviewControllerDecisionSchema.parse({
      action: 'finalize',
      round,
      reason: 'fixture reviews accepted',
      failedReviewers: [],
      requiredActions: [],
      repairQueries: [],
      newSubQuestions: [],
      replanInstructions: [],
    });
  }

  async runReplanner(): Promise<ResearchPlan> {
    throw new Error('fixture_unexpected_replan');
  }

  async runRepair(_input: ResearchInput, _discovery: DiscoveryMap, _plan: ResearchPlan, _draft: DraftReport, _findings: SubquestionFinding[], decision: ReviewDecision): Promise<SubquestionFinding | null> {
    if (decision.needsRepair === false) {
      return null;
    }
    throw new Error('fixture_unexpected_repair');
  }

  async runFinalWriter(input: ResearchInput, _discovery: DiscoveryMap, _plan: ResearchPlan, findings: SubquestionFinding[]): Promise<FinalReport> {
    const reviews = this.reviewSetFor(findings);
    return {
      ...this.final,
      topic: input.topic,
      depth: input.depth,
      format: input.format,
      outputPath: '',
      reviewResults: reviews,
    };
  }

  private reviewFor(reviewer: ReviewResult['reviewer'], findings: SubquestionFinding[]): ReviewResult {
    const review = this.reviewSetFor(findings).find((candidate) => candidate.reviewer === reviewer);
    if (!review) {
      throw new Error(`fixture_missing_review:${reviewer}`);
    }
    return review;
  }

  private reviewSetFor(findings: SubquestionFinding[]): ReviewResult[] {
    if (this.reviewsAfterAdditionalResearch !== undefined && findings.some((finding) => finding.subQuestionId === 'SQ4')) {
      return this.reviewsAfterAdditionalResearch;
    }
    return this.reviews;
  }
}

function readFixture(name: string, file: string): unknown {
  const result = readOptionalFixture(name, file);
  if (result === undefined) {
    throw new Error(`fixture_missing_file:${name}/${file}`);
  }
  return result;
}

function readOptionalFixture(name: string, file: string): unknown | undefined {
  const bundleDir = dirname(fileURLToPath(import.meta.url));
  const roots = [
    process.env.MASTRA_PROJECT_ROOT,
    process.cwd(),
    join(process.cwd(), '..'),
    join(process.cwd(), '..', '..'),
    bundleDir,
    join(bundleDir, '..'),
    join(bundleDir, '..', '..'),
  ].filter((root): root is string => root !== undefined);

  const sourceNames = name === BASE_FIXTURE ? [name] : [name, BASE_FIXTURE];

  for (const fixtureName of sourceNames) {
    for (const root of roots) {
      const sourcePath = join(root, 'src', 'research-runner', '__fixtures__', fixtureName, file);
      if (existsSync(sourcePath)) {
        return JSON.parse(readFileSync(sourcePath, 'utf8'));
      }
    }
  }

  for (const fixtureName of sourceNames) {
    try {
      const bundledUrl = new URL(`./__fixtures__/${fixtureName}/${file}`, import.meta.url);
      return JSON.parse(readFileSync(bundledUrl, 'utf8'));
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }
  }

  return undefined;
}
