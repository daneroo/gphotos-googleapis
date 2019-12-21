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
  // const oAuth2Client = await getAuthenticatedClient(keys, scope)

  // const tokens = {
  //   access_token: 'ya29.Il-2B7loI2kmcSbVI0A_4UXXtcPXYases97nNqEh7e56_bZ8y3mQyGL35Gll5rRgJlefj9YLY0KdFcJ12z0EfzjMKH6vRwlIA2-Uac7JGehMJvvB32TozXPRv7bDcAiq_w',
  //   refresh_token: '1//05WUnGVgfiYZxCgYIARAAGAUSNwF-L9Ir8XriVTOhSkcQOT2RPYR7peXXmfKeju01OD1YO6NcbfHKPZhK2oCEvNdrOZ2yM7A-yVI',
  //   // scope: 'https://www.googleapis.com/auth/userinfo.profile',
  //   token_type: 'Bearer',
  //   id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU3YjE5MjhmMmY2MzMyOWYyZTkyZjRmMjc4Zjk0ZWUxMDM4YzkyM2MiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI2MjcyNDA5MDU4NTktbDZ2NDM5YXJwaWtvOGtiZXYyZ3VxcGlia2poZzFnYTAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI2MjcyNDA5MDU4NTktbDZ2NDM5YXJwaWtvOGtiZXYyZ3VxcGlia2poZzFnYTAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTQ4MDI5NTY5MjM0NTM1Mzk0MjMiLCJhdF9oYXNoIjoiTmlSS1R6aHBldGxxa2pEMFhBSHo2QSIsIm5hbWUiOiJEYW5pZWwgTGF1em9uIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BQXVFN21CbUhsQWQ2T2JZX3dYVXJua1V6RVBOT0g1cTU1YW5YVl8tTUZzU2VnPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IkRhbmllbCIsImZhbWlseV9uYW1lIjoiTGF1em9uIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE1NzY4OTYzMjAsImV4cCI6MTU3Njg5OTkyMH0.f5vHmjKtUqhWOywSGCvI6eOUgldJTdmwQO-X3wpHljP6Uf0F-933ol-0f-kjVoZYgKGEkgDyh1lQS7znhUyjvu4ZrQ4Z0uRpn7bCSjUtvmPDXZ_vQRLt4YS7-xjmPCQt0DCJ923upWbCBRkoEfjF5FtbGj-mhs4D70gFOrHXOeNxNpaC8mvp7RdOChHuCY7yRsgvoO8-zOmu1cbQCfw0fklOe4k0t2TjljrGo82bdKkSaDsis7WtHXdFnWmC4_4PDAyMDAlE_w8p7t4Tm92bBnkhQ0HMt7FkSoMt2PXjyYXxAT7EVY5rbmwYWLMDShU5W8wvKdc4giDzEdGTKryGyQ',
  //   expiry_date: 1576899920737
  // }

  const { tokens, tokenInfo } = await getNewTokens(keys, scope)
  console.info('Tokens acquired.')
  console.debug('-', { tokenInfo })
  await fsPromises.writeFile(tokenFile, JSON.stringify(tokens))
  console.info('Tokens persisted.')

  console.log('-', { tokenInfo })

  await reuseTokenAfterSerialising()
}

async function reuseTokenAfterSerialising () {
  const tokens = JSON.parse(await fsPromises.readFile(tokenFile))
  console.log('+', { tokens })

  const { oAuth2Client, tokenInfo } = await getAuthenticatedClient(keys, tokens)
  console.log('+', { tokenInfo })

  // Make a simple request to the People API using our pre-authenticated client. The `request()` method
  // takes an GaxiosOptions object.  Visit https://github.com/JustinBeckwith/gaxios.
  const url = 'https://people.googleapis.com/v1/people/me?personFields=names'
  const res = await oAuth2Client.request({ url })
  console.log(res.data)
}
