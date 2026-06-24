import type { CustomToolFactory } from '@oh-my-pi/pi-coding-agent';
import { FinalReportSchema } from '../../../src/research-runner/schemas';
import { createStructuredOutputToolDefinition, STRUCTURED_OUTPUT_TOOL_BY_SCHEMA } from '../../../src/research-runner/structured-output-tools';

const factory: CustomToolFactory = () => createStructuredOutputToolDefinition({
  name: STRUCTURED_OUTPUT_TOOL_BY_SCHEMA.FinalReport,
  label: 'Submit Final Report',
  description: 'Submit the final FinalReport object for the final writer stage.',
  schemaName: 'FinalReport',
  parameters: FinalReportSchema,
});

export default factory;
