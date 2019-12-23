# gphotos-googleapis

- Get a token and list all photos

## TODO

- Document provisioning App Credentials
- Remove a level from `oauth2.keys.json`
- Implement refreshTokensDB.json
  - persist refresh token by account
- yargs: verify,renew,noauth,user
- extract Auth/TokenManagement into npm
- renovate
- `google-auth-library` is included in `googleapis`, switch to that

## OAuth2 Flow

This is the OAuth2 flow as descibed in <https://github.com/googleapis/google-auth-library-nodejs#oauth2> and <https://github.com/googlesamples/google-photos/tree/master/REST/PhotoFrame>.

This is meant to get local credententials, for local development (i.e. the OAuth callback is on <http://127.0.0.1>).

- Prepare som credentials in the [Google Developpers Console]
  - Select a (possibly new) project
  - Enable the API's you want to use in the APIs & Services Section/Library
  - Create OAuth client ID from the dropdown and give it a  name: `OAuth CLient` for example
    - Application type: Web Application, and give it a name
    - Set the authorized JavaScript origin to <http://127.0.0.1>
    - Set authorized redirect URL to http://127.0.0.1:8080/auth/google/callback

## References

- <https://github.com/googleapis/google-auth-library-nodejs#oauth2>
- <https://github.com/googlesamples/google-photos/tree/master/REST/PhotoFrame>