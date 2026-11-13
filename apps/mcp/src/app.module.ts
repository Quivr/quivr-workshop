import { Module } from '@nestjs/common'

import { loadConfig } from './config.js'
import { McpController } from './mcp.controller.js'
import { QuivrClient } from './quivr/quivr-client.js'

@Module({
  controllers: [McpController],
  providers: [
    { provide: QuivrClient, useFactory: () => new QuivrClient(loadConfig()) },
  ],
})
export class AppModule {}
