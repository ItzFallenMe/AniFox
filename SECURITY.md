# Security policy

## Supported versions

Security fixes land on the current `anifox` branch and the latest release. Older
releases are not maintained.

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Use GitHub's private
vulnerability reporting:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Include the affected version or commit, platform, reproduction steps and the
   impact you expect.

If private reporting is unavailable, contact the maintainer through the profile
linked in the README and ask for a private channel before sharing details.

You can expect an acknowledgement within a few days. Fixes are prepared
privately and disclosed with a release note once users can update.

## Scope

In scope:

- The Flutter app in `lib/`
- The Next.js client and API routes in `website/`
- Credential handling, local storage and backup import/export
- Content injection or script execution through title metadata or embeds

Out of scope:

- Third-party embed hosts and download providers
- Issues that require a modified device, rooted OS or physical access
- Missing security headers on deployments you control
- Denial of service through unusually large local files

## Handling secrets

AniFox never ships API keys. TMDB keys are build-time or server-side values.
Reports that include a key should redact it; rotate any key that may have been
exposed.
