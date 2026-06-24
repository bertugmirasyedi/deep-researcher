import { AcpAgent } from '@mastra/acp';
import { LocalFilesystem, Workspace } from '@mastra/core/workspace';
import { z } from 'zod';

export type OmpThinkingLevel = 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

export type OmpAcpAgentOptions = {
  id: string;
  name: string;
  description: string;
  model: 'openai-codex/gpt-5.5' | 'openai-codex/gpt-5.4-mini';
  thinkingLevel: OmpThinkingLevel;
  cwd?: string;
};

export function buildOmpAcpArgs(options: Pick<OmpAcpAgentOptions, 'model' | 'thinkingLevel'>): string[] {
  return ['--model', options.model, '--thinking', options.thinkingLevel, 'acp'];
}

export function createOmpAcpAgent(options: OmpAcpAgentOptions): AcpAgent {
  const cwd = options.cwd ?? process.cwd();

  return new AcpAgent({
    id: options.id,
    name: options.name,
    description: options.description,
    command: process.env.DEEP_RESEARCH_OMP_COMMAND ?? 'omp',
    args: buildOmpAcpArgs(options),
    cwd,
    persistSession: false,
    workspace: new Workspace({
      id: `${options.id}-workspace`,
      filesystem: new LocalFilesystem({ basePath: cwd, readOnly: true }),
    }),
    onPermissionRequest: async (request) => {
      const serializedRequest = JSON.stringify(request).toLowerCase();
      const deniedTerms = [
        'write',
        'edit',
        'delete',
        'bash',
        'shell',
        'apply_patch',
        'rm ',
        'move',
        'mv ',
        'commit',
        'push',
        'install',
      ];

      if (deniedTerms.some((term) => serializedRequest.includes(term))) {
        return { outcome: { outcome: 'cancelled' } };
      }

      const option =
        request.options.find((candidate) => {
          const name = candidate.name.toLowerCase();
          return name.includes('allow') || name.includes('yes') || name.includes('continue');
        }) ?? request.options[0];

      if (!option) {
        return { outcome: { outcome: 'cancelled' } };
      }

      return { outcome: { outcome: 'selected', optionId: option.optionId } };
    },
  });
}

export function extractFirstJsonObject(text: string): unknown {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidateText = fencedMatch?.[1] ?? text;
  const trimmed = candidateText.trim();

  if (trimmed.startsWith('[')) {
    throw new Error('json_parse_failed:top-level arrays are not supported');
  }

  const objectText = findBalancedObject(trimmed);
  if (objectText === null) {
    throw new Error('json_parse_failed:no JSON object found');
  }

  return parseJsonObject(objectText);
}

function parseJsonObject(text: string): unknown {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) || parsed === null || typeof parsed !== 'object') {
      throw new Error('top-level JSON value must be an object');
    }
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`json_parse_failed:${message}`);
  }
}

function findBalancedObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = inString;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

export async function runOmpJsonAgent<T>(options: OmpAcpAgentOptions & {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
}): Promise<T> {
  const schemaJson = JSON.stringify(z.toJSONSchema(options.schema), null, 2);
  const promptText = `${options.systemPrompt}\n\n${options.userPrompt}\n\nReturn only JSON matching schema ${options.schemaName}. Do not wrap JSON in Markdown. Do not include commentary. Use OMP built-in tools when they are necessary for this stage, but never modify files, run shell commands, install packages, or change repository state.\n\nSchema ${options.schemaName}:\n${schemaJson}`;
  const agent = createOmpAcpAgent(options);
  const result = await agent.generate(promptText);
  const rawAnswer = result.text;

  try {
    return options.schema.parse(extractFirstJsonObject(rawAnswer));
  } catch (firstError) {
    const repairAgent = createOmpAcpAgent(options);
    const message = firstError instanceof Error ? firstError.message : String(firstError);
    const repairResult = await repairAgent.generate(`The previous answer did not match schema ${options.schemaName}.
Error: ${message}
Previous answer:
${rawAnswer}

Schema ${options.schemaName}:
${schemaJson}

Return corrected JSON only. Do not use tools for this correction unless the correction requires re-reading evidence already referenced in the answer.`);

    return options.schema.parse(extractFirstJsonObject(repairResult.text));
  }
}
