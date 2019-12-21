const { OAuth2Client } = require('google-auth-library')
const http = require('http')
const url = require('url')
const open = require('open')
const enableDestroy = require('server-destroy')

// Download your OAuth2 configuration from the Google
// const keys = require('../oauth2.keys.json')

module.exports = {
  getAuthenticatedClient,
  // validate(keys): TODO: add to getPathAndPort validation
  getPathAndPort
}

// Create a new OAuth2Client, and go through the OAuth2 content workflow.
function getAuthenticatedClient (keys, scope = ['https://www.googleapis.com/auth/userinfo.profile']) {
  return new Promise((resolve, reject) => {
    // create an oAuth client to authorize the API call.
    // Secrets are passed in the `keys` object,
    // which has the format of the credentials downloaded from the Google Developers Console.
    // const keys = {
    //   web: {
    //     client_id: '...',
    //     client_secret: '...',
    //     redirect_uris: [
    //       'http://127.0.0.1:SOMEPORT/SOMEPATH'
    //     ]
    //   }
    // }

    const oAuth2Client = new OAuth2Client(
      keys.web.client_id,
      keys.web.client_secret,
      keys.web.redirect_uris[0]
    )

    // This is where I might persist tokens for re-use
    // oAuth2Client.on('tokens', (tokens) => {
    //   console.log('tokens event:')
    //   if (tokens.refresh_token) {
    //     // store the refresh_token in my database!
    //     console.log('tokens event:refresh_token', tokens.refresh_token)
    //   }
    //   console.log('tokens event:access_token', tokens.access_token)
    // })

    // Generate the url that will be used for the consent dialog.
    // If you need to obtain a new refresh_token,
    //  ensure the call to generateAuthUrl sets the access_type to offline.
    //  The refresh token will only be returned for the first authorization by the user.
    //  To force consent, set the prompt property to 'consent':

    const authorizeUrl = oAuth2Client.generateAuthUrl({
      // prompt: 'consent',
      access_type: 'offline',
      scope: scope
    })

    const { path, port, error } = getPathAndPort(keys)
    if (error) {
      const errorMessage = `Could not determine path and port for callback from keys: ${error}`
      console.error(errorMessage)
      console.error({ path, port, keys })
      reject(new Error(errorMessage))
      return
    }

    // TODO: add a timeout?
    // Open an http server to accept asiggnlge request: the oauth callback.
    const server = http
      .createServer(async (req, res) => {
        try {
          const incomingURL = new url.URL(req.url, `http://127.0.0.1:${port}`)
          console.debug({ incomingURL })
          // this should match: keys.web.redirect_uris[0] path part: i.e. auth/google/callback
          if (path !== incomingURL.pathname) {
            // TODO: test if non-specified path in credentials is allowed
            console.warn(`Incoming url path: ${incomingURL.pathname} was expected to match redirect_uris[] path: ${path}}`)
          }
          const qs = incomingURL.searchParams
          console.debug({ qs })

          const code = qs.get('codeZ')
          console.log(`Code is ${code}`)

          if (!code) {
            throw new Error('Code not found in callback, return to console')
          }

          res.end('Authentication successful! Please return to the console.')
          server.destroy()

          // Now that we have the code, use that to acquire tokens.
          const r = await oAuth2Client.getToken(code)
          // Make sure to set the credentials on the OAuth2 client.
          console.debug({ r })
          oAuth2Client.setCredentials(r.tokens)
          console.info('Tokens acquired.')
          resolve(oAuth2Client)
        } catch (e) {
          res.end('Authentication was not successful, Please return to console')
          server.destroy()
          reject(e)
        }
      })
      .listen(port, () => {
        // open the browser to the authorize url to start the workflow
        open(authorizeUrl, { wait: false }).then(cp => cp.unref())
      })

    // enhance server with a 'destroy' function
    enableDestroy(server)
  })
}

// Get the path and port portions of a local redirect_uri in the keys object
// "redirect_uris": [
//   "http://127.0.0.1:8080/auth/google/callback"
// ]
// return {
//   psth:'/some/path',
//   port:8080
//   error: "If there was an error"
// }
function getPathAndPort (keys) {
  if (!keys) {
    return { error: 'Missing `keys` parameter' }
  }
  if (!keys.web) {
    return { error: 'Missing `keys.web` parameter' }
  }
  if (!keys.web.redirect_uris) {
    return { error: 'Missing `keys.web.redirect_uris` parameter' }
  }
  if (!Array.isArray(keys.web.redirect_uris)) {
    return { error: '`keys.web.redirect_uris` is not an Array' }
  }
  if (!keys.web.redirect_uris.length > 0) {
    return { error: 'Missing `keys.web.redirect_uris[]` entries' }
  }
  const localUris = keys.web.redirect_uris.filter(u => u.startsWith('http://127.0.0.1'))
  if (localUris.length !== 1) {
    return { error: '`keys.web.redirect_uris[]` should have eactly 1 entry with `http://127.0.0.1` prefix' }
  }
  try {
    const u = new url.URL(localUris[0])
    // console.log({ u })
    return {
      path: u.pathname,
      port: Number(u.port)
    }
  } catch (err) {
    return { error: '`keys.web.redirect_uris[]` ' + `error:${err}` }
  }
}
