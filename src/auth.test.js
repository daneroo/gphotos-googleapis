const { validateForLocalUse } = require('./auth')

describe('Auth', () => {
  // negative cases: tightly coupled to error message: boo!
  const ok = { client_id: 'X', client_secret: 'X' } // shorthand for basic props
  const missingError = { error: 'Missing at least one required parameter : `{web:{client_id,client_secret,redirect_uris:[]}}`' }
  test.each([
    [null, missingError],
    [{}, missingError],
    [{ web: {} }, missingError],
    [{ web: { client_id: '', client_secret: '' } }, missingError],
    [{ web: { client_id: '', redirect_uris: '' } }, missingError],
    [{ web: { client_secret: '', redirect_uris: '' } }, missingError],
    [{ web: { ...ok, redirect_uris: {} } }, { error: '`keys.web.redirect_uris` is not an Array' }],
    [{ web: { ...ok, redirect_uris: [] } }, { error: 'Missing `keys.web.redirect_uris[]` entries' }],
    [{ web: { ...ok, redirect_uris: ['https://some.com'] } }, { error: '`keys.web.redirect_uris[]` should have at least 1 entry with `http://127.0.0.1` prefix' }],
    [{ web: { ...ok, redirect_uris: ['http://localhost/path'] } }, { error: '`keys.web.redirect_uris[]` should have at least 1 entry with `http://127.0.0.1` prefix' }],
    [{ web: { ...ok, redirect_uris: ['http://127.0.0.1:NotAPortNumberN/path'] } }, { error: '`keys.web.redirect_uris[]` error:TypeError [ERR_INVALID_URL]: Invalid URL: http://127.0.0.1:NotAPortNumberN/path' }]
  ])('.validateForLocalUse(%j)', (keys, expected) => {
    expect(validateForLocalUse(keys)).toEqual(expected)
  })

  test.each([
    [['http://127.0.0.1:8080/auth/google/callback'], { callbackPath: '/auth/google/callback', localPort: 8080, redirectUri: 'http://127.0.0.1:8080/auth/google/callback' }],
    [['http://127.0.0.1:3000/someotherpath'], { callbackPath: '/someotherpath', localPort: 3000, redirectUri: 'http://127.0.0.1:3000/someotherpath' }],
    [['http://127.0.0.1/pathafterNoPort'], { error: '`keys.web.redirect_uris[]` error:Error: http port should be explicit for local redirect URI' }],
    [['http://127.0.0.1:8888/firstpath', 'http://127.0.0.1:8765/otherpath'], { callbackPath: '/firstpath', localPort: 8888, redirectUri: 'http://127.0.0.1:8888/firstpath' }]
  ])('.validateForLocalUse(%j)', (redirectUris, expected) => {
    const keys = { web: { ...ok, redirect_uris: redirectUris } }
    expect(validateForLocalUse(keys)).toEqual(expected)
  })
})
