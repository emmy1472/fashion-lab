import { test } from 'node:test'
import { api } from '../src/api.mjs'

let server

test.before(async () => {
  console.log('Starting server for all tests...')
  server = await api()
})

test.after(async () => {
  console.log('Stopping server after all tests...')
  if (server) await server.close()
})

// Import all test files
await import('./10_user.test.mjs')
await import('./15_account.test.mjs')
await import('./16_mfa.test.mjs')
await import('./18_apikey.test.mjs')
await import('./20_bookmark.test.mjs')
await import('./24_opack.test.mjs')
await import('./30_set.test.mjs')
await import('./34_cset.test.mjs')
await import('./40_user.test.mjs')
await import('./50_subscriber.test.mjs')
await import('./60_pattern.test.mjs')
