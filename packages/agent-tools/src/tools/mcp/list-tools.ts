import { z } from 'zod';
import type { CustomToolEntry } from '../../types';
import { withMcpClient } from './client';

export const mcpListTools: CustomToolEntry = {
  key: 'mcp_list_tools',
  label: 'List MCP tools',
  description:
    'List the tools an MCP server offers, with the input schema of each. Call this first to learn what the server can do, then use mcp_call_tool with one of the returned names.',
  inputSchema: z.object({}),
  execute: (credential) =>
    withMcpClient(credential, async (client) => {
      const server = client.getServerVersion();
      const { tools } = await client.listTools();
      return {
        server: server ? { name: server.name, version: server.version } : null,
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description ?? '',
          inputSchema: t.inputSchema,
        })),
      };
    }),
};
