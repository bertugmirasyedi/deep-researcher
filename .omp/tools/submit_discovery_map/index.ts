import type { CustomToolFactory } from '@oh-my-pi/pi-coding-agent';
import { DiscoveryMapSchema } from '../../../src/research-runner/schemas';
import { createStructuredOutputToolDefinition, STRUCTURED_OUTPUT_TOOL_BY_SCHEMA } from '../../../src/research-runner/structured-output-tools';

const factory: CustomToolFactory = () => createStructuredOutputToolDefinition({
  name: STRUCTURED_OUTPUT_TOOL_BY_SCHEMA.DiscoveryMap,
  label: 'Submit Discovery Map',
  description: 'Submit the final DiscoveryMap object for the discovery stage.',
  schemaName: 'DiscoveryMap',
  parameters: DiscoveryMapSchema,
});

export default factory;
