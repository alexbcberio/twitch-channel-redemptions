# Readme

Hello and thanks for choosing this tool for your streams!

## Setting up

First you have to create the application, go to
[Twitch developer console](https://dev.twitch.tv/console) and create it. Once done
make a copy of the `.env.example` named `.env` and fill the CLIENT_ID and
CLIENT_SECRET field values provided by Twitch.

You will have something similar to this:

```txt
TWITCH_CLIENT_ID=theClientIdProvidedByTwitch
TWITCH_CLIENT_SECRET=aSecretYouHaveToKeepSafe
```

Now we have to authenticate the account we are going to use using OAuth. In order
to get it we have to make a `GET` request to the following endpoint.

```txt
GET https://id.twitch.tv/oauth2/authorize
  ?client_id=<your client ID>
  &redirect_uri=<your registered redirect URI>
  &response_type=code
  &scope=<space-separated list of scopes>
```

You can get all the available scopes on [here](https://dev.twitch.tv/docs/authentication/#scopes).
Don't forget to set the exact same redirect_url as you did on the application.

**Important**: you have to perform this operation with the account you want to use
to send the messages. You can have two different accounts, the owner of the
application and the authorized account, aka "the chatter". But I recommend you
to use the same account for simplicity.

Once authorized, we will get redirected to the specified address. The url will
have a `GET` parameter called `code` that we will use to obtain the access token.

```txt
http://localhost/?code=<code of the authorization>
  &scope=channel:manage:redemptions channel:read:hype_train channel:read:polls channel:read:predictions channel:read:redemptions channel:moderate chat:edit chat:read
```

Finally make a `POST` request to the following url.

```txt
POST https://id.twitch.tv/oauth2/token
  ?client_id=<your client ID>
  &client_secret=<your client secret>
  &code=<authorization code received above>
  &grant_type=authorization_code
  &redirect_uri=<your registered redirect URI>
```

This will return a JSON-encoded response. Copy the whole response into a file
called `tokens.json` and place it on the root of this project (same place as
is this file). You have to change the key names from kebab_case to camelCase.

The JSON file must have this format (the order is not relevant):

```json
{
  "accessToken": "the access token",
  "expiresIn": 14361,
  "refreshToken": "the refresh token",
  "scope": [
    // list of the scopes
  ],
  "tokenType": "bearer"
}
```

## Starting the service

Install any dependencies executing the following command `yarn`, then you can
start the service using the start script `yarn start`. Keep the terminal open
until you want to close the service.

## Development

In order to start the service in development mode use the dev script `yarn dev`,
this will reload the backend whenever you make any change. Keep in mind that some
of the features might be disabled in this environment.
