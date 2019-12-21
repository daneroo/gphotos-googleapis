const { getAuthenticatedClient, getNewTokens } = require('./auth')
const fsPromises = require('fs').promises

// Download your OAuth2 configuration from the Google Console/APIs ad Services/Credentials
const tokenFile = './tokens.json'
const keys = require('../oauth2.keys.json')
const scope = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/photoslibrary.readonly'
]

main().catch(console.error)

/**
 * Start by acquiring a pre-authenticated oAuth2 client.
 */
async function main () {
  // First Part get am authenticaed OAuth2 token - and serialize it to file
  {
    const { tokens, tokenInfo } = await getNewTokens(keys, scope)
    console.info('Tokens acquired.')
    console.debug('-', { tokenInfo })
    await fsPromises.writeFile(tokenFile, JSON.stringify(tokens))
    console.info('Tokens persisted.')
  }

  // Second part de-seraialze the toke and us it to make an authenticaed API call
  {
    const tokens = JSON.parse(await fsPromises.readFile(tokenFile))
    console.info('Tokens read.')

    const { oAuth2Client, tokenInfo } = await getAuthenticatedClient(keys, tokens)
    console.info('Client acquired.', tokenInfo)

    console.log('Calling people API')
    // Make a simple request to the People API using our pre-authenticated client. The `request()` method
    // takes an GaxiosOptions object.  Visit https://github.com/JustinBeckwith/gaxios.
    const url = 'https://people.googleapis.com/v1/people/me?personFields=names'
    const res = await oAuth2Client.request({ url })
    console.log(res.data)
  }
}
