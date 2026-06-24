import { AcpAgent } from '@mastra/acp';
import { LocalFilesystem, Workspace } from '@mastra/core/workspace';
import { z } from 'zod';
import { getStructuredOutputToolName } from './structured-output-tools';

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

export type StructuredOutputToolCallChunk = {
  type: 'tool-call';
  payload: {
    toolName: string;
    args: unknown;
  };
};

type StructuredOutputToolResultChunk = {
  type: 'tool-result';
  payload: {
    result?: {
      details?: {
        schemaName?: unknown;
        payload?: unknown;
      };
    };
  };
};

export class StructuredOutputCaptureError extends Error {
  constructor(message: string, readonly text: string) {
    super(message);
    this.name = 'StructuredOutputCaptureError';
  }
}

export function extractStructuredOutputToolInputFromChunks(chunks: unknown[], schemaName: string): unknown {
  const expectedToolName = getStructuredOutputToolName(schemaName);
  const matchingCalls = chunks.filter((chunk): chunk is StructuredOutputToolCallChunk => {
    if (typeof chunk !== 'object' || chunk === null || !('type' in chunk) || !('payload' in chunk)) return false;
    const candidate = chunk as { type?: unknown; payload?: { toolName?: unknown } };
    return candidate.type === 'tool-call' && candidate.payload?.toolName === expectedToolName;
  });

  if (matchingCalls.length === 1) {
    return matchingCalls[0].payload.args;
  }

  if (matchingCalls.length > 1) {
    throw new Error(`structured_output_tool_call_count:${expectedToolName}:${matchingCalls.length}`);
  }

  const matchingResults = chunks.filter((chunk): chunk is StructuredOutputToolResultChunk => {
    if (typeof chunk !== 'object' || chunk === null || !('type' in chunk) || !('payload' in chunk)) return false;
    const candidate = chunk as StructuredOutputToolResultChunk;
    return candidate.type === 'tool-result' && candidate.payload.result?.details?.schemaName === schemaName;
  });

  if (matchingResults.length !== 1) {
    throw new Error(`structured_output_tool_call_count:${expectedToolName}:${matchingResults.length}`);
  }

  return matchingResults[0].payload.result?.details?.payload;
}

async function runAcpPromptAndCaptureToolInput(agent: AcpAgent, promptText: string, schemaName: string): Promise<{ text: string; input: unknown }> {
  const streamResult = await agent.stream(promptText);
  const chunks: unknown[] = [];

  for await (const chunk of streamResult.fullStream) {
    chunks.push(chunk);
  }

  const text = await streamResult.text;

  try {
    return { text, input: extractStructuredOutputToolInputFromChunks(chunks, schemaName) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new StructuredOutputCaptureError(message, text);
  }
}

export async function runOmpJsonAgent<T>(options: OmpAcpAgentOptions & {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
}): Promise<T> {
  const schemaJson = JSON.stringify(z.toJSONSchema(options.schema), null, 2);
  const outputToolName = getStructuredOutputToolName(options.schemaName);
  const promptText = `${options.systemPrompt}\n\n${options.userPrompt}\n\nWhen the stage is complete, call the OMP custom tool ${outputToolName} exactly once with the final ${options.schemaName} object as the tool input. Do not return the JSON as assistant prose. Do not call any other submit_* output tool. After ${outputToolName} succeeds, do not restate the output in prose. Use OMP built-in tools when they are necessary for this stage, but never modify files, run shell commands, install packages, or change repository state.\n\nSchema ${options.schemaName}:\n${schemaJson}`;
  const agent = createOmpAcpAgent(options);

  try {
    const captured = await runAcpPromptAndCaptureToolInput(agent, promptText, options.schemaName);
    return options.schema.parse(captured.input);
  } catch (firstError) {
    const repairAgent = createOmpAcpAgent(options);
    const message = firstError instanceof Error ? firstError.message : String(firstError);
    const previousText = firstError instanceof StructuredOutputCaptureError ? firstError.text : '';
    const correction = await runAcpPromptAndCaptureToolInput(repairAgent, `The previous answer did not call the required OMP custom output tool ${outputToolName} exactly once, or the tool input did not match schema ${options.schemaName}.
Error: ${message}
Previous assistant text:
${previousText}

Call ${outputToolName} exactly once with corrected tool input matching schema ${options.schemaName}. Do not use tools for this correction unless the correction requires re-reading evidence already referenced in the answer.`, options.schemaName);

    return options.schema.parse(correction.input);
  }
}
