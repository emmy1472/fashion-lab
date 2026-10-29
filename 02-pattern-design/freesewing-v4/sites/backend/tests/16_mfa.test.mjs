import { authenticator } from '@otplib/preset-default'
import { api, auth, cat, store } from './utils.mjs'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const secret = {
  jwt: store.account,
  key: store.altaccount,
}

for (const a of ['jwt']) {
  describe(`Setup Multi-Factor Authentication (MFA)`, () => {
    it(`Should return 400 on MFA enable without proper value`, async () => {
      const body = { mfa: 'test', test: true }
      const [status, data] = await api.post(`/account/mfa/${a}`, body, auth[a])
      assert.equal(status, 400)
      //assert.deepStrictEqual(data.account[field], val)
    })

    it(`Should return MFA secret and QR code`, async () => {
      const body = { mfa: true, test: true }
      const [status, data] = await api.post(`/account/mfa/${a}`, body, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.equal(typeof data.mfa.secret, 'string')
      assert.equal(typeof data.mfa.otpauth, 'string')
      assert.equal(typeof data.mfa.qrcode, 'string')
      secret[a] = data.mfa.secret
    })

    let scratchCodes = null

    it(`Should enable MFA after validating the token`, async () => {
      const body = {
        mfa: true,
        test: true,
        secret: secret[a],
        token: authenticator.generate(secret[a]),
      }
      const [status, data] = await api.post(`/account/mfa/${a}`, body, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      assert.equal(data.account.id, store.account.id)
      assert.equal(Array.isArray(data.scratchCodes), true)
      scratchCodes = data.scratchCodes
    })

    it(`Should not request MFA when it is already active`, async () => {
      const body = { mfa: true, test: true }
      const [status, data] = await api.post(`/account/mfa/${a}`, body, auth[a])
      assert.equal(status, 400)
      assert.equal(data.result, `error`)
    })

    it(`Should not enable MFA when it is already active`, async () => {
      const body = {
        mfa: true,
        test: true,
        secret: secret[a],
        token: authenticator.generate(secret[a]),
      }
      const [status, data] = await api.post(`/account/mfa/${a}`, body, auth[a])
      assert.equal(status, 400)
      assert.equal(data.result, `error`)
    })

    // Note that password was not set at account creation
    it(`Should set the password`, async () => {
      const [status, data] = await api.patch(
        '/account/jwt',
        { password: store.account.password },
        auth.jwt
      )
      assert.equal(status, 200)
      assert.equal(data.result, 'success')
      for (const key of ['email', 'username', 'id']) {
        assert.equal(data.account[key], store.account[key])
      }
    })

    it(`Should not sign in with username/password only`, async () => {
      const body = {
        username: store.account.username,
        password: store.account.password,
      }
      const [status, data] = await api.post(`/signin`, body)
      assert.equal(status, 403)
      assert.equal(data.result, `error`)
      assert.equal(data.error, `mfaTokenRequired`)
    })

    it(`Should sign in with username/password/token`, async () => {
      const body = {
        username: store.account.username,
        password: store.account.password,
        token: authenticator.generate(secret[a]),
      }
      const [status, data] = await api.post(`/signin`, body)
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      for (const key of ['email', 'username', 'id']) {
        assert.equal(data.account[key], store.account[key])
      }
    })

    it(`Should not sign in with the wrong token`, async () => {
      const body = {
        username: store.account.username,
        password: store.account.password,
        token: 'wrong',
      }
      const [status, data] = await api.post(`/signin`, body)
      assert.equal(status, 401)
      assert.equal(data.result, `error`)
      assert.equal(data.error, `signInFailed`)
    })

    it(`Should sign in with a scratch code`, async () => {
      const body = {
        username: store.account.username,
        password: store.account.password,
        token: scratchCodes[0],
      }
      const [status, data] = await api.post(`/signin`, body)
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      for (const key of ['email', 'username', 'id']) {
        assert.equal(data.account[key], store.account[key])
      }
    })

    it(`Should disable MFA (with scratch code)`, async () => {
      const body = {
        mfa: false,
        password: store.account.password,
        token: scratchCodes[1],
      }
      const [status, data] = await api.post(`/account/mfa/${a}`, body, auth[a])
      assert.equal(status, 200)
      assert.equal(data.result, `success`)
      for (const key of ['email', 'username', 'id']) {
        assert.equal(data.account[key], store.account[key])
      }
    })
  })
}
