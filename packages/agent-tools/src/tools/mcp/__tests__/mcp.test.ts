import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { mcpListTools } from '../list-tools';
import { mcpCallTool, contentText } from '../call-tool';
import { mcpCredential } from '../client';

const TOKEN = 'secret-token';
let server: ReturnType<typeof Bun.serve>;
let url: string;

function buildServer(): McpServer {
  const mcp = new McpServer({ name: 'fixture', version: '0.1.0' });
  mcp.registerTool(
    'echo',
    {
      description: 'Returns the text it is given.',
      inputSchema: { text: z.string() },
      outputSchema: { text: z.string() },
    },
    async ({ text }) => ({
      content: [{ type: 'text', text }],
      structuredContent: { text },
    }),
  );
  mcp.registerTool('fail', { description: 'Always fails.' }, async () => ({
    content: [{ type: 'text', text: 'it broke' }],
    isError: true,
  }));
  return mcp;
}

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch: async (request) => {
      if (request.headers.get('authorization') !== `Bearer ${TOKEN}`) {
        return new Response('unauthorized', { status: 401 });
      }
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await buildServer().connect(transport);
      return transport.handleRequest(request);
    },
  });
  url = `http://127.0.0.1:${server.port}/mcp`;
});

afterAll(() => server.stop(true));

describe('mcp credential', () => {
  it('requires an http(s) URL', () => {
    expect(() => mcpCredential({})).toThrow('No MCP server URL configured');
    expect(() => mcpCredential({ url: 'not a url' })).toThrow('not a valid MCP server URL');
    expect(() => mcpCredential({ url: 'ftp://x' })).toThrow('must use http or https');
    expect(mcpCredential({ url: ' https://a.b/mcp ' }).url.href).toBe('https://a.b/mcp');
  });
});

describe('mcp tools', () => {
  it('lists the tools of the server with their schemas', async () => {
    const result = (await mcpListTools.execute({ url, token: TOKEN }, {})) as {
      server: { name: string } | null;
      tools: { name: string; inputSchema: { properties?: Record<string, unknown> } }[];
    };
    expect(result.server?.name).toBe('fixture');
    expect(result.tools.map((t) => t.name).sort()).toEqual(['echo', 'fail']);
    expect(result.tools.find((t) => t.name === 'echo')?.inputSchema.properties).toHaveProperty(
      'text',
    );
  });

  it('calls a tool and returns its structured content', async () => {
    const result = await mcpCallTool.execute(
      { url, token: TOKEN },
      { name: 'echo', arguments: { text: 'hello' } },
    );
    expect(result).toEqual({ text: 'hello' });
  });

  it('surfaces a tool error as an Error', async () => {
    await expect(mcpCallTool.execute({ url, token: TOKEN }, { name: 'fail' })).rejects.toThrow(
      'it broke',
    );
  });

  it('reports a refused connection', async () => {
    await expect(mcpListTools.execute({ url, token: 'wrong' }, {})).rejects.toThrow(
      'Could not connect to the MCP server',
    );
  });
});

describe('contentText', () => {
  it('joins text blocks and names the others', () => {
    expect(
      contentText([
        { type: 'text', text: 'a' },
        { type: 'image', data: '...' },
        { type: 'text', text: 'b' },
      ]),
    ).toBe('a\n[image content]\nb');
    expect(contentText(undefined)).toBe('');
  });
});
