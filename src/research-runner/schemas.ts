import { z } from 'zod';

export const DepthSchema = z.enum(['quick', 'deep']);
export type Depth = z.output<typeof DepthSchema>;

export const ReportFormatSchema = z.enum(['brief', 'full', 'academic']);
export type ReportFormat = z.output<typeof ReportFormatSchema>;

export const ResearchInputSchema = z.object({
  topic: z.string().min(3),
  depth: DepthSchema.default('deep'),
  format: ReportFormatSchema.default('full'),
  dateIso: z.string().optional(),
  maxReviewRepairRounds: z.number().int().min(0).max(2).default(1),
  fixture: z.string().optional(),
});
export type ResearchInput = z.output<typeof ResearchInputSchema>;

export const SearchResultSchema = z.object({
  query: z.string(),
  title: z.string(),
  url: z.string().url(),
  snippet: z.string(),
  publishedAt: z.string().optional(),
  sourceTypeHint: z.string().optional(),
});
export type SearchResult = z.output<typeof SearchResultSchema>;

export const SourceReadSchema = z.object({
  sourceId: z.string(),
  url: z.string().url(),
  title: z.string().optional(),
  contentSummary: z.string(),
  quotedEvidence: z.array(z.string()),
  readOk: z.boolean(),
  failureReason: z.string().optional(),
});
export type SourceRead = z.output<typeof SourceReadSchema>;

export const SourceTierSchema = z.enum(['A', 'B', 'C', 'D']);
export type SourceTier = z.output<typeof SourceTierSchema>;

export const RecencySchema = z.enum(['current', 'recent', 'dated', 'historical']);
export type Recency = z.output<typeof RecencySchema>;

export const RelevanceSchema = z.enum(['direct', 'supporting', 'tangential']);
export type Relevance = z.output<typeof RelevanceSchema>;

export const SourceLedgerEntrySchema = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
  author: z.string().optional(),
  date: z.string().optional(),
  domain: z.string(),
  publicationType: z.string(),
  tier: SourceTierSchema,
  score: z.number().min(0).max(5),
  recency: RecencySchema,
  relevance: RelevanceSchema,
  keyClaims: z.array(z.string()),
  readStatus: z.enum(['unread', 'read', 'failed']),
  citedByClaimIds: z.array(z.string()).default([]),
});
export type SourceLedgerEntry = z.output<typeof SourceLedgerEntrySchema>;

export const DiscoveryEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['framework', 'company', 'person', 'paper', 'standard', 'other']),
  evidenceSourceIds: z.array(z.string()).min(1),
  firstSeenQuery: z.string(),
  mentionCount: z.number().int().min(1),
  recencySignal: z.string().optional(),
});
export type DiscoveryEntity = z.output<typeof DiscoveryEntitySchema>;

export const DiscoveryDimensionSchema = z.object({
  name: z.string(),
  evidenceSourceIds: z.array(z.string()).min(1),
  explanation: z.string(),
});
export type DiscoveryDimension = z.output<typeof DiscoveryDimensionSchema>;

export const DiscoveryMapSchema = z.object({
  topic: z.string(),
  neutralQueries: z.array(z.string()).min(2),
  searchResults: z.array(SearchResultSchema),
  sourceReads: z.array(SourceReadSchema),
  entities: z.array(DiscoveryEntitySchema),
  dimensions: z.array(DiscoveryDimensionSchema),
  gaps: z.array(z.string()),
});
export type DiscoveryMap = z.output<typeof DiscoveryMapSchema>;

export const SubQuestionSchema = z.object({
  id: z.string().regex(/^SQ\d+$/),
  question: z.string(),
  rationale: z.string(),
  expectedSourceTypes: z.array(z.string()).min(1),
  seededByEntityIds: z.array(z.string()).default([]),
  seededByDimensionNames: z.array(z.string()).default([]),
  allNamedEntitiesInQuestion: z.array(z.string()).default([]),
  initialQueries: z.array(z.string()).min(2).max(5),
});
export type SubQuestion = z.output<typeof SubQuestionSchema>;

export const ResearchPlanSchema = z.object({
  topic: z.string(),
  depth: DepthSchema,
  scope: z.string(),
  subQuestions: z.array(SubQuestionSchema).min(3).max(8),
  sourceMinimum: z.number().int(),
  targetSources: z.object({ min: z.number().int(), max: z.number().int() }),
});
export type ResearchPlan = z.output<typeof ResearchPlanSchema>;

export const ResearchTaskPayloadSchema = z.object({
  input: ResearchInputSchema,
  discovery: DiscoveryMapSchema,
  plan: ResearchPlanSchema,
  subQuestion: SubQuestionSchema,
});
export type ResearchTaskPayload = z.output<typeof ResearchTaskPayloadSchema>;

export const SubquestionFindingSchema = z.object({
  subQuestionId: z.string(),
  sources: z.array(SourceLedgerEntrySchema),
  synthesis: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  conflicts: z.array(z.string()),
  gaps: z.array(z.string()),
  refinementQueries: z.array(z.string()),
  sourceCount: z.number().int().nonnegative(),
});
export type SubquestionFinding = z.output<typeof SubquestionFindingSchema>;

export const DraftReportSchema = z.object({
  title: z.string(),
  markdown: z.string(),
  sources: z.array(SourceLedgerEntrySchema),
  claimMap: z.array(z.object({
    claimId: z.string(),
    claimText: z.string(),
    sourceIds: z.array(z.string()).min(1),
  })),
});
export type DraftReport = z.output<typeof DraftReportSchema>;

export const ReviewResultSchema = z.object({
  reviewer: z.enum(['coverage', 'bias', 'citation']),
  passed: z.boolean(),
  findings: z.array(z.string()),
  requiredActions: z.array(z.string()),
  targetedQueries: z.array(z.string()),
});
export type ReviewResult = z.output<typeof ReviewResultSchema>;

export const ReviewDecisionSchema = z.object({
  needsRepair: z.boolean(),
  reviewResults: z.array(ReviewResultSchema),
  repairQueries: z.array(z.string()),
  repairReason: z.string().optional(),
});
export type ReviewDecision = z.output<typeof ReviewDecisionSchema>;

export const ReviewActionSchema = z.enum(['finalize', 'targeted_repair', 'additional_research', 'replan']);
export type ReviewAction = z.output<typeof ReviewActionSchema>;

export const ReviewControllerDecisionSchema = z.object({
  action: ReviewActionSchema,
  round: z.number().int().min(0),
  reason: z.string(),
  failedReviewers: z.array(z.enum(['coverage', 'bias', 'citation'])),
  requiredActions: z.array(z.string()),
  repairQueries: z.array(z.string()),
  newSubQuestions: z.array(SubQuestionSchema).max(3).default([]),
  replanInstructions: z.array(z.string()).default([]),
});
export type ReviewControllerDecision = z.output<typeof ReviewControllerDecisionSchema>;

export const AdaptiveReviewCycleStateSchema = z.object({
  findings: z.array(SubquestionFindingSchema),
  draft: DraftReportSchema,
  reviewResults: z.array(ReviewResultSchema),
  controllerDecisions: z.array(ReviewControllerDecisionSchema).default([]),
  iteration: z.number().int().min(0),
  complete: z.boolean(),
  repairApplied: z.boolean(),
});
export type AdaptiveReviewCycleState = z.output<typeof AdaptiveReviewCycleStateSchema>;

export const FinalReportSchema = z.object({
  topic: z.string(),
  depth: DepthSchema,
  format: ReportFormatSchema,
  markdown: z.string(),
  outputPath: z.string(),
  sourcesConsulted: z.number().int().nonnegative(),
  sourceMinimumMet: z.boolean(),
  reviewStatus: z.enum(['passed', 'passed_with_disclosed_gaps', 'failed']),
  reviewResults: z.array(ReviewResultSchema),
});
export type FinalReport = z.output<typeof FinalReportSchema>;

export const WorkflowStateSchema = z.object({
  input: ResearchInputSchema.optional(),
  discovery: DiscoveryMapSchema.optional(),
  plan: ResearchPlanSchema.optional(),
  findings: z.array(SubquestionFindingSchema).default([]),
  draft: DraftReportSchema.optional(),
  reviewResults: z.array(ReviewResultSchema).default([]),
  controllerDecisions: z.array(ReviewControllerDecisionSchema).default([]),
  repairFinding: SubquestionFindingSchema.optional(),
});
export type WorkflowState = z.output<typeof WorkflowStateSchema>;
