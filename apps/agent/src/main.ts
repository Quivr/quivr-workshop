import 'reflect-metadata'

import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'

import { AppModule } from './app.module.js'
import { config } from './config.js'

const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  logger: ['error', 'warn', 'log'],
})
app.useBodyParser('json', { limit: '5mb' })
await app.listen(config.port)

new Logger('agent').log(
  `Agent on http://localhost:${config.port}/agent | models: ${config.allowedModels.join(', ')} | default: ${config.defaultModel} | MCP: ${config.mcpUrl}`
)
