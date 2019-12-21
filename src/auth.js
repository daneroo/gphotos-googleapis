const { OAuth2Client } = require('google-auth-library')
const http = require('http')
const url = require('url')
const open = require('open')
const enableDestroy = require('server-destroy')

// Download your OAuth2 configuration from the Google
// const keys = require('../oauth2.keys.json')

module.exports = {
  getAuthenticatedClient,
  getNewTokens,
  // - end of public API
  validateForLocalUse,
  getTokenFromAuthorizationCode,
  getAuthorizationCode
}

// might want to verfy requested scopes
//  return an authenticated OAuth2Client
async function getAuthenticatedClient (keys, tokens) {
  const { error } = validateForLocalUse(keys)
  if (error) {
    throw error
  }
  const oAuth2Client = new OAuth2Client(
    keys.web.client_id,
    keys.web.client_secret,
    keys.web.redirect_uris[0]
  )

  // After acquiring an access_token, you may want to check on the audience, expiration,
  // or original scopes requested.  You can do that with the `getTokenInfo` method.
  oAuth2Client.setCredentials(tokens)

  // Does this validation belong here?
  const tokenInfo = await oAuth2Client.getTokenInfo(
    oAuth2Client.credentials.access_token
  )
  return { oAuth2Client, tokenInfo }
}

// This triggers a new web flow, opening op a browser window
// returns { tokens, tokenInfo }
async function getNewTokens (keys, scope) {
  const { callbackPath, localPort, error } = validateForLocalUse(keys)
  if (error) {
    throw error
  }
  const oAuth2Client = new OAuth2Client(
    keys.web.client_id,
    keys.web.client_secret,
    keys.web.redirect_uris[0]
  )

  const code = await getAuthorizationCode(oAuth2Client, callbackPath, localPort, scope)
  // console.debug(`Got the authorization code: ${code}`)
  const tokens = await getTokenFromAuthorizationCode(oAuth2Client, code)
  // console.debug('Got new tokens', { tokens })

  oAuth2Client.setCredentials(tokens)
  const tokenInfo = await oAuth2Client.getTokenInfo(
    oAuth2Client.credentials.access_token
  )

  return { tokens, tokenInfo }
}

// validate that the keys object is valid for a local (127.0.0.1) OAuth2 flow.
// Has the shape:
// {
//   "web": {
//     "client_id": "627240905859-l6v439arpiko8kbev2guqpibkjhg1ga0.apps.googleusercontent.com",
//     "client_secret": "Frn3mgoAZp1oSx8Dc3IqmLdt",
//     "redirect_uris": [
//       "http://127.0.0.1:8080/auth/google/callback"
//     ]
//   }
// }
// Returns the expected path and port for first local rediect_uri
// return {
//   callbackPath:'/some/callback/path',
//   localPort:8080
// }
//   or an error
// return {
//   error: "If there was an error"
// }
function validateForLocalUse (keys) {
  if (!keys || !keys.web || !keys.web.client_id || !keys.web.client_secret ||
     !keys.web.redirect_uris) {
    return { error: 'Missing at least one required parameter : `{web:{client_id,client_secret,redirect_uris:[]`' }
  }
  if (!Array.isArray(keys.web.redirect_uris)) {
    return { error: '`keys.web.redirect_uris` is not an Array' }
  }
  if (!keys.web.redirect_uris.length > 0) {
    return { error: 'Missing `keys.web.redirect_uris[]` entries' }
  }
  const localUris = keys.web.redirect_uris.filter(u => u.startsWith('http://127.0.0.1'))
  if (localUris.length < 1) {
    return { error: '`keys.web.redirect_uris[]` should have at least 1 entry with `http://127.0.0.1` prefix' }
  }
  try {
    const u = new url.URL(localUris[0])
    const port = Number(u.port)
    if (port === 0) {
      throw new Error('http port should be explicit for local url')
    }
    return {
      callbackPath: u.pathname,
      localPort: port
    }
  } catch (err) {
    return { error: '`keys.web.redirect_uris[]` ' + `error:${err}` }
  }
}

// Create a new OAuth2Client, and go through the OAuth2 content workflow.
async function getTokenFromAuthorizationCode (oAuth2Client, code) {
  const r = await oAuth2Client.getToken(code)
  // Make sure to set the credentials on the OAuth2 client.
  // console.debug({ r })
  return (r.tokens)
}

// get an authorization code for the Oauth2 client, from which access and refresh tokens may be obtained
async function getAuthorizationCode (oAuth2Client, callbackPath, localPort, scope = ['https://www.googleapis.com/auth/userinfo.profile']) {
  return new Promise((resolve, reject) => {
    const authorizeUrl = oAuth2Client.generateAuthUrl({
    // prompt: 'consent', // force consent, if a refresh token has already been emitted...
      access_type: 'offline',
      scope: scope
    })

    // TODO: add a timeout?
    // Open an http server to accept a single request: the oauth callback.
    const server = http
      .createServer(async (req, res) => {
        try {
          const incomingURL = new url.URL(req.url, `http://127.0.0.1:${localPort}`)
          // this should match: keys.web.redirect_uris[0] path part: e.g. /auth/google/callback
          if (callbackPath !== incomingURL.pathname) {
            console.warn(`Incoming url path: ${incomingURL.pathname} was expected to match redirect_uris[] path: ${callbackPath}}`)
          }

          const qs = incomingURL.searchParams
          const code = qs.get('code')

          if (!code) {
            throw new Error('Code not found in callback, return to console')
          }

          res.end('Authentication successful! Please return to the console.')
          server.destroy()
          resolve(code)
        } catch (e) {
          res.end('Authentication was not successful, Please return to console')
          server.destroy()
          reject(e)
        }
      })
      .listen(localPort, () => {
      // open the browser to the authorize url to start the workflow
        open(authorizeUrl, { wait: false }).then(cp => cp.unref())
      })

    // enhance server with a 'destroy' function
    enableDestroy(server)
  })
}
