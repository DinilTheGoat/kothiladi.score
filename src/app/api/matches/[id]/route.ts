import { NextRequest, NextResponse } from 'next/server';
import { fetchMatchSummary } from '@/services/espn';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league') || 'eng.1';

    const detail = await fetchMatchSummary(league, id);

    if (!detail) {
      return NextResponse.json(
        { success: false, error: 'Match summary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      match: detail,
    });
  } catch (error: any) {
    console.error('API /api/matches/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
