import { NextResponse } from 'next/server';

import { getReleases } from '@/lib/releases';

/** JSON list of releases and their APK assets, cached for ten minutes. */
export const revalidate = 600;

export async function GET() {
  const releases = await getReleases();
  return NextResponse.json(
    {
      repository: 'https://github.com/ItzFallenMe/AniFox',
      releases,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    },
  );
}
