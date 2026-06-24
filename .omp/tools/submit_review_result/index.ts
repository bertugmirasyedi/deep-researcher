import type { CustomToolFactory } from '@oh-my-pi/pi-coding-agent';
import { ReviewResultSchema } from '../../../src/research-runner/schemas';
import { createStructuredOutputToolDefinition, STRUCTURED_OUTPUT_TOOL_BY_SCHEMA } from '../../../src/research-runner/structured-output-tools';

const factory: CustomToolFactory = () => createStructuredOutputToolDefinition({
  name: STRUCTURED_OUTPUT_TOOL_BY_SCHEMA.ReviewResult,
  label: 'Submit Review Result',
  description: 'Submit the final ReviewResult object for a review stage.',
  schemaName: 'ReviewResult',
  parameters: ReviewResultSchema,
});

export default factory;
