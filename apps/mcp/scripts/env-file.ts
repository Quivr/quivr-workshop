import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { ENV_FILE, ROOT_DIR } from '../src/config.js'

/** Sets (or clears, with '') keys in the root `.env`, keeping everything else. */
export const updateEnvFile = (values: Record<string, string>) => {
  if (!existsSync(ENV_FILE)) {
    copyFileSync(join(ROOT_DIR, '.env.example'), ENV_FILE)
  }

  const lines = readFileSync(ENV_FILE, 'utf8').split('\n')
  const missing = new Set(Object.keys(values))
  const updated = lines.map(line => {
    const key = line.split('=')[0]?.trim()
    if (!key || !(key in values)) return line
    missing.delete(key)
    return `${key}=${values[key]}`
  })
  const added = [...missing].map(key => `${key}=${values[key]}`)
  writeFileSync(ENV_FILE, [...updated, ...added].join('\n'))
}
