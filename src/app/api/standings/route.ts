import { NextRequest, NextResponse } from 'next/server';
import { fetchLeagueStandings } from '@/services/espn';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league') || 'eng.1';

    const standings = await fetchLeagueStandings(league);

    return NextResponse.json({
      success: true,
      league,
      standings,
    });
  } catch (error: any) {
    console.error('API /api/standings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
