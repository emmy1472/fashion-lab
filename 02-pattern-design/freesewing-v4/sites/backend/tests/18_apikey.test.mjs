import { api, auth, cat, store } from './utils.mjs'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

let apikey = null
let altkey = null

describe(`API Key create/read/delete`, () => {
  it(`Create API Key (jwt)`, async () => {
    const input = {
      name: 'Test API key :)',
      level: 4,
      expiresIn: 60,
    }
    const [status, data] = await api.post(`/apikeys/jwt`, input, auth.jwt)
    assert.equal(status, 201)
    assert.equal(data.result, `created`)
    assert.equal(typeof data.apikey.key, `string`)
    assert.equal(typeof data.apikey.secret, `string`)
    assert.equal(typeof data.apikey.expiresAt, `string`)
    assert.equal(data.apikey.level, input.level)
    assert.equal(data.apikey.name, input.name)
    altkey = data.apikey
  })

  it(`Create API Key (key)`, async () => {
    const input = {
      name: 'Test API key with key :)',
      level: 4,
      expiresIn: 60,
    }
    const [status, data] = await api.post(`/apikeys/key`, input, auth.key)
    assert.equal(status, 201)
    assert.equal(data.result, `created`)
    assert.equal(typeof data.apikey.key, `string`)
    assert.equal(typeof data.apikey.secret, `string`)
    assert.equal(typeof data.apikey.expiresAt, `string`)
    assert.equal(data.apikey.level, input.level)
    assert.equal(data.apikey.name, input.name)
    store.apikey2 = data.apikey
    apikey = data.apikey
  })

  it(`Read API Key via whoami (key)`, async () => {
    const [status, data] = await api.get(`/whoami/key`, auth.basic(apikey))
    assert.equal(status, 200)
    assert.equal(data.result, `success`)
    const checks = ['key', 'level', 'expiresAt', 'name', 'userId']
    checks.forEach((i) => assert.equal(data.apikey[i], apikey[i]))
  })

  it(`Read API Key (key)`, async () => {
    const [status, data] = await api.get(`/apikeys/${apikey.key}/key`, auth.basic(apikey))
    assert.equal(status, 200)
    assert.equal(data.result, `success`)
    const checks = ['key', 'level', 'expiresAt', 'name', 'userId']
    checks.forEach((i) => assert.equal(data.apikey[i], apikey[i]))
  })

  it(`Read API Key (jwt)`, async () => {
    const [status, data] = await api.get(`/apikeys/${apikey.key}/jwt`, auth.jwt)
    assert.equal(status, 200)
    assert.equal(data.result, `success`)
    const checks = ['key', 'level', 'expiresAt', 'name', 'userId']
    checks.forEach((i) => assert.equal(data.apikey[i], apikey[i]))
  })

  it(`Remove API Key (key)`, async () => {
    const [status, data] = await api.delete(`/apikeys/${apikey.key}/key`, auth.basic(apikey))
    assert.equal(status, 204)
  })

  it(`Remove API Key (jwt)`, async () => {
    const [status, data] = await api.delete(`/apikeys/${altkey.key}/jwt`, auth.jwt)
    assert.equal(status, 204)
  })
})
