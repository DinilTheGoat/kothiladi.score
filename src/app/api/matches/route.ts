import { NextRequest, NextResponse } from 'next/server';
import { fetchLeagueScoreboard, fetchScoreboardMatches } from '@/services/espn';
import { SUPPORTED_LEAGUES } from '@/constants/leagues';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league') || 'all';
    const date = searchParams.get('date') || undefined;
    const status = searchParams.get('status') || 'all'; // all | live | upcoming | finished
    const query = searchParams.get('q')?.toLowerCase() || '';

    let matches = [];

    if (league === 'all') {
      matches = await fetchScoreboardMatches([], date);
    } else {
      matches = await fetchLeagueScoreboard(league, date);
    }

    // Filter by status if specified
    if (status === 'live') {
      matches = matches.filter((m) => m.status.state === 'in');
    } else if (status === 'upcoming') {
      matches = matches.filter((m) => m.status.state === 'pre');
    } else if (status === 'finished') {
      matches = matches.filter((m) => m.status.state === 'post' || m.status.completed);
    }

    // Filter by search query if provided
    if (query) {
      matches = matches.filter(
        (m) =>
          m.homeTeam.name.toLowerCase().includes(query) ||
          m.awayTeam.name.toLowerCase().includes(query) ||
          m.leagueName.toLowerCase().includes(query) ||
          (m.venue?.name && m.venue.name.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({
      success: true,
      count: matches.length,
      liveCount: matches.filter((m) => m.status.state === 'in').length,
      matches,
    });
  } catch (error: any) {
    console.error('API /api/matches error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
