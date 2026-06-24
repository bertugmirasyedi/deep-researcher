import { runDeepResearch } from './workflow';
import { DepthSchema, ReportFormatSchema, type ResearchInput } from './schemas';

const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log('Deep Researcher Mastra + OMP ACP runner');
  process.exit(0);
}

try {
  const input = parseArgs(args);
  const result = await runDeepResearch(input);

  console.log(`outputPath=${result.outputPath}`);
  console.log(`reviewStatus=${result.reviewStatus}`);
  console.log(`sourcesConsulted=${result.sourcesConsulted}`);
  console.log(`sourceMinimumMet=${result.sourceMinimumMet}`);
  process.exit(result.reviewStatus === 'failed' ? 2 : 0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}

function parseArgs(rawArgs: string[]): ResearchInput {
  const values: Record<string, string> = {};
  const positional: string[] = [];

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg.startsWith('--')) {
      const value = rawArgs[index + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`missing_value:${arg}`);
      }
      values[arg.slice(2)] = value;
      index += 1;
    } else {
      positional.push(arg);
    }
  }

  const topic = values.topic ?? positional.join(' ').trim();
  if (!topic) {
    throw new Error('missing_required_topic');
  }

  return {
    topic,
    depth: DepthSchema.parse(values.depth ?? 'deep'),
    format: ReportFormatSchema.parse(values.format ?? 'full'),
    maxReviewRepairRounds: 1,
    fixture: values.fixture,
  };
}
