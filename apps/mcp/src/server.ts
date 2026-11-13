import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import type { QuivrClient } from './quivr/quivr-client.js'
import { tools } from './tools/index.js'

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export const createMcpServer = (quivr: QuivrClient): McpServer => {
  const server = new McpServer({ name: 'quivr', version: '1.0.0' })

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema },
      async (input: Record<string, unknown>) => {
        try {
          const result = await tool.run(input, quivr)
          return { content: [{ type: 'text', text: JSON.stringify(result) }] }
        } catch (error) {
          return {
            isError: true,
            content: [{ type: 'text', text: errorMessage(error) }],
          }
        }
      }
    )
  }

  return server
}
