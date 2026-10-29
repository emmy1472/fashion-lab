import { api, auth, cat, store } from './utils.mjs'
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

const email = 'test@freesewing.dev'
const fields = [
  'email',
  'bio',
  'compare',
  'consent',
  'control',
  'createdAt',
  'ehash',
  'email',
  'ihash',
  'imperial',
  'initial',
  'language',
  'mfaEnabled',
  'newsletter',
  'patron',
  'role',
  'status',
  'username',
  'lusername',
]
const accounts = {}

describe(`Signup flow and authentication`, () => {
  it(`Return 400 on signup without body`, async () => {
    const [status, data] = await api.post(`/signup`)
    assert.equal(status, 400)
  })

  it(`Do not allow signup without email`, async () => {
    const [status, data] = await api.post(`/signup`, {})
    assert.equal(status, 400)
  })

  it(`Pretend to signup an existing email`, async () => {
    const [status, data] = await api.post(`/signup`, { email })
    assert.equal(status, 201)
    assert.equal(data.result, 'created')
    assert.equal(data.email, email)
  })

  it(`Do not sign in with the wrong password`, async () => {
    const [status, data] = await api.post(`/signin`, {
      username: email,
      password: 'this is not the correct password',
    })
    assert.equal(status, 401)
    assert.equal(data.result, 'error')
    assert.equal(data.error, 'signInFailed')
    //console.log(data)
  })

  // Note that password was not set at account creation
  it(`Set the password`, async () => {
    const [status, data] = await api.patch(
      `/account/jwt`,
      {
        password: store.account.password,
      },
      auth.jwt
    )
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    accounts.main = data.account
  })

  it(`Set the password (altaccount)`, async () => {
    const [status, data] = await api.patch(
      `/account/jwt`,
      {
        password: store.altaccount.password,
      },
      auth.altjwt
    )
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    accounts.alt = data.account
  })

  it(`Sign in with username and password`, async () => {
    const [status, data] = await api.post(`/signin`, {
      username: store.account.username,
      password: store.account.password,
    })
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const field of fields) assert.equal(data.account[field], accounts.main[field])
  })

  it(`Sign in with USERNAME and password`, async () => {
    const [status, data] = await api.post(`/signin`, {
      username: store.account.username.toUpperCase(),
      password: store.account.password,
    })
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const field of fields) assert.equal(data.account[field], accounts.main[field])
  })

  it(`Sign in with email and password`, async () => {
    const [status, data] = await api.post(`/signin`, {
      username: store.account.email,
      password: store.account.password,
    })
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const field of fields) assert.equal(data.account[field], accounts.main[field])
  })

  it(`Sign in with EMAIL and password`, async () => {
    const [status, data] = await api.post(`/signin`, {
      username: store.account.email.toUpperCase(),
      password: store.account.password,
    })
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const field of fields) assert.equal(data.account[field], accounts.main[field])
  })

  it(`Sign in with ID and password`, async () => {
    const [status, data] = await api.post(`/signin`, {
      username: store.account.id,
      password: store.account.password,
    })
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const field of fields) assert.equal(data.account[field], accounts.main[field])
  })

  it(`Load the account (jwt)`, async () => {
    const [status, data] = await api.get(`/account/jwt`, auth.jwt)
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const field of fields) assert.equal(data.account[field], accounts.main[field])
  })

  it(`Load the account via whoami (jwt)`, async () => {
    const [status, data] = await api.get(`/whoami/jwt`, auth.jwt)
    assert.equal(status, 200)
    assert.equal(data.result, 'success')
    for (const field of fields) assert.equal(data.account[field], accounts.main[field])
  })
})

describe(`Check for available usernames`, () => {
  it(`Should find an available username (jwt)`, async () => {
    const body = {
      username: 'heixiaomao (better add some text in case someone registers this username)',
    }
    const [status, data] = await api.post(`/available/username/jwt`, body, auth.jwt)
    assert.equal(status, 404)
  })

  it(`Should find an unavailable username (jwt)`, async () => {
    const body = { username: 'joost' }
    const [status, data] = await api.post(`/available/username/jwt`, body, auth.jwt)
    assert.equal(status, 200)
    assert.equal(data.available, false)
  })
})
