const fsPromises = require('fs').promises
const {
  usingRefreshToken
} = require('@daneroo/get-me-a-googleapi-refresh-token/src/auth')

// Download your OAuth2 configuration from the Google Console/APIs ad Services/Credentials
const keysFile = './oauth2.keys.json'
// const tokenFile = './tokens-peru.lauzon-2022-08-22.json'
const tokenFile = './tokens-daniel.lauzon-2022-08-22.json'

main().catch(console.error)

/**
 * Start by acquiring a pre-authenticated oAuth2 client.
 */
async function main () {
  const { clientId, clientSecret, scopes } = JSON.parse(
    await fsPromises.readFile(keysFile)
  )
  console.info('Keys read.')
  // read the refreshTOken
  const { refreshToken } = JSON.parse(await fsPromises.readFile(tokenFile))
  console.info('Refresh token read.')

  // TODO: add optional validation to usingRefreshToken)
  const oAuth2Client = await usingRefreshToken({
    clientId,
    clientSecret,
    refreshToken,
    scopes,
    verbose: true
  })
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
  let totalPages = 0
  while (true) {
    const res = await oAuth2Client.request({ url, params })
    const { mediaItems, nextPageToken } = res.data
    total += mediaItems.length
    totalPages += 1
    console.log(
      `- p.${totalPages} ${
        mediaItems.length
      } total:${total} more:${!!nextPageToken}`
    )
    firstItem = mediaItems[0]
    console.log('  ', firstItem.filename, firstItem.baseUrl.slice(0, 64), '...')
    if (nextPageToken) {
      params.pageToken = nextPageToken
    } else {
      break
    }
  }
  console.log(`Listed ${total} items in ${totalPages} pages`)
  console.log(`just need to download them now... (and incomplete exif data)`)
}
