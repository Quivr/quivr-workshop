import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'

export const ROOT_DIR = join(import.meta.dirname, '../../..')
export const ENV_FILE = join(ROOT_DIR, '.env')
export const FIXTURES_DIR = join(import.meta.dirname, '../fixtures')
export const QUERIES_DIR = join(import.meta.dirname, 'quivr/queries')

if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE)

export type QuivrMode = 'live' | 'fixtures'

export type Config = {
  port: number
  mode: QuivrMode
  readOnly: boolean
  baseUrl: string
}

export const loadConfig = (): Config => ({
  port: Number(process.env.MCP_PORT ?? 3002),
  mode: process.env.QUIVR_MODE === 'fixtures' ? 'fixtures' : 'live',
  readOnly: process.env.QUIVR_READ_ONLY !== 'false',
  baseUrl: process.env.QUIVR_BASE_URL ?? 'https://rails.quivr.be',
})

export type QuivrCredentials = {
  uid: string
  client: string
  accessToken: string
}

/**
 * Re-reads `.env` on every call, so `just login` works without restarting.
 */
export const readCredentials = (): QuivrCredentials | undefined => {
  const fromFile = existsSync(ENV_FILE)
    ? parseEnv(readFileSync(ENV_FILE, 'utf8'))
    : {}
  const env = { ...process.env, ...fromFile }
  if (!env.QUIVR_UID || !env.QUIVR_CLIENT || !env.QUIVR_ACCESS_TOKEN) {
    return undefined
  }
  return {
    uid: env.QUIVR_UID,
    client: env.QUIVR_CLIENT,
    accessToken: env.QUIVR_ACCESS_TOKEN,
  }
}
