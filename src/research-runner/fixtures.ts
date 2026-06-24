import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StageRunner } from './stage-runner';
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

export class FixtureStageRunner implements StageRunner {
  private readonly discovery: DiscoveryMap;
  private readonly plan: ResearchPlan;
  private readonly findings: SubquestionFinding[];
  private readonly draft: DraftReport;
  private readonly reviews: ReviewResult[];
  private readonly final: FinalReport;

  constructor(name: string) {
    if (name !== 'agent-frameworks') {
      throw new Error(`unknown_fixture:${name}`);
    }

    this.discovery = DiscoveryMapSchema.parse(readFixture(name, 'discovery.json'));
    this.plan = ResearchPlanSchema.parse(readFixture(name, 'plan.json'));
    this.findings = SubquestionFindingSchema.array().parse(readFixture(name, 'findings.json'));
    this.draft = DraftReportSchema.parse(readFixture(name, 'draft.json'));
    this.reviews = ReviewResultSchema.array().parse(readFixture(name, 'reviews.json'));
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

  async runCoverageReview(): Promise<ReviewResult> {
    return this.reviewFor('coverage');
  }

  async runBiasReview(): Promise<ReviewResult> {
    return this.reviewFor('bias');
  }

  async runCitationReview(): Promise<ReviewResult> {
    return this.reviewFor('citation');
  }

  async runRepair(_input: ResearchInput, _discovery: DiscoveryMap, _plan: ResearchPlan, _draft: DraftReport, _findings: SubquestionFinding[], decision: ReviewDecision): Promise<SubquestionFinding | null> {
    if (decision.needsRepair === false) {
      return null;
    }
    throw new Error('fixture_unexpected_repair');
  }

  async runFinalWriter(input: ResearchInput): Promise<FinalReport> {
    return {
      ...this.final,
      topic: input.topic,
      depth: input.depth,
      format: input.format,
      outputPath: '',
      reviewResults: this.reviews,
    };
  }

  private reviewFor(reviewer: ReviewResult['reviewer']): ReviewResult {
    const review = this.reviews.find((candidate) => candidate.reviewer === reviewer);
    if (!review) {
      throw new Error(`fixture_missing_review:${reviewer}`);
    }
    return review;
  }
}

function readFixture(name: string, file: string): unknown {
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

  for (const root of roots) {
    const sourcePath = join(root, 'src', 'research-runner', '__fixtures__', name, file);
    if (existsSync(sourcePath)) {
      return JSON.parse(readFileSync(sourcePath, 'utf8'));
    }
  }

  const bundledUrl = new URL(`./__fixtures__/${name}/${file}`, import.meta.url);
  return JSON.parse(readFileSync(bundledUrl, 'utf8'));
}
