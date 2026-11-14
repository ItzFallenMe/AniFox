# Tracking integrations

The tracking feature connects the local AniFox library and playback history to
AniList, MyAnimeList, Kitsu, and Simkl. Local tracking remains available without
an external account.

## Code layout

```text
lib/modules/tracking/
├── engine/       Tracker contracts, synchronization, and provider clients
├── models/       Tracker credentials, profiles, links, and list items
├── state/        Riverpod providers and tracker registry
├── ui/           Tracker settings and account-management widgets
└── utils/        Parsing and formatting helpers
```

Tracker credentials are passed to Flutter as build-time defines. For local
development, copy the root `.env.example` to `.env` and run Flutter through
`npm run flutter -- ...`; never commit populated credentials.

## Adding or changing a tracker

1. Review the contracts in `engine/tracking_service.dart`,
   `engine/remote_tracker.dart`, and `engine/base_tracker.dart`.
2. Implement the provider under `engine/trackers/<provider>/` and export it from
   `engine/trackers/index.dart`.
3. Register it in `state/tracker_registry.dart` and add any authentication or
   settings UI needed by the provider.
4. Verify which media types and progress fields the service supports; do not
   imply that unsupported data syncs.
5. Run Flutter analysis, tests, and formatting as described in the root
   [contributing guide](../../../CONTRIBUTING.md).

Keep provider-specific API calls in the tracker implementation, not in widgets.
Use the existing synchronization engine and shared network configuration so
authentication, errors, and retries stay consistent.
