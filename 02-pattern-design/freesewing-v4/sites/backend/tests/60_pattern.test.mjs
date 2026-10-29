import { api, auth, cat, store } from './utils.mjs'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

describe(`Pattern tests`, () => {
  store.account.patterns = {}
  for (const a of ['jwt', 'key']) {
    it(`Create a new pattern (${a})`, async () => {
      const body = {
        test: true,
        design: 'aaron',
        settings: {
          sa: 5,
          measurements: store.account.sets.her.measurements,
        },
        name: 'Just a test',
        notes: 'These are my notes',
        public: true,
        data: {
          some: 'value',
        },
        img: cat,
      }
      const [status, data] = await api.post(`/patterns/${a}`, body, auth[a])
      assert.equal(status, 201)
      assert.equal(data.result, 'created')
      assert.equal(typeof data.pattern.id, 'number')
      assert.equal(data.pattern.userId, store.account.id)
      assert.equal(data.pattern.design, body.design)
      assert.equal(data.pattern.public, body.public)
      store.account.patterns[a] = data.pattern
    })

    for (const field of ['name', 'notes']) {
      it(`Update the pattern ${field} (${a})`, async () => {
        const body = {}
        const val = store.account.patterns[a][field] + '_updated'
        body[field] = val
        const [status, data] = await api.patch(
          `/patterns/${store.account.patterns[a].id}/${a}`,
          body,
          auth[a]
        )
        assert.equal(status, 200)
        assert.equal(data.result, 'success')
        assert.equal(data.pattern[field], val)
      })
    }

    it(`Update the pattern public field (${a})`, async () => {
      const body = { public: !store.account.patterns[a].public }
      const [status, data] = await api.patch(
        `/patterns/${store.account.patterns[a].id}/${a}`,
        body,
        auth[a]
      )
      assert.equal(status, 200)
      assert.equal(data.result, 'success')
      assert.equal(data.pattern.public, body.public)
    })

    it(`Do not update the pattern design field (${a})`, async () => {
      const body = { design: 'updated' }
      const [status, data] = await api.patch(
        `/patterns/${store.account.patterns[a].id}/${a}`,
        body,
        auth[a]
      )
      assert.equal(status, 200)
      assert.equal(data.result, 'success')
      assert.equal(data.pattern.design, 'aaron')
    })

    for (const field of ['data', 'settings']) {
      it(`Update the pattern ${field} field (${a})`, async () => {
        const body = {}
        body[field] = { test: { value: 'hello' } }
        const [status, data] = await api.patch(
          `/patterns/${store.account.patterns[a].id}/${a}`,
          body,
          auth[a]
        )
        assert.equal(status, 200)
        assert.equal(data.result, 'success')
        assert.equal(JSON.stringify(data.pattern[field]), JSON.stringify(body[field]))
      })
    }

    it(`Read a pattern (${a})`, async () => {
      const body = { design: 'updated' }
      const [status, data] = await api.get(
        `/patterns/${store.account.patterns[a].id}/${a}`,
        auth[a]
      )
      assert.equal(status, 200)
      assert.equal(data.result, 'success')
      assert.equal(data.pattern.design, 'aaron')
    })

    it(`Do not allow read another user's non-public pattern (${a})`, async () => {
      const body = { design: 'updated' }
      const [status, data] = await api.get(
        `/patterns/${store.account.patterns[a].id}/${a}`,
        auth[`alt${a}`]
      )
      assert.equal(status, 403)
    })

    it(`Do not allow updating another user's non-public pattern (${a})`, async () => {
      const body = { name: 'changed' }
      const [status, data] = await api.patch(
        `/patterns/${store.account.patterns[a].id}/${a}`,
        body,
        auth[`alt${a}`]
      )
      assert.equal(status, 403)
    })

    it(`Do not allow removing another user's pattern (${a})`, async () => {
      const [status, data] = await api.delete(
        `/patterns/${store.account.patterns[a].id}/${a}`,
        auth[`alt${a}`]
      )
      assert.equal(status, 403)
    })
  }
})
