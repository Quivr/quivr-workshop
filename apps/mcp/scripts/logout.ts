import { loadConfig, readCredentials } from '../src/config.js'
import { updateEnvFile } from './env-file.js'

const credentials = readCredentials()
if (!credentials) {
  console.info('Not logged in, nothing to do.')
  process.exit(0)
}

const response = await fetch(`${loadConfig().baseUrl}/api/logout`, {
  method: 'DELETE',
  headers: credentials,
})
updateEnvFile({
  QUIVR_AUTHORIZATION: '',
  QUIVR_UID: '',
  QUIVR_CLIENT: '',
  QUIVR_ACCESS_TOKEN: '',
})

console.info(
  response.ok
    ? 'Logged out. The token is revoked and removed from .env.'
    : `Removed the token from .env, but Quivr answered HTTP ${response.status} when revoking it.`
)
