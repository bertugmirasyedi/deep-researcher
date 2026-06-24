export const STRUCTURED_OUTPUT_TOOL_BY_SCHEMA = {
  DiscoveryMap: 'submit_discovery_map',
  ResearchPlan: 'submit_research_plan',
  SubquestionFinding: 'submit_subquestion_finding',
  DraftReport: 'submit_draft_report',
  ReviewResult: 'submit_review_result',
  ReviewControllerDecision: 'submit_review_controller_decision',
  FinalReport: 'submit_final_report',
} as const;

export type StructuredOutputSchemaName = keyof typeof STRUCTURED_OUTPUT_TOOL_BY_SCHEMA;
export type StructuredOutputToolName = (typeof STRUCTURED_OUTPUT_TOOL_BY_SCHEMA)[StructuredOutputSchemaName];

export function getStructuredOutputToolName(schemaName: string): StructuredOutputToolName {
  if (schemaName in STRUCTURED_OUTPUT_TOOL_BY_SCHEMA) {
    return STRUCTURED_OUTPUT_TOOL_BY_SCHEMA[schemaName as StructuredOutputSchemaName];
  }
  throw new Error(`structured_output_tool_unknown_schema:${schemaName}`);
}

export type StructuredOutputToolDefinitionOptions = {
  name: string;
  label: string;
  description: string;
  schemaName: string;
  parameters: unknown;
};

export function createStructuredOutputToolDefinition(options: StructuredOutputToolDefinitionOptions) {
  return {
    name: options.name,
    label: options.label,
    description: `${options.description} This is an output-only tool for Deep Researcher; call it exactly once when the stage is complete.`,
    parameters: options.parameters,
    approval: 'read' as const,
    async execute(_toolCallId: string, params: unknown) {
      return {
        content: [{ type: 'text' as const, text: `${options.schemaName} output captured. Do not restate it in prose.` }],
        details: { schemaName: options.schemaName, payload: params },
      };
    },
  };
}
