import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { ToolConfig } from '../../types';

export function mcpCredential(credential: ToolConfig): { url: URL; token: string } {
  const raw = String(credential.url ?? '').trim();
  if (!raw) throw new Error('No MCP server URL configured.');
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`"${raw}" is not a valid MCP server URL.`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('The MCP server URL must use http or https.');
  }
  return { url, token: credential.token ? String(credential.token) : '' };
}

// Opens a session against the server the credential points at, runs `fn`, and
// closes it. A session per call keeps the runtime free of connection state: a run
// may call the server once or not at all, and the server may restart in between.
export async function withMcpClient<T>(
  credential: ToolConfig,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const { url, token } = mcpCredential(credential);
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
  const client = new Client({ name: 'itsaplan-agent', version: '1.0.0' });
  try {
    await client.connect(transport);
  } catch (err) {
    throw new Error(`Could not connect to the MCP server at ${url.origin}: ${message(err)}`);
  }
  try {
    return await fn(client);
  } finally {
    await client.close().catch(() => {});
  }
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
