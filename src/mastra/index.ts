import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { MastraStorageExporter, Observability, SamplingStrategyType } from '@mastra/observability';
import { createDeepResearchWorkflow } from '../research-runner/workflow';
import { OmpAcpStageRunner } from '../research-runner/stage-runner';

export const mastra = new Mastra({
  workflows: {
    deepResearch: createDeepResearchWorkflow(new OmpAcpStageRunner()),
  },
  storage: new LibSQLStore({
    id: 'deep-researcher-mastra-storage',
    url: 'file:./mastra-traces.db',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'deep-researcher-mastra-omp-acp',
        sampling: { type: SamplingStrategyType.ALWAYS },
        exporters: [new MastraStorageExporter()],
      },
    },
  }),
  logger: false,
  server: {
    port: 4112,
  },
});
