const fsPromises = require('fs').promises
const { usingRefreshToken } = require('@daneroo/get-me-a-googleapi-refresh-token/src/auth')

// Download your OAuth2 configuration from the Google Console/APIs ad Services/Credentials
const keysFile = './oauth2.keys.json'
const tokenFile = './tokens.json'

main().catch(console.error)

/**
 * Start by acquiring a pre-authenticated oAuth2 client.
 */
async function main () {
  const { clientId, clientSecret, scopes } = JSON.parse(await fsPromises.readFile(keysFile))
  console.info('Keys read.')
  // read the refreshTOken
  const { refreshToken } = JSON.parse(await fsPromises.readFile(tokenFile))
  console.info('Refresh token read.')

  // TODO: add optional validation to usingRefreshToken)
  const oAuth2Client = await usingRefreshToken({ clientId, clientSecret, refreshToken, scopes, verbose: true })
  console.info('Client acquired.')

  await listItems(oAuth2Client)
}

async function listItems (oAuth2Client) {
  const params = {
    pageSize: 100 // max is 100
    // pageToken : res.nextPageToken
  }

  const url = 'https://photoslibrary.googleapis.com/v1/mediaItems'
  let total = 0
  while (true) {
    const res = await oAuth2Client.request({ url, params })
    const { mediaItems, nextPageToken } = res.data
    total += mediaItems.length
    console.log(`.. added ${mediaItems.length} total:${total} more:${!!nextPageToken}`)
    // console.log({ nextPageToken })
    if (nextPageToken) {
      params.pageToken = nextPageToken
    } else {
      break
    }
  }
}
