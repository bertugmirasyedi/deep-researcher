import type { CustomToolFactory } from '@oh-my-pi/pi-coding-agent';
import { DraftReportSchema } from '../../../src/research-runner/schemas';
import { createStructuredOutputToolDefinition, STRUCTURED_OUTPUT_TOOL_BY_SCHEMA } from '../../../src/research-runner/structured-output-tools';

const factory: CustomToolFactory = () => createStructuredOutputToolDefinition({
  name: STRUCTURED_OUTPUT_TOOL_BY_SCHEMA.DraftReport,
  label: 'Submit Draft Report',
  description: 'Submit the final DraftReport object for the writer stage.',
  schemaName: 'DraftReport',
  parameters: DraftReportSchema,
});

export default factory;
