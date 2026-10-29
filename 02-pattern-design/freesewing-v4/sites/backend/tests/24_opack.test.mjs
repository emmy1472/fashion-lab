import { api, auth, cat, store } from './utils.mjs'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const obj = {
  jwt: {
    test: true,
    design: 'aaron',
    nameEn: 'Aaron options A',
    notesEn: 'Aaron notes A',
    tags: ['tagA', 'tagB'],
    options: {
      backlineBend: 0.666,
      necklineBend: 0.8,
      necklineDrop: 0.33,
    },
  },
  key: {
    test: true,
    design: 'aaron',
    nameEn: 'Aaron options B',
    notesEn: 'Aaron notes B',
    tags: ['tagA', 'tagB'],
    options: {
      backlineBend: 0.444,
      necklineBend: 0.7,
      necklineDrop: 0.4,
    },
  },
}
store.apack = {
  jwt: {},
  key: {},
}
store.bpack = {
  jwt: {},
  key: {},
}

for (const a of ['jwt', 'key']) {
  describe(`Option Pack Tests (${a})`, () => {
    it(`Create a new option pack (${a})`, async () => {
      const [status, data] = await api.post(`/option-packs/${a}`, obj[a], auth[a])
      assert.equal(status, 201)
      assert.equal(data.result, `created`)
      for (const [key, val] of Object.entries(obj[a])) {
        if (!['options', 'test', 'tags'].includes(key)) {
          assert.equal(data.optionPack[key], val)
        }
      }
      store.apack[a] = data.optionPack
    })

    for (const field of ['nameEn', 'notesEn']) {
      it(`Update the option pack ${field} field (${a})`, async () => {
        const body = {}
        const val = store.apack[a][field] + '_updated'
        body[field] = val
        const [status, data] = await api.patch(
          `/option-packs/${store.apack[a].id}/${a}`,
          body,
          auth[a]
        )
        assert.equal(status, 200)
        assert.equal(data.result, `success`)
        assert.equal(data.optionPack[field], val)
        store.apack[a] = data.optionPack
      })
    }

    for (const field of ['backlineBend', 'necklineBend', 'necklineDrop']) {
      it(`Update the option pack ${field} field (${a})`, async () => {
        const body = { options: {} }
        const val = Math.random()
        body.options[field] = val
        const [status, data] = await api.patch(
          `/option-packs/${store.apack[a].id}/${a}`,
          body,
          auth[a]
        )
        assert.equal(status, 200)
        assert.equal(data.result, `success`)
        assert.equal(data.optionPack.options[field], val)
        store.apack[a] = data.optionPack
      })
    }

    it(`Clear an option pack option (${a})`, async () => {
      const body = { options: { necklineDrop: null } }
      const [status, data] = await api.patch(
        `/option-packs/${store.apack[a].id}/${a}`,
        body,
        auth[a]
      )
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.equal(data.optionPack.options.necklineDrop, undefined)
      store.apack[a] = data.optionPack
    })

    it(`Updating a non-existing ID should return 404 (${a})`, async () => {
      const body = {}
      const [status, data] = await api.patch(`/option-packs/whatever/${a}`, body, auth[a])
      assert.equal(status, 404)
    })

    it(`Suggest an option pack (${a})`, async () => {
      const body = {
        design: 'aaron',
        notes: 'These are the notes',
        options: {
          foo: 'bar',
        },
      }
      const [status, data] = await api.post(`/option-packs/suggest/${a}`, body, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.equal(data.submission.type, `opack`)
      assert.equal(typeof data.submission.id, `string`)
    })
  })

  describe(`Option Pack Tests (unauthenticated, created with ${a})`, () => {
    it(`Shoud read an option pack created with ${a}`, async () => {
      const [status, data] = await api.get(`/option-packs/${store.apack[a].id}`)
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.equal(typeof data.optionPack.options, `object`)
    })

    it(`Shoud read an option pack created with ${a} as JSON`, async () => {
      const [status, data] = await api.get(`/option-packs/${store.apack[a].id}.json`)
      assert.equal(status, 200)
      assert.equal(typeof data.options, `object`)
    })

    it(`Shoud read an option pack created with ${a} as YAML`, async () => {
      const [status, data] = await api.get(`/option-packs/${store.apack[a].id}.yaml`)
      assert.equal(status, 200)
      assert.equal(typeof data, `string`)
    })
  })
}

describe(`Option Pack Tests (unauthenticated)`, () => {
  it(`Shoud read a list of option packs`, async () => {
    const [status, data] = await api.get(`/option-packs`)
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    assert.equal(Array.isArray(data.optionPacks), true)
  })

  it(`Shoud read a list of option packs as JSON`, async () => {
    const [status, data] = await api.get(`/option-packs.json`)
    assert.equal(status, 200)
    assert.equal(Array.isArray(data), true)
  })

  it(`Shoud read a list of option packs as YAML`, async () => {
    const [status, data] = await api.get(`/option-packs.yaml`)
    assert.equal(status, 200)
    assert.equal(typeof data, 'string')
  })
})

for (const a of ['jwt', 'key']) {
  describe(`Option Pack Removal Tests (${a})`, () => {
    it(`Shoud remove an option pack (${a})`, async () => {
      const [status, data] = await api.delete(`/option-packs/${store.apack[a].id}/${a}`, auth[a])
      assert.equal(status, 204)
    })
  })
}
