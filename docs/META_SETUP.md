# Meta Messenger production setup

## Required Meta assets

1. Meta developer app owned by the business.
2. Messenger product enabled.
3. Facebook Page: Xưởng In Ly Magasin Cup Cần Thơ.
4. Page access token for the Page.
5. Webhook callback URL pointing to the deployed `meta-webhook` Edge Function.
6. Verify token stored as `META_VERIFY_TOKEN`.
7. App secret stored as `META_APP_SECRET`.
8. Subscribe the Page to message webhook events required by the Messenger Platform.
9. Request the permissions/access level required by Meta for real customers, including messaging and Page metadata/engagement permissions as applicable to the current Meta review flow.

## Verification

- Meta GET verification must return `hub.challenge` only when the verify token matches.
- POST events with an invalid `X-Hub-Signature-256` must return 401.
- Events from a Page ID other than `META_PAGE_ID` are ignored.
- Echo messages are ignored.

## Production safety

Do not enable automatic replies until SOURCE_OF_TRUTH.md Live Enablement Gate is complete.
