import { api, auth, cat, store } from './utils.mjs'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const data = {
  jwt: {
    bio: "I know it sounds funny but I just can't stand the pain",
    consent: 1,
    control: 4,
    data: {
      githubUsername: 'sorchanidhubhghaill',
      githubEmail: 'nidhubhs@gmail.com',
    },
    imperial: true,
    newsletter: true,
  },
  key: {
    bio: "It's a long way to the top, if you wanna rock & roll",
    consent: 2,
    control: 3,
    data: {
      githubUsername: 'joostdecock',
      githubEmail: 'joost@joost.at',
    },
    imperial: true,
    newsletter: true,
  },
}

for (const a of ['jwt', 'key']) {
  describe(`Update account data (${a})`, () => {
    for (const [field, val] of Object.entries(data[a])) {
      it(`Should update ${field} (${a})`, async () => {
        const body = {}
        body[field] = val
        const [status, data] = await api.patch(`/account/${a}`, body, auth[a])
        assert.equal(status, 200)
        assert.equal(data.result, `success`)
        assert.deepStrictEqual(data.account[field], val)
      })
    }

    it(`Should update password (${a})`, async () => {
      const [status, data] = await api.patch(`/account/${a}`, { password: 'password' }, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
    })

    if (a === 'jwt') {
      it(`Should be able to sign in with the updated password`, async () => {
        const [status, data] = await api.post(`/signin`, {
          username: store.account.id,
          password: 'password',
        })
        assert.equal(status, 200)
        assert.equal(data.result, `success`)
      })

      it(`Restore the original password (${a})`, async () => {
        const [status, data] = await api.patch(
          `/account/${a}`,
          { password: store.account.password },
          auth[a]
        )
        assert.equal(status, 200)
        assert.equal(data.result, `success`)
      })

      it(`Should be able to sign in with the original password`, async () => {
        const [status, data] = await api.post(`/signin`, {
          username: store.account.id,
          password: store.account.password,
        })
        assert.equal(status, 200)
        assert.equal(data.result, `success`)
      })
    }

    const username = store.randomString().toUpperCase()
    it(`Should update username (and lusername) (${a})`, async () => {
      const [status, data] = await api.patch(`/account/${a}`, { username }, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.deepStrictEqual(data.account.username, username)
      assert.deepStrictEqual(data.account.lusername, username.toLowerCase())
    })

    it(`Should update username (restore original) (${a})`, async () => {
      const [status, data] = await api.patch(
        `/account/${a}`,
        { username: store.account.username },
        auth[a]
      )
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.deepStrictEqual(data.account.username, store.account.username)
      assert.deepStrictEqual(data.account.lusername, store.account.username.toLowerCase())
    })

    // Running this twice immeadiatly (jwt and key) will break
    // because cloudflare api will not be ready yet, we we only do jwt
    //if (a === 'jwt') {
    //  it(`Should update the account image (${a})`, async () => {
    //    const [status, data] = await api.patch(`/account/${a}`, { img: cat }, auth[a])
    //    assert.equal(status, 200)
    //    assert.equal(data.result, `success`)
    //  })
    //}

    let confirmation, check
    it(`Should update the account email address (${a})`, async () => {
      const [status, data] = await api.patch(
        `/account/${a}`,
        {
          email: `updated_${store.account.email}`,
          test: true,
        },
        auth[a]
      )
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      confirmation = data.confirmation
      check = data.check
    })

    it(`Should confirm the email change (${a})`, async () => {
      const [status, data] = await api.patch(
        `/account/${a}`,
        {
          confirm: 'emailchange',
          confirmation,
          check,
        },
        auth[a]
      )
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
    })

    it(`Should restore the account email address (${a})`, async () => {
      const [status, data] = await api.patch(
        `/account/${a}`,
        {
          email: store.account.email,
          test: true,
        },
        auth[a]
      )
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      confirmation = data.confirmation
      check = data.check
    })

    it(`Should confirm the restored email change (${a})`, async () => {
      const [status, data] = await api.patch(
        `/account/${a}`,
        {
          confirm: 'emailchange',
          confirmation,
          check,
        },
        auth[a]
      )
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
    })
  })
}
