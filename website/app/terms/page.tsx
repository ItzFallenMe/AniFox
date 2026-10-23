import type { Metadata } from 'next';

import { LegalSection, LegalShell } from '@/components/legal-shell';

export const metadata: Metadata = {
  title: 'Terms — AniFox',
  description:
    'AniFox is a free personal client. It hosts no media; streams come from third-party providers.',
};

export default function TermsPage() {
  return (
    <LegalShell kicker="Terms" title="A personal client" updated="23 October 2026">
      <LegalSection title="What AniFox is">
        <p>
          AniFox is a free, open-source Android application that browses title
          metadata and plays media embedded from third-party streaming
          providers. It is a personal project, not a commercial service.
        </p>
      </LegalSection>

      <LegalSection title="What AniFox is not">
        <p>
          AniFox does not host, upload, store, encode or distribute any video
          content. It ships no media files and runs no streaming servers. All
          titles, artwork, ratings and trademarks belong to their respective
          owners, and metadata is provided by TMDB.
        </p>
        <p>
          This project is not affiliated with TMDB, Discord, or any streaming
          service or studio.
        </p>
      </LegalSection>

      <LegalSection title="Your responsibility">
        <p>
          You are responsible for how you use the app and for the laws in your
          jurisdiction. Only stream content you have the right to access. If a
          rights holder contacts us about a provider, we will remove that
          provider from the app rather than host anything ourselves.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          Playback, metadata and optional Discord presence depend on third-party
          services. Their availability, accuracy and terms can change without
          notice; AniFox cannot guarantee that any provider will work for a given
          title or region.
        </p>
      </LegalSection>

      <LegalSection title="No warranty">
        <p>
          AniFox is provided &ldquo;as is&rdquo;, without warranty of any kind.
          To the maximum extent permitted by law, the author is not liable for
          any loss or damage arising from use of the app.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          The app and these terms may change as the project evolves. Continued
          use after an update means you accept the current version. The source
          history on GitHub is the record of every change.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
