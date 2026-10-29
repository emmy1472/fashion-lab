import { api, auth, cat, store } from './utils.mjs'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const email = 'test@freesewing.dev'

describe(`Signup flow and authentication`, () => {
  it(`Should return 400 on signup without body`, async () => {
    const [status, data] = await api.post('/signup')
    assert.equal(status, 400)
    assert.equal(data.result, `error`)
    assert.equal(data.error, `postBodyMissing`)
  })

  it(`Should signup`, async () => {
    const [status, data] = await api.post('/signup', { email })
    assert.equal(status, 201)
    assert.equal(data.result, 'created')
    assert.equal(data.email, email)
  })

  it(`Should pretend to signup an existing email address`, async () => {
    const [status, data] = await api.post('/signup', { email })
    assert.equal(status, 201)
    assert.equal(data.result, 'created')
    assert.equal(data.email, email)
  })

  it(`Should not sign in with the wrong password`, async () => {
    const [status, data] = await api.post('/signin', {
      username: store.account.username,
      password: store.account.username,
    })
    assert.equal(status, 401)
    assert.equal(data.error, 'signInFailed')
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

  it(`Should set the password (altaccount)`, async () => {
    const [status, data] = await api.patch(
      '/account/jwt',
      { password: store.altaccount.password },
      auth.altjwt
    )
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const key of ['email', 'username', 'id']) {
      assert.equal(data.account[key], store.altaccount[key])
    }
  })

  it(`Should sign in with username and password`, async () => {
    const [status, data] = await api.post('/signin', {
      username: store.account.username,
      password: store.account.password,
    })
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const key of ['email', 'username', 'id']) {
      assert.equal(data.account[key], store.account[key])
    }
  })

  it(`Should sign in with USERNAME and password`, async () => {
    const [status, data] = await api.post('/signin', {
      username: store.account.username.toUpperCase(),
      password: store.account.password,
    })
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const key of ['email', 'username', 'id']) {
      assert.equal(data.account[key], store.account[key])
    }
  })

  it(`Should sign in with email and password`, async () => {
    const [status, data] = await api.post('/signin', {
      username: store.account.email,
      password: store.account.password,
    })
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const key of ['email', 'username', 'id']) {
      assert.equal(data.account[key], store.account[key])
    }
  })

  it(`Should sign in with EMAIL and password`, async () => {
    const [status, data] = await api.post('/signin', {
      username: store.account.email.toUpperCase(),
      password: store.account.password,
    })
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const key of ['email', 'username', 'id']) {
      assert.equal(data.account[key], store.account[key])
    }
  })

  it(`Should sign in with ID and password`, async () => {
    const [status, data] = await api.post('/signin', {
      username: store.account.id,
      password: store.account.password,
    })
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const key of ['email', 'username', 'id']) {
      assert.equal(data.account[key], store.account[key])
    }
  })

  it(`Should load the account data (jwt)`, async () => {
    const [status, data] = await api.get(`/account/jwt`, auth.jwt)
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const key of ['email', 'username', 'id']) {
      assert.equal(data.account[key], store.account[key])
    }
  })

  it(`Should load the account data via whoami (jwt)`, async () => {
    const [status, data] = await api.get(`/whoami/jwt`, auth.jwt)
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const key of ['email', 'username', 'id']) {
      assert.equal(data.account[key], store.account[key])
    }
  })
})

describe(`Check for available usernames`, () => {
  it(`Should find an available username (jwt)`, async () => {
    const [status, data] = await api.post(
      `/available/username/jwt`,
      { username: 'haichi' },
      auth.jwt
    )
    assert.equal(status, 404)
  })

  it(`Should find a non-available username (jwt)`, async () => {
    const [status, data] = await api.post(
      `/available/username/jwt`,
      { username: store.account.username },
      auth.jwt
    )
    assert.equal(status, 200)
  })
})
