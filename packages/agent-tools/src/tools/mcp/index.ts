import type { Integration } from '../../types';
import { mcpListTools } from './list-tools';
import { mcpCallTool } from './call-tool';

// A remote MCP server over Streamable HTTP. One credential is one server; the tools
// it offers are discovered at call time, so any server can be connected without a
// code change.
export const mcp: Integration = {
  key: 'mcp',
  label: 'MCP server',
  credentialSchema: [
    {
      key: 'url',
      label: 'Server URL',
      type: 'url',
      required: true,
      placeholder: 'https://mcp.example.com/mcp',
      help: 'The Streamable HTTP endpoint of the MCP server.',
    },
    {
      key: 'token',
      label: 'Bearer token',
      type: 'secret',
      required: false,
      help: 'Sent as an Authorization: Bearer header. Leave empty for a server without authentication.',
    },
  ],
  tools: [mcpListTools, mcpCallTool],
};
