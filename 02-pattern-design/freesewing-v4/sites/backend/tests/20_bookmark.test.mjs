import { api, auth, cat, store } from './utils.mjs'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const obj = {
  jwt: {
    type: 'doc',
    title: 'This is the title',
    url: '/docs/foo/bar',
  },
  key: {
    type: 'set',
    title: 'This is the set',
    url: '/sets/12',
  },
}
store.bookmark = {
  jwt: {},
  key: {},
}
store.altbookmark = {
  jwt: {},
  key: {},
}

for (const a of ['jwt', 'key']) {
  describe(`Bookmark Tests (${a})`, () => {
    it(`Create a new bookmark (${a})`, async () => {
      const [status, data] = await api.post(`/bookmarks/${a}`, obj[a], auth[a])
      assert.equal(status, 201)
      assert.equal(data.result, `created`)
      for (const [key, val] of Object.entries(obj[a])) {
        assert.equal(data.bookmark[key], val)
      }
      store.bookmark[a] = data.bookmark
    })

    for (const field of ['title', 'url']) {
      it(`Should update the ${field} of the bookmark (${a})`, async () => {
        const body = {}
        const val = store.bookmark[a][field] + '_updated'
        body[field] = val
        const [status, data] = await api.patch(
          `/bookmarks/${store.bookmark[a].id}/${a}`,
          body,
          auth[a]
        )
        assert.equal(status, 200)
        assert.equal(data.bookmark[field], val)
        store.bookmark[a][field] = val
      })
    }

    it(`Read a bookmark (${a})`, async () => {
      const [status, data] = await api.get(`/bookmarks/${store.bookmark[a].id}/${a}`, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      for (const [key, val] of Object.entries(store.bookmark[a])) {
        assert.equal(data.bookmark[key], val)
      }
    })

    it(`Disallow reading other user's bookmark (${a})`, async () => {
      const [status, data] = await api.get(
        `/bookmarks/${store.bookmark[a].id}/${a}`,
        auth[`alt${a}`]
      )
      assert.equal(status, 403)
      assert.equal(data.result, `error`)
      assert.equal(data.error, `insufficientAccessLevel`)
    })

    it(`Disallow updating other user's bookmark (${a})`, async () => {
      const [status, data] = await api.patch(
        `/bookmarks/${store.bookmark[a].id}/${a}`,
        auth[`alt${a}`]
      )
      assert.equal(status, 401)
    })

    it(`Disallow removing other user's bookmark (${a})`, async () => {
      const [status, data] = await api.delete(
        `/bookmarks/${store.bookmark[a].id}/${a}`,
        auth[`alt${a}`]
      )
      assert.equal(status, 403)
    })
  })
}
