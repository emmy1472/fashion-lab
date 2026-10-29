import { api, auth, cat, store } from './utils.mjs'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const obj = {
  jwt: {
    name: 'Joost',
    notes: 'These are them notes',
    measies: {
      chest: 1000,
      neck: 420,
    },
    public: true,
    test: true,
    imperial: true,
  },
  key: {
    name: 'Sorcha',
    notes: 'These are also notes',
    measies: {
      chest: 930,
      neck: 360,
    },
    public: true,
    img: cat,
    test: true,
    imperial: false,
  },
}
store.set = {
  jwt: {},
  key: {},
}
store.altset = {
  jwt: {},
  key: {},
}

for (const a of ['jwt', 'key']) {
  describe(`Set Tests (${a})`, () => {
    it(`Create a new set (${a})`, async () => {
      const [status, data] = await api.post(`/sets/${a}`, obj[a], auth[a])
      assert.equal(status, 201)
      assert.equal(data.result, `created`)
      for (const [key, val] of Object.entries(obj[a])) {
        if (!['measies', 'img', 'test'].includes(key)) assert.equal(data.set[key], val)
      }
      store.set[a] = data.set
    })

    for (const field of ['name', 'notes']) {
      it(`Update field ${field} of the set (${a})`, async () => {
        const body = {}
        const val = store.set[a][field] + '_updated'
        body[field] = val
        const [status, data] = await api.patch(`/sets/${store.set[a].id}/${a}`, body, auth[a])
        assert.equal(status, 200)
        assert.equal(data.set[field], val)
        store.set[a] = data.set
      })
    }

    for (const field of ['imperial', 'public']) {
      it(`Update field ${field} of the set (${a})`, async () => {
        const body = {}
        const val = !store.set[a][field]
        body[field] = val
        const [status, data] = await api.patch(`/sets/${store.set[a].id}/${a}`, body, auth[a])
        assert.equal(status, 200)
        assert.equal(data.set[field], val)
        store.set[a] = data.set
      })
    }

    const rand = () => Math.ceil(Math.random() * 1000)
    const testMeasies = {
      chest: rand(),
      neck: rand(),
      ankle: rand(),
    }

    it(`Update the ankle measurement (${a})`, async () => {
      const body = { measies: { ankle: testMeasies.ankle } }
      const [status, data] = await api.patch(`/sets/${store.set[a].id}/${a}`, body, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.equal(data.set.measies.ankle, testMeasies.ankle)
    })

    it(`Update several set measurements at once (${a})`, async () => {
      const body = { measies: testMeasies }
      const [status, data] = await api.patch(`/sets/${store.set[a].id}/${a}`, body, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      for (const m in testMeasies) assert.equal(data.set.measies[m], testMeasies[m])
      store.set[a] = data.set
    })

    it(`Do not set a non-existing measurement (${a})`, async () => {
      const body = { measies: { potatoe: 14 } }
      const [status, data] = await api.patch(`/sets/${store.set[a].id}/${a}`, body, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.equal(data.set.measies.potatoe, undefined)
    })

    it(`Clear a measurement (${a})`, async () => {
      const body = { measies: { ankle: null } }
      const [status, data] = await api.patch(`/sets/${store.set[a].id}/${a}`, body, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.equal(data.set.measies.ankle, undefined)
    })

    it(`Read a set (${a})`, async () => {
      const [status, data] = await api.get(`/sets/${store.set[a].id}/${a}`, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.equal(data.set.measies.chest, testMeasies.chest)
    })

    it(`Do not allow reading another user's non-public set (${a})`, async () => {
      const body = { measies: { ankle: null } }
      const [status, data] = await api.get(`/sets/${store.set[a].id}/${a}`, auth[`alt${a}`])
      assert.equal(status, 403)
      assert.equal(data.result, `error`)
    })

    it(`Make a set public (${a})`, async () => {
      const body = { public: true }
      const [status, data] = await api.patch(`/sets/${store.set[a].id}/${a}`, body, auth[a])
      assert.equal(status, 200)
      assert.equal(data.set.public, true)
      store.set[a] = data.set
    })

    it(`Do allow reading another user's public set (${a})`, async () => {
      const [status, data] = await api.get(`/sets/${store.set[a].id}/${a}`, auth[`alt${a}`])
      assert.equal(status, 200)
      assert.equal(data.set.public, true)
    })

    it(`Do not allow updating another user's set (${a})`, async () => {
      const body = { measies: { ankle: 123 } }
      const [status, data] = await api.patch(`/sets/${store.set[a].id}/${a}`, body, auth[`alt${a}`])
      assert.equal(status, 403)
    })

    it(`Do not allow updating another user's set (${a})`, async () => {
      const [status, data] = await api.delete(`/sets/${store.set[a].id}/${a}`, auth[`alt${a}`])
      assert.equal(status, 403)
    })

    it(`Clone a set (${a})`, async () => {
      const [status, data] = await api.post(`/sets/${store.set[a].id}/clone/${a}`, null, auth[a])
      assert.equal(status, 201)
      assert.equal(data.result, `created`)
    })

    it(`Clone a public set across accounts (${a})`, async () => {
      const [status, data] = await api.post(
        `/sets/${store.set[a].id}/clone/${a}`,
        null,
        auth[`alt${a}`]
      )
      assert.equal(status, 201)
      assert.equal(data.result, `created`)
    })

    it(`Make a set private (${a})`, async () => {
      const body = { public: false }
      const [status, data] = await api.patch(`/sets/${store.set[a].id}/${a}`, body, auth[a])
      assert.equal(status, 200)
      assert.equal(data.set.public, false)
      store.set[a] = data.set
    })

    it(`Do not allow cloning a non-public set across accounts (${a})`, async () => {
      const [status, data] = await api.post(
        `/sets/${store.set[a].id}/clone/${a}`,
        null,
        auth[`alt${a}`]
      )
      assert.equal(status, 403)
      assert.equal(data.result, `error`)
    })
  })
}
