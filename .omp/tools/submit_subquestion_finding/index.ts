import type { CustomToolFactory } from '@oh-my-pi/pi-coding-agent';
import { SubquestionFindingSchema } from '../../../src/research-runner/schemas';
import { createStructuredOutputToolDefinition, STRUCTURED_OUTPUT_TOOL_BY_SCHEMA } from '../../../src/research-runner/structured-output-tools';

const factory: CustomToolFactory = () => createStructuredOutputToolDefinition({
  name: STRUCTURED_OUTPUT_TOOL_BY_SCHEMA.SubquestionFinding,
  label: 'Submit Subquestion Finding',
  description: 'Submit the final SubquestionFinding object for a research or repair stage.',
  schemaName: 'SubquestionFinding',
  parameters: SubquestionFindingSchema,
});

export default factory;
