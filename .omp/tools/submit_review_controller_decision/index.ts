import type { CustomToolFactory } from '@oh-my-pi/pi-coding-agent';
import { ReviewControllerDecisionSchema } from '../../../src/research-runner/schemas';
import { createStructuredOutputToolDefinition, STRUCTURED_OUTPUT_TOOL_BY_SCHEMA } from '../../../src/research-runner/structured-output-tools';

const factory: CustomToolFactory = () => createStructuredOutputToolDefinition({
  name: STRUCTURED_OUTPUT_TOOL_BY_SCHEMA.ReviewControllerDecision,
  label: 'Submit Review Controller Decision',
  description: 'Submit the final ReviewControllerDecision object for the adaptive review controller.',
  schemaName: 'ReviewControllerDecision',
  parameters: ReviewControllerDecisionSchema,
});

export default factory;
