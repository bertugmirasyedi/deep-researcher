import type { CustomToolFactory } from '@oh-my-pi/pi-coding-agent';
import { ResearchPlanSchema } from '../../../src/research-runner/schemas';
import { createStructuredOutputToolDefinition, STRUCTURED_OUTPUT_TOOL_BY_SCHEMA } from '../../../src/research-runner/structured-output-tools';

const factory: CustomToolFactory = () => createStructuredOutputToolDefinition({
  name: STRUCTURED_OUTPUT_TOOL_BY_SCHEMA.ResearchPlan,
  label: 'Submit Research Plan',
  description: 'Submit the final ResearchPlan object for the planning or replanning stage.',
  schemaName: 'ResearchPlan',
  parameters: ResearchPlanSchema,
});

export default factory;
