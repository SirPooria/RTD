# Security and deployment setup

## Required actions before deployment

1. Rotate the Payamak username/password or API key. The old credentials were present in the browser bundle and must be considered exposed.
2. Enable **Email/Password** in Firebase Authentication.
3. Create a Firebase service account with permission to read and write Firestore, then add its email and private key to Vercel. Never commit either value.
4. Deploy `firestore.rules` and create the admin record described below.

## Vercel environment variables

Set these variables for Production, Preview, and Development as appropriate. Do not use `VITE_` for server-only values.

```text
SMS_USERNAME
SMS_PASSWORD
SMS_BODY_ID
SMS_API_URL=https://api.payamak-panel.com/post/Send.asmx/SendByBaseNumber2
OTP_SIGNING_SECRET
FIREBASE_PROJECT_ID
FIREBASE_WEB_API_KEY
FIREBASE_DATABASE_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

`FIREBASE_PRIVATE_KEY` must preserve line breaks. In Vercel it is usually entered with `\n`; the API converts those sequences back to newlines.

## Enable the admin account

1. Register the owner once through the new app.
2. In Firebase Authentication, copy the owner account UID.
3. In Firestore Console create `admins/{UID}` with `{ "enabled": true }`.
4. Deploy again or sign out/in. The admin panel will then appear for that account.

There is no admin password in the client anymore. The old values `admin`, `123456`, and `doomsday` are intentionally removed.

## Existing users

Old accounts used a custom plaintext-password scheme and document IDs based on usernames. They cannot be silently treated as secure Firebase accounts. Ask existing users to register again, or perform a controlled one-time migration on a trusted server after verifying ownership. Do not copy the old password field into Firebase.

## SMS diagnosis

The API now normalizes Persian/Arabic digits and `+98`/`0098` formats, checks the HTTP status, parses the provider response, and treats provider error codes as failures. A successful response is a positive request/record ID, including provider success code `1`.

If a number still fails, check the Vercel function log for the sanitized provider result and then check the Payamak panel for:

- Approved pattern/body ID and the exact variable order.
- Sufficient credit and active API access.
- Sender line permissions and the recipient's blacklist status.
- API IP allow-list settings, if enabled by the panel.

Never log or display the SMS username, API key, OTP, or private key.
