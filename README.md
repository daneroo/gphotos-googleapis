# gphotos-googleapis

- Use a refresh token and list all photos

## Operation

Still manual:

```bash
cd ../get-me-a-googleapi-refresh-token/
node src/index.js generate # and put the output json into a `tokens-xxx.json` file in this directory
# edit the token file name in index.js
# in this directory
npm start # which will list all the photos (media items) for that account.
```

## TODO

- `npx @daneroo/get-me-a-googleapi-refresh-token`
- Implement refreshTokensDB.json
  - persist refresh token by account
- yargs: verify
- renovate

## References

- <https://github.com/daneroo/get-me-a-googleapi-refresh-token>
- <https://github.com/googleapis/google-auth-library-nodejs#oauth2>
- <https://github.com/googlesamples/google-photos/tree/master/REST/PhotoFrame>
