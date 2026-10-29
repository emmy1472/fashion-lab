import { api, auth, cat, store } from './utils.mjs'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const obj = {
  jwt: {
    test: true,
    nameEn: 'Example measurements A',
    notesEn: 'These are the notes A',
    tags: ['tagA', 'tagB'],
    measies: {
      chest: 1000,
      neck: 420,
    },
  },
  key: {
    test: true,
    nameEn: 'Example measurements B',
    notesEn: 'These are the notes B',
    tags: ['tagA', 'tagB'],
    measies: {
      chest: 930,
      neck: 360,
    },
  },
}
store.curatedSet = {
  jwt: {},
  key: {},
}
store.altset = {
  jwt: {},
  key: {},
}

for (const a of ['jwt', 'key']) {
  describe(`Curated Set Tests (${a})`, () => {
    it(`Create a new curated set (${a})`, async () => {
      const [status, data] = await api.post(`/curated-sets/${a}`, obj[a], auth[a])
      assert.equal(status, 201)
      assert.equal(data.result, `created`)
      for (const [key, val] of Object.entries(obj[a])) {
        if (!['measies', 'test', 'tags'].includes(key)) assert.equal(data.curatedSet[key], val)
      }
      store.curatedSet[a] = data.curatedSet
    })

    for (const field of ['nameEn', 'notesEn']) {
      it(`Update the ${field} field of the curated set (${a})`, async () => {
        const body = {}
        const val = store.curatedSet[a][field] + '_updated'
        body[field] = val
        const [status, data] = await api.patch(
          `/curated-sets/${store.curatedSet[a].id}/${a}`,
          body,
          auth[a]
        )
        assert.equal(status, 200)
        assert.equal(data.result, `success`)
        assert.equal(data.curatedSet[field], val)
        store.curatedSet[a] = data.curatedSet
      })
    }

    for (const field of ['chest', 'neck', 'ankle']) {
      it(`Update the ${field} measurement of the curated set (${a})`, async () => {
        const body = { measies: {} }
        const val = Math.ceil(Math.random() * 1000)
        body.measies[field] = val
        const [status, data] = await api.patch(
          `/curated-sets/${store.curatedSet[a].id}/${a}`,
          body,
          auth[a]
        )
        assert.equal(status, 200)
        assert.equal(data.result, `success`)
        assert.equal(data.curatedSet.measies[field], val)
        store.curatedSet[a] = data.curatedSet
      })
    }

    it(`Do not set a non-existing measurment on the curated set (${a})`, async () => {
      const body = { measies: { potatoe: 12 } }
      const [status, data] = await api.patch(
        `/curated-sets/${store.curatedSet[a].id}/${a}`,
        body,
        auth[a]
      )
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.equal(data.curatedSet.measies.potatoe, undefined)
    })

    it(`Clear a measurment on the curated set (${a})`, async () => {
      const body = { measies: { ankle: null } }
      const [status, data] = await api.patch(
        `/curated-sets/${store.curatedSet[a].id}/${a}`,
        body,
        auth[a]
      )
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.equal(data.curatedSet.measies.ankle, undefined)
      store.curatedSet[a] = data.curatedSet
    })

    // This is a slow test because the image needs to be uploaded to cloudflare
    it(`Suggest a curated set (${a})`, async () => {
      const body = {
        set: 1,
        notes: 'These are the notes',
        name: 'me',
        height: '166cm',
        img: cat,
      }
      const [status, data] = await api.post(`/curated-sets/suggest/${a}`, body, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.equal(data.submission.type, 'cset')
      assert.equal(typeof data.submission.id, 'string')
    })
  })
}

describe(`Curated Set Tests (unauthenticated)`, () => {
  for (const a of ['jwt', 'key']) {
    it(`Read a curated set created with ${a}`, async () => {
      const [status, data] = await api.get(`/curated-sets/${store.curatedSet[a].id}`)
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      for (const [key, val] of Object.entries(store.curatedSet[a])) {
        if (!['measies', 'test', 'tags'].includes(key)) assert.equal(data.curatedSet[key], val)
      }
    })

    it(`Read a curated set created with ${a} as JSON`, async () => {
      const [status, data] = await api.get(`/curated-sets/${store.curatedSet[a].id}.json`)
      assert.equal(status, 200)
      for (const [key, val] of Object.entries(store.curatedSet[a])) {
        if (!['measies', 'test', 'tags'].includes(key)) assert.equal(data[key], val)
      }
    })

    it(`Read a curated set created with ${a} as YAML`, async () => {
      const [status, data] = await api.get(`/curated-sets/${store.curatedSet[a].id}.yaml`)
      assert.equal(status, 200)
      assert.equal(typeof data, 'string')
    })
  }

  it(`Retrieve a list of curated sets`, async () => {
    const [status, data] = await api.get(`/curated-sets`)
    assert.equal(status, 200)
    assert.equal(data.result, `success`)
    assert.equal(Array.isArray(data.curatedSets), true)
  })

  it(`Retrieve a list of curated sets as JSON`, async () => {
    const [status, data] = await api.get(`/curated-sets.json`)
    assert.equal(status, 200)
    assert.equal(Array.isArray(data), true)
  })

  it(`Retrieve a list of curated sets as YAML`, async () => {
    const [status, data] = await api.get(`/curated-sets.yaml`)
    assert.equal(status, 200)
    assert.equal(typeof data, 'string')
  })
})

describe(`Curated Set Removal Tests`, () => {
  for (const a of ['jwt', 'key']) {
    it(`Remove a curated set (${a})`, async () => {
      const [status, data] = await api.delete(
        `/curated-sets/${store.curatedSet[a].id}/${a}`,
        auth[a]
      )
      assert.equal(status, 204)
    })
  }
})
