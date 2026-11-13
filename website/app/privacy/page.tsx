import type { Metadata } from 'next';

import { LegalSection, LegalShell } from '@/components/legal-shell';
import { CREATOR_URL, TMDB_URL } from '@/lib/links';

export const metadata: Metadata = {
  title: 'Privacy — AniFox',
  description:
    'AniFox stores your library on your device, has no accounts, and sends no analytics.',
};

export default function PrivacyPage() {
  return (
    <LegalShell kicker="Privacy" title="Your device, your library" updated="23 October 2026">
      <LegalSection title="The short version">
        <p>
          AniFox has no account system and no analytics SDK. Your watchlist,
          resume history, recent searches, episode alerts and preferences are
          stored locally by the Flutter app on your device. The website does not
          provide account sync. We do not operate a user account or library
          service.
        </p>
      </LegalSection>

      <LegalSection title="What leaves your device">
        <p>
          AniFox requests title metadata from TMDB and AniList, and may contact
          manga source sites when you browse or search. Those requests include
          the content identifiers or query you request and your network address,
          as with any web request. Each provider&apos;s own privacy policy applies.
        </p>
        <p>
          When you press play, the embedded player talks directly to the
          third-party streaming provider for that server. The provider sees your
          network address and the title you requested. AniFox does not proxy or
          record that traffic.
        </p>
        <p>
          On Android and supported desktop builds, when Discord Rich Presence is
          configured, the title and episode you watch are sent to Discord through
          its local RPC service. iOS requires additional Discord account-linking
          setup. The web app does not publish Rich Presence.
        </p>
      </LegalSection>

      <LegalSection title="What is stored on your device">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Watchlist entries and their poster metadata</li>
          <li>Resume history (season, episode, timestamp)</li>
          <li>Recent search terms (up to eight)</li>
          <li>Scheduled episode alert details</li>
          <li>App preferences such as the default server and glass intensity</li>
        </ul>
        <p>
          Clearing the app&apos;s data in Android settings removes all of it.
        </p>
      </LegalSection>

      <LegalSection title="Notifications">
        <p>
          Episode alerts use a local Android alarm and notification. Nothing is
          sent to a push server. Android 13 and newer ask for notification
          permission the first time you schedule an alert.
        </p>
      </LegalSection>

      <LegalSection title="Children and third parties">
        <p>
          AniFox is a personal project aimed at general audiences and is not
          directed at children. Streaming providers and TMDB are independent
          third parties with their own terms and privacy policies.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions or requests? Open an issue or reach out on{' '}
          <a
            href={CREATOR_URL}
            target="_blank"
            rel="noreferrer"
            className="text-white underline decoration-brand/50 underline-offset-4 hover:decoration-brand">
            GitHub
          </a>
          . Metadata questions belong with{' '}
          <a
            href={TMDB_URL}
            target="_blank"
            rel="noreferrer"
            className="text-white underline decoration-brand/50 underline-offset-4 hover:decoration-brand">
            TMDB
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
