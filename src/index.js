const { getAuthenticatedClient } = require('./auth')

// Download your OAuth2 configuration from the Google Console/APIs ad Services/Credentials
const keys = require('../oauth2.keys.json')
const scope = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/photoslibrary.readonly'
]

/**
 * Start by acquiring a pre-authenticated oAuth2 client.
 */
async function main () {
  const oAuth2Client = await getAuthenticatedClient(keys, scope)

  // After acquiring an access_token, you may want to check on the audience, expiration,
  // or original scopes requested.  You can do that with the `getTokenInfo` method.
  const tokenInfo = await oAuth2Client.getTokenInfo(
    oAuth2Client.credentials.access_token
  )
  console.log({ tokenInfo })

  // Make a simple request to the People API using our pre-authenticated client. The `request()` method
  // takes an GaxiosOptions object.  Visit https://github.com/JustinBeckwith/gaxios.
  const url = 'https://people.googleapis.com/v1/people/me?personFields=names'
  const res = await oAuth2Client.request({ url })
  console.log({ res })
}

main().catch(console.error)
