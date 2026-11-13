import 'reflect-metadata'

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module.js'
import { loadConfig } from './config.js'
import { tools } from './tools/index.js'

const config = loadConfig()
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log'],
})
await app.listen(config.port)

new Logger('mcp').log(
  `MCP server on http://localhost:${config.port}/mcp | QUIVR_MODE=${config.mode} | QUIVR_READ_ONLY=${config.readOnly} | tools: ${tools.map(tool => tool.name).join(', ')}`
)
