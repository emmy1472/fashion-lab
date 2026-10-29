import { api, auth, cat, store } from './utils.mjs'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

describe(`Subscriber tests`, () => {
  it(`Do not subscribe without an email address`, async () => {
    const body = { test: 'yes please' }
    const [status, data] = await api.post(`/subscriber`, body)
    assert.equal(status, 400)
    assert.equal(data.result, 'error')
    assert.equal(data.error, 'emailMissing')
  })

  it(`Do not subscribe without a language`, async () => {
    const body = { email: 'test@freesewing.dev', test: 'yes please' }
    const [status, data] = await api.post(`/subscriber`, body)
    assert.equal(status, 400)
    assert.equal(data.result, 'error')
    assert.equal(data.error, 'languageMissing')
  })

  it(`Do subscribe`, async () => {
    const body = { email: 'test@freeSEWing.dev', language: 'eN', test: 'yes please' }
    const [status, data] = await api.post(`/subscriber`, body)
    assert.equal(status, 200)
    assert.equal(data.data.language, 'en')
    assert.equal(data.data.email, 'test@freesewing.dev')
    assert.equal(typeof data.data.ehash, 'string')
    store.subscriber = data.data
  })

  it(`Confirm a subscription`, async () => {
    const body = { id: store.subscriber.id, ehash: store.subscriber.ehash }
    const [status, data] = await api.put(`/subscriber`, body)
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
  })
})
