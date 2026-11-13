import { readFileSync } from 'node:fs'

import { config } from './config.js'

/**
 * "Now" for the agent. In fixtures mode this is the moment the fixtures were
 * recorded, so "today" matches the recorded data.
 */
export const now = (): Date => {
  if (config.quivrMode !== 'fixtures') return new Date()
  const meta = JSON.parse(readFileSync(config.fixturesMetaFile, 'utf8')) as {
    recordedAt: string
  }
  return new Date(meta.recordedAt)
}
