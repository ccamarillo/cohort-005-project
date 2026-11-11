# What Knock gives Cadence for an in-app feed

Research for [#3](https://github.com/ccamarillo/cohort-005-project/issues/3), part of the Notifications v1 map ([#2](https://github.com/ccamarillo/cohort-005-project/issues/2)). Researched 2026-11-11 from Knock's own docs, legal pages, pricing page and SDK source. Knock is already chosen; this note only records the facts that the integration and UI decisions depend on.

Cadence context: React Router 8, React 19, one Node process, SQLite via Drizzle, Tailwind 4 + shadcn/ui. `npm run test` must never call Knock.

## Summary

| # | Question | Short answer |
| - | -------- | ------------ |
| 1 | React feed components / restyling | `@knocklabs/react` ships a bell (`NotificationIconButton`), popover and feed. Restyle via `--rnf-*` CSS variables, `renderItem`, or drop Knock's CSS. For a shadcn-native look, use the headless hooks (`useNotifications` + `useNotificationStore`) and build the bell and list from shadcn parts. |
| 2 | Node SDK triggering | `@knocklabs/node` `client.workflows.trigger(key, {...})`. It's one HTTPS call that returns a `workflow_run_id`. The workflow itself runs asynchronously. The SDK has a 60 s default timeout and 2 retries, so don't block a user-facing action on it without a shorter timeout. |
| 3 | User identification | Only `id` is required. Recipients can be identified inline in the trigger call (an upsert), so no pre-sync is needed. `name` is a reserved property. `email` is needed only for email steps. |
| 4 | Real-time and client auth | The feed updates live over Knock's managed websocket. The client uses the public API key plus user id. By default anyone with the public key can act as any user, so production must turn on enhanced security: an RS256 user token signed server-side with `signUserToken` (default lifetime 1 h). |
| 5 | Environments, local dev and tests | Development and production environments each have their own keys and data, and content is promoted with commits. Use the dev env for local dev. Triggers accept `settings.sandbox_mode` and `skip_delay`. Knock gives no unit-test guidance, so tests must stub the Cadence-side boundary. `KnockProvider enabled={false}` keeps the client idle. |
| 6 | Residency, retention, DPA | Data is US-only today. Knock says EU residency is expected "by the end of 2026". Message logs are kept 30 days (90 days on Enterprise), but feed items are kept indefinitely. There is a published DPA with SCCs, and data is deleted after termination (return within 90 days, then deletion within 180 days). |
| 7 | Free tier and pricing | Free plan: $0, 10,000 messages per month, and feed messages count. Starter: $250/month for 50k messages, then $0.005 each. Environments and feeds are unlimited, and logs are kept 30 days. |
| 8 | Adding email later | Add an email channel (Postmark, Resend, SES, SendGrid, SMTP and others) and an email channel step to the same workflow. It only sends to recipients with an `email`. Each email is a separately billed message. |

## 1. React in-app feed components and restyling

- The package is `@knocklabs/react`, and it's built on `@knocklabs/client`. Import `@knocklabs/react/dist/index.css` unless you're overriding the styling. [Feed docs](https://docs.knock.app/in-app-ui/react/feed), [README](https://github.com/knocklabs/javascript/tree/main/packages/react)
- Components ([feed docs](https://docs.knock.app/in-app-ui/react/feed)):
  - `KnockProvider`, which takes `apiKey`, `user` and an optional `i18n`.
  - `KnockFeedProvider`, which takes `feedId` (the in-app channel id), `colorMode` and `defaultFeedOptions`, and is where `userToken` goes.
  - `NotificationIconButton`, the bell with an unread or unseen badge.
  - `NotificationFeedPopover`.
  - `NotificationFeed`, which takes `renderItem`, `renderHeader`, `onNotificationClick` and `initialFilterStatus`.
- Peer deps in v0.15.1 are `react` `^17 || ^18 || ^19`, so React 19 is supported. Optional peers are Next and TanStack Router; React Router is not listed but isn't needed. [package.json](https://raw.githubusercontent.com/knocklabs/javascript/main/packages/react/package.json)
- There are three ways to restyle ([feed docs](https://docs.knock.app/in-app-ui/react/feed)):
  - Override the `--rnf-*` CSS variables.
  - Write your own CSS against the `rnf-` classes, or drop Knock's CSS entirely.
  - Replace each cell with `renderItem`, or add to it with `NotificationCell` `children`.
  - The feed stylesheet uses plain classes like `.rnf-notification-feed` with `var(--rnf-color-white)` and so on ([styles.css](https://raw.githubusercontent.com/knocklabs/javascript/main/packages/react/src/modules/feed/components/NotificationFeed/styles.css)). The newer shared theme uses `--knock-*` tokens ([theme.css](https://raw.githubusercontent.com/knocklabs/javascript/main/packages/react/src/theme.css)). Neither is Tailwind-based, so mapping to shadcn tokens means mapping CSS variables by hand.
- Headless option ([headless docs](https://docs.knock.app/in-app-ui/react/headless/feed)):
  - `useKnockClient()` (or `useAuthenticatedKnockClient(apiKey, userId)`), then `useNotifications(client, channelId)` to get a `feedClient`, then `useNotificationStore(feedClient)` for `{ items, metadata }`.
  - `metadata.unread_count` and `unseen_count` drive the badge.
  - In headless mode you must call `feedClient.markAsSeen(item)` or `markAllAsSeen()` yourself, or the badge never clears.
  - Item content arrives as rendered HTML in `item.blocks[n].rendered`. Pass `{ mode: "rich" }` for full payloads.
- Real-time options include `__experimentalCrossBrowserUpdates` (syncs tabs through BroadcastChannel) and `auto_manage_socket_connection`, which disconnects inactive tabs after 2000 ms by default. [Feed docs](https://docs.knock.app/in-app-ui/react/feed)
- Not found in the docs: explicit SSR guidance. The feed is a websocket client, so treat it as client-only in React Router: render it after hydration and don't render it in loaders. (This is an inference, not a doc fact.)

**Implication for #5 (feed prototype):** prototype both the prebuilt `NotificationFeedPopover` with `--rnf-*` overrides and a headless bell built from a shadcn `Popover`. Headless gives full Tailwind control but means owning seen/read handling and rendering Knock's HTML blocks.

## 2. Node server SDK and triggering from loaders/actions

- Install `@knocklabs/node` (Node 20 LTS or later, TypeScript 4.9 or later). Construct the client with `new Knock({ apiKey: process.env.KNOCK_API_KEY })`. [knock-node README](https://github.com/knocklabs/knock-node)
- Trigger call ([README](https://github.com/knocklabs/knock-node)):
  ```ts
  await client.workflows.trigger('workflow-key', { recipients: [...], data: {...} })
  ```
- The underlying endpoint is `POST /v1/workflows/{key}/trigger`. Its body takes `recipients`, `actor`, `data`, `tenant`, `cancellation_key` and `settings`. It returns `{ workflow_run_id }`, and "all workflow runs execute asynchronously." It is in rate-limit tier 5. [API reference](https://docs.knock.app/api-reference/workflows/trigger)
- Cost per call: one HTTPS round trip to Knock. Delivery to the feed happens later, asynchronously. SDK defaults are a 1 minute timeout and 2 automatic retries, and both are configurable (`timeout`, `maxRetries`). [README](https://github.com/knocklabs/knock-node)
  - Knock publishes no latency figure.
  - Calling it from a React Router action can add a network round trip and, on failure, up to three attempts. Set a short timeout, or trigger after the DB commit without awaiting the action response. That decision belongs to #6.
- Rate limits are per endpoint and per environment for API keys. A rate-limited request gets a 429. [Rate limits](https://docs.knock.app/api-reference/overview/rate-limits)
- Inactive workflows return a `workflow_inactive` error. [Triggering overview](https://docs.knock.app/send-notifications/triggering-workflows/overview)
- Not found: a documented idempotency-key header on trigger. Don't rely on Knock for deduplication without confirming it.

## 3. Identifying users

- Only `id` is required. Use Cadence's internal user id. [Identifying recipients](https://docs.knock.app/managing-recipients/identifying-recipients)
- There are two ways to identify users, and all of them are upserts:
  - Ahead of time, with `PUT /v1/users/{id}` or the bulk endpoint `POST /v1/users/bulk/identify`.
  - Inline: pass recipient objects such as `{ id, name }` in the trigger's `recipients`. `actor` and `tenant` can be identified inline too.
- Knock recommends inline identification for a quick start, or sending full recipient data with each trigger to keep Knock current.
- Reserved properties are `name`, `email`, `avatar`, `locale`, `phone_number`, `timezone` and `created_at`. `email` and `phone_number` are needed only for their channel steps.
- This fits the map's rule of user id + display name and no email: identify inline with `{ id, name }` only.
- `DELETE /v1/users/{user_id}` "permanently delete[s] a user and all associated data." [API reference](https://docs.knock.app/api-reference/users/delete)

## 4. Real-time delivery and client authentication

- Feed clients connect to Knock's managed real-time service and receive new messages over a websocket. Messages have the states seen, read, interacted and archived, and the API returns unread, read and seen counts. [Feeds overview](https://docs.knock.app/in-app-ui/feeds/overview)
- The client authenticates with a public API key and a user id.
  - **Without enhanced security** (the default), "a request with the public key can act as any user." Knock says to enable enhanced security before release.
  - **With enhanced security**, every client request also needs a user token signed with RS256 by a private signing key from the dashboard (`KNOCK_SIGNING_KEY`). The token's `sub` is the user id, and `iat` and `exp` are recommended.
  - The Node helper is `signUserToken(userId, { signingKey?, expiresInSeconds? })` from `@knocklabs/node/lib/tokenSigner`, with a default lifetime of 3600 s. Refresh tokens through the client's `onUserTokenExpiring` callback.
  - Enhanced security can be off in development and on in production.
  - Source: [Security & authentication](https://docs.knock.app/in-app-ui/security-and-authentication)
- For Cadence: sign the token in a root loader for the session user and pass it to `KnockFeedProvider`. The signing key is a server-only secret. The DevUI user switcher would need a fresh token per switched user.

## 5. Environments, local dev and automated tests

- Accounts start with production. Enabling environments adds development, and you can add custom environments such as staging. [Environments](https://docs.knock.app/concepts/environments)
  - Each environment has its own public and secret keys.
  - Data (users, messages, logs) is never shared between environments.
  - Workflows are versioned by commit and promoted upward, from development to production.
  - Use the Knock CLI or Management API to sync resources.
- Testing ([Testing workflows](https://docs.knock.app/send-notifications/testing-workflows)):
  - The dashboard test runner runs a whole workflow or a single step.
  - Triggers accept `settings.sandbox_mode`, which generates messages without delivering them to providers, and `settings.skip_delay`.
  - `knock workflow run` in the CLI generates runs.
- Knock gives no guidance on mocking in unit tests. To meet "`npm run test` must never call Knock", Cadence should:
  - put the SDK behind its own small module (a notifier interface) and inject or stub it in tests;
  - leave `KNOCK_API_KEY` unset in test so any accidental real call fails loudly;
  - render the feed with `KnockProvider enabled={false}` (no identify, API calls or websocket) or not at all in component tests. [README](https://github.com/knocklabs/javascript/tree/main/packages/react)
- For local dev, use the development environment's keys with enhanced security off. A shared Knock dev env is the only "local" option, because Knock has no local emulator in its docs.

## 6. Data residency, retention and DPA

- **Residency:** Knock's security docs say: "We expect to support EU data residency by the end of 2026." [Security at Knock](https://docs.knock.app/developer-tools/security)
  - Today all 19 listed subprocessors are in the USA, including AWS for hosting, plus Anthropic and OpenAI as AI providers, ClickHouse, Datadog, Sentry, Segment and PostHog. [Subprocessors](https://knock.app/legal/subprocessors)
  - Data is encrypted at rest and in transit with TLS 1.2. Knock is SOC 2 Type 2 and calls itself "GDPR certified." [Security](https://docs.knock.app/developer-tools/security), [Trust center](https://trust.knock.app/)
- **Retention:** [Data retention](https://docs.knock.app/manage-your-account/data-retention)
  - Message logs, workflow run logs and audit logs: 30 days, or 90 days on Enterprise.
  - API logs: 30 days for everyone.
  - Server logs: up to 1 year. [Security](https://docs.knock.app/developer-tools/security)
  - **"In-app feed notifications are available indefinitely."** Feed items can still be fetched and updated after their message logs expire, and Knock gives no feed TTL in these docs. The pricing page lists feed retention as "unlimited… configurable." [Pricing](https://knock.app/pricing)
- **DPA:** Published at [knock.app/legal/data-processing-addendum](https://knock.app/legal/data-processing-addendum).
  - It amends the Terms of Service.
  - It incorporates EU SCCs (Module 2 or 3, under Irish law) and the UK Addendum.
  - After termination, the customer can request return of data within 90 days, and Knock deletes it within 180 days after returning it.
  - It doesn't specify a data location, and the execution mechanics (signed or automatic) are unclear.

**Implication for the map:** Notification text naming courses and amounts, plus user ids and display names, will be stored in the USA indefinitely in feeds unless Cadence archives or deletes it. It's also processed by US subprocessors, including AI providers.

## 7. Free tier and pricing

From [knock.app/pricing](https://knock.app/pricing):

- **Free plan:** $0. It includes 10,000 messages per month, unlimited environments, workflows, profiles and feeds, 30-day logs and Google SSO.
- **Starter plan:** $250/month for 50,000 messages, then $0.005 per message.
- **Enterprise:** custom pricing. It adds 90-day logs and SAML/SCIM.
- A message is "a single message delivered to a single user on a single channel."
  - Bounced or failed sends aren't billed, and neither are sends blocked by preferences.
  - In-app + email = 2 messages.
  - "Feed messages count toward message usage." [In-app page](https://knock.app/channels/in-app-notifications)
- Not found: what happens when the Free plan goes over 10k, whether hard-blocked or upgrade-prompted, and whether sandbox-mode messages count.

## 8. Adding email later

- Email is another channel. You configure a provider integration in the dashboard: Amazon SES, Mailgun, Postmark, Resend, SendGrid, SMTP and others. Channel config can vary per environment, and email channels support sandbox mode. [Email overview](https://docs.knock.app/integrations/email/overview)
- A workflow is a sequence of channel steps, one channel type per step, each with its own template. Adding email means adding an email step to the existing workflow. No Cadence trigger code needs to change. [Channel step](https://docs.knock.app/designing-workflows/channel-step)
- Before rendering, Knock checks that the recipient has the data the channel requires, such as an `email`. It also checks step conditions, preferences and send windows. So until Cadence sends `email` in the recipient object, email steps won't deliver.
- This means email can be added later without blocking the in-app work, provided trigger `data` carries everything an email template would need. Watch out: the provider choice in #1 must be one Knock integrates with.

## Open items Knock's docs didn't settle

- Whether there's an idempotency or deduplication key on trigger.
- What happens when the Free plan goes over its message limit.
- Whether feed items can be given a TTL, or must be archived or deleted by API.
- SSR guidance for `@knocklabs/react` under React Router.
- Whether the DPA needs a signature.
