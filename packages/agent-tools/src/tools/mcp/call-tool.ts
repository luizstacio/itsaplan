import { z } from 'zod';
import type { CustomToolEntry } from '../../types';
import { withMcpClient } from './client';

interface ContentBlock {
  type: string;
  text?: string;
  [key: string]: unknown;
}

// The text the model reads from a result: text blocks joined, other block kinds
// named so it knows something was returned that it cannot read here.
export function contentText(content: unknown): string {
  if (!Array.isArray(content)) return '';
  return (content as ContentBlock[])
    .map((block) => (block.type === 'text' ? (block.text ?? '') : `[${block.type} content]`))
    .join('\n');
}

export const mcpCallTool: CustomToolEntry = {
  key: 'mcp_call_tool',
  label: 'Call an MCP tool',
  description:
    'Call one tool of an MCP server by name with the arguments its input schema asks for. Use mcp_list_tools first to see the available names and schemas.',
  inputSchema: z.object({
    name: z.string().min(1).describe('The tool name, as returned by mcp_list_tools.'),
    arguments: z
      .record(z.string(), z.unknown())
      .default({})
      .describe('The arguments object matching the tool input schema.'),
  }),
  execute: (credential, input) =>
    withMcpClient(credential, async (client) => {
      const result = await client.callTool({
        name: String(input.name),
        arguments: (input.arguments ?? {}) as Record<string, unknown>,
      });
      const text = contentText(result.content);
      if (result.isError) throw new Error(text || `Tool ${String(input.name)} failed.`);
      return result.structuredContent ?? text;
    }),
};
