import { existsSync } from 'node:fs'
import { join } from 'node:path'

export const ROOT_DIR = join(import.meta.dirname, '../../..')
const ENV_FILE = join(ROOT_DIR, '.env')

if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE)

const list = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

export const config = {
  port: Number(process.env.AGENT_PORT ?? 3001),
  mcpUrl: process.env.MCP_URL ?? 'http://localhost:3002/mcp',
  allowedModels: list(process.env.ALLOWED_MODELS),
  defaultModel: process.env.DEFAULT_MODEL ?? '',
  judgeModel: process.env.JUDGE_MODEL ?? process.env.DEFAULT_MODEL ?? '',
  quivrMode: process.env.QUIVR_MODE === 'fixtures' ? 'fixtures' : 'live',
  timeZone: process.env.TZ_DISPLAY ?? 'Europe/Brussels',
  tracesDir: join(ROOT_DIR, '.traces'),
  fixturesMetaFile: join(ROOT_DIR, 'apps/mcp/fixtures/meta.json'),
  maxSteps: 8,
  toolTimeoutMs: 15_000,
} as const
