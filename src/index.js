const { usingRefreshToken, validateScope, makeRefreshTokenWithWebFlow } = require('./auth')
const fsPromises = require('fs').promises

// Download your OAuth2 configuration from the Google Console/APIs ad Services/Credentials
const refreshTokenDBFile = './refreshTokenDB.json'
const keys = require('../oauth2.keys.json')
const scope = [
  'https://www.googleapis.com/auth/userinfo.profile', // so I can get name
  'https://www.googleapis.com/auth/photoslibrary.readonly'
]

main().catch(console.error)

/**
 * Start by acquiring a pre-authenticated oAuth2 client.
 */
async function main () {
  const renew = true
  const verify = true
  // First Part get an authenticaed OAuth2 token - and serialize it to file
  if (renew) {
    // const { tokens, tokenInfo } = await makeRefreshTokenWithWebFlow(keys, scope)
    const refreshTokenDBEntry = await makeRefreshTokenWithWebFlow(keys, scope)
    console.info(`Refresh token acquired. (${refreshTokenDBEntry.id})`)
    // console.debug('-', { refreshTokenDBEntry })

    await fsPromises.writeFile(refreshTokenDBFile, JSON.stringify(refreshTokenDBEntry))
    console.info('Refresh Token persisted.')
  }

  // Second part de-seraialze the token and us it to make an authenticaed API call
  if (verify) {
    const { refreshToken } = JSON.parse(await fsPromises.readFile(refreshTokenDBFile))
    console.info('Refresh token read.')

    // TODO: add optional validation to usingRefreshToken)
    const oAuth2Client = await usingRefreshToken(keys, refreshToken)
    console.info('Client acquired.')

    const scopesOk = await validateScope(oAuth2Client, scope)
    if (!scopesOk) {
      throw new Error('Missing authorization scopes')
    }

    {
      console.log('Calling OAuth userInfo - to validate token')
      const url = 'https://www.googleapis.com/oauth2/v3/userinfo'
      const { data: { name, sub: id } } = await oAuth2Client.request({ url })
      console.log(`Worked cause I know your name:${name} (${id})`)
    }
    {
      console.log('Calling People API - to validate token')
      const url = 'https://people.googleapis.com/v1/people/me?personFields=names'
      const { data: { resourceName, names } } = await oAuth2Client.request({ url })
      console.log(`Worked cause I know your name:${names[0].displayName} (${resourceName})`)
    }
  }
  await listItems()
}

async function listItems () {
  const { refreshToken } = JSON.parse(await fsPromises.readFile(refreshTokenDBFile))
  console.info('Refresh token read.')

  const oAuth2Client = await usingRefreshToken(keys, refreshToken)
  console.info('Client acquired.')

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
