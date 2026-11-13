import { Controller, Get, Inject, Logger, Post, Req, Res } from '@nestjs/common'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { Request, Response } from 'express'

import { QuivrClient } from './quivr/quivr-client.js'
import { createMcpServer } from './server.js'

/** Stateless MCP over streamable HTTP: a fresh server per request. */
@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name)

  constructor(@Inject(QuivrClient) private readonly quivr: QuivrClient) {}

  @Post()
  async handle(@Req() req: Request, @Res() res: Response) {
    const server = createMcpServer(this.quivr)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })
    res.on('close', () => {
      void transport.close()
      void server.close()
    })

    try {
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (error) {
      this.logger.error(error)
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        })
      }
    }
  }

  @Get()
  notAllowed(@Res() res: Response) {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed' },
      id: null,
    })
  }
}
