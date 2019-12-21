const { getPathAndPort } = require('./auth')

describe('Auth', () => {
  test.each([
    [['http://127.0.0.1:8080/auth/google/callback'], { path: '/auth/google/callback', port: 8080 }],
    [['http://127.0.0.1:3000/someotherpath'], { path: '/someotherpath', port: 3000 }]
  ])('.getPathAndPort(%j)', (redirectUris, expected) => {
    const keys = { web: { redirect_uris: redirectUris } }
    expect(getPathAndPort(keys)).toEqual(expected)
  })

  // negative cases: tightly couple to error message: boo!
  test.each([
    [null, { error: 'Missing `keys` parameter' }],
    [{}, { error: 'Missing `keys.web` parameter' }],
    [{ web: {} }, { error: 'Missing `keys.web.redirect_uris` parameter' }],
    [{ web: { redirect_uris: {} } }, { error: '`keys.web.redirect_uris` is not an Array' }],
    [{ web: { redirect_uris: [] } }, { error: 'Missing `keys.web.redirect_uris[]` entries' }],
    [{ web: { redirect_uris: ['https://some.com'] } }, { error: '`keys.web.redirect_uris[]` should have eactly 1 entry with `http://127.0.0.1` prefix' }],
    [{ web: { redirect_uris: ['http://localhost/path'] } }, { error: '`keys.web.redirect_uris[]` should have eactly 1 entry with `http://127.0.0.1` prefix' }],
    [{ web: { redirect_uris: ['http://127.0.0.1/path', 'http://127.0.0.1/otherpath'] } }, { error: '`keys.web.redirect_uris[]` should have eactly 1 entry with `http://127.0.0.1` prefix' }],
    [{ web: { redirect_uris: ['http://127.0.0.1:NotAPortNumberN/path'] } }, { error: '`keys.web.redirect_uris[]` error:TypeError [ERR_INVALID_URL]: Invalid URL: http://127.0.0.1:NotAPortNumberN/path' }],
    [null, { error: 'Missing `keys` parameter' }]
  ])('.getPathAndPort(%j)', (keys, expected) => {
    expect(getPathAndPort(keys)).toEqual(expected)
  })
})
