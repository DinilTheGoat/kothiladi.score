import {
  Match,
  MatchDetail,
  MatchEvent,
  MatchStat,
  StandingEntry,
  TeamRoster,
  RosterPlayer,
} from '../types/football';
import { SUPPORTED_LEAGUES } from '../constants/leagues';

// In-memory cache to stay well within limits and respond in under 5ms
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // in milliseconds
}

const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlSeconds * 1000,
  });
}

/**
 * Transforms raw ESPN event JSON into our unified Match interface
 */
function parseEspnEvent(event: any, leagueSlug: string, leagueName: string, leagueLogo: string): Match {
  const competition = event.competitions?.[0] || {};
  const competitors = competition.competitors || [];

  const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0] || {};
  const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1] || {};

  const statusType = event.status?.type || {};
  const state = statusType.state as 'pre' | 'in' | 'post';

  let homeScore: number | undefined = undefined;
  let awayScore: number | undefined = undefined;

  if (state === 'in' || state === 'post' || home.score !== undefined) {
    homeScore = parseInt(home.score, 10);
    awayScore = parseInt(away.score, 10);
    if (isNaN(homeScore)) homeScore = 0;
    if (isNaN(awayScore)) awayScore = 0;
  }

  const broadcastName = competition.broadcasts?.[0]?.names?.[0] || competition.broadcast || undefined;

  return {
    id: String(event.id),
    leagueId: leagueSlug,
    leagueName: leagueName,
    leagueSlug: leagueSlug,
    leagueLogo: leagueLogo,
    date: event.date || new Date().toISOString(),
    venue: competition.venue
      ? {
          name: competition.venue.fullName || competition.venue.name || 'Stadium',
          city: competition.venue.address?.city,
        }
      : undefined,
    status: {
      state: state || (statusType.completed ? 'post' : 'pre'),
      completed: Boolean(statusType.completed),
      clock: String(event.status?.clock || ''),
      displayClock: event.status?.displayClock || (state === 'in' ? "Live" : undefined),
      period: event.status?.period,
      description: statusType.description || statusType.detail || 'Scheduled',
      detail: statusType.shortDetail || statusType.detail || 'Scheduled',
    },
    homeTeam: {
      id: String(home.id || home.team?.id),
      name: home.team?.displayName || home.team?.name || 'Home Team',
      shortName: home.team?.shortDisplayName || home.team?.abbreviation || home.team?.name,
      abbreviation: home.team?.abbreviation,
      logo:
        home.team?.logo ||
        `https://a.espncdn.com/i/teamlogos/soccer/500/${home.id}.png`,
      score: homeScore,
    },
    awayTeam: {
      id: String(away.id || away.team?.id),
      name: away.team?.displayName || away.team?.name || 'Away Team',
      shortName: away.team?.shortDisplayName || away.team?.abbreviation || away.team?.name,
      abbreviation: away.team?.abbreviation,
      logo:
        away.team?.logo ||
        `https://a.espncdn.com/i/teamlogos/soccer/500/${away.id}.png`,
      score: awayScore,
    },
    broadcast: broadcastName,
  };
}

/**
 * Fetch matches for a single league slug
 */
export async function fetchLeagueScoreboard(
  leagueSlug: string,
  dateStr?: string
): Promise<Match[]> {
  const cacheKey = `scoreboard:${leagueSlug}:${dateStr || 'default'}`;
  const cached = getCached<Match[]>(cacheKey);
  if (cached) return cached;

  const league = SUPPORTED_LEAGUES.find((l) => l.slug === leagueSlug) || {
    id: leagueSlug,
    name: leagueSlug.toUpperCase(),
    slug: leagueSlug,
    country: '',
    logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/default.png',
  };

  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/scoreboard${
    dateStr ? `?dates=${dateStr}` : ''
  }`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      throw new Error(`ESPN API returned ${res.status}`);
    }

    const data = await res.json();
    const espnLeague = data.leagues?.[0];
    const leagueName = espnLeague?.name || league.name;
    const leagueLogo = espnLeague?.logos?.[0]?.href || league.logo;

    const matches: Match[] = (data.events || []).map((e: any) =>
      parseEspnEvent(e, leagueSlug, leagueName, leagueLogo)
    );

    // TTL: 30s if contains live games, otherwise 3 mins
    const hasLive = matches.some((m) => m.status.state === 'in');
    setCache(cacheKey, matches, hasLive ? 20 : 180);

    return matches;
  } catch (error) {
    console.error(`Error fetching scoreboard for ${leagueSlug}:`, error);
    return [];
  }
}

/**
 * Fetch matches across all or selected leagues
 */
export async function fetchScoreboardMatches(
  leagues: string[] = [],
  dateStr?: string
): Promise<Match[]> {
  const targetLeagues =
    leagues.length > 0
      ? leagues
      : SUPPORTED_LEAGUES.map((l) => l.slug);

  const results = await Promise.allSettled(
    targetLeagues.map((slug) => fetchLeagueScoreboard(slug, dateStr))
  );

  const allMatches: Match[] = [];
  for (const res of results) {
    if (res.status === 'fulfilled') {
      allMatches.push(...res.value);
    }
  }

  // Sort matches by kickoff time ascending
  allMatches.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return allMatches;
}

/**
 * Fetch detailed match summary (events, lineups, statistics)
 */
export async function fetchMatchSummary(
  leagueSlug: string,
  eventId: string
): Promise<MatchDetail | null> {
  const cacheKey = `summary:${leagueSlug}:${eventId}`;
  const cached = getCached<MatchDetail>(cacheKey);
  if (cached) return cached;

  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/summary?event=${eventId}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 25 },
    });

    if (!res.ok) {
      throw new Error(`ESPN summary error: ${res.status}`);
    }

    const data = await res.json();
    const headerEvent = data.header?.competitions?.[0];
    const leagueInfo =
      SUPPORTED_LEAGUES.find((l) => l.slug === leagueSlug) || {
        id: leagueSlug,
        name: data.header?.league?.name || leagueSlug,
        slug: leagueSlug,
        country: '',
        logo: data.header?.league?.logos?.[0]?.href || '',
      };

    // Extract basic match
    const baseMatch: Match = {
      id: eventId,
      leagueId: leagueSlug,
      leagueName: data.header?.league?.name || leagueInfo.name,
      leagueSlug: leagueSlug,
      leagueLogo: data.header?.league?.logos?.[0]?.href || leagueInfo.logo,
      date: headerEvent?.date || new Date().toISOString(),
      venue: data.gameInfo?.venue
        ? {
            name: data.gameInfo.venue.fullName || data.gameInfo.venue.name || 'Stadium',
            city: data.gameInfo.venue.address?.city,
          }
        : undefined,
      status: {
        state: headerEvent?.status?.type?.state || 'pre',
        completed: Boolean(headerEvent?.status?.type?.completed),
        clock: String(headerEvent?.status?.clock || ''),
        displayClock: headerEvent?.status?.displayClock,
        period: headerEvent?.status?.period,
        description: headerEvent?.status?.type?.description || 'Scheduled',
        detail: headerEvent?.status?.type?.detail || 'Scheduled',
      },
      homeTeam: {
        id: headerEvent?.competitors?.[0]?.homeAway === 'home' ? headerEvent.competitors[0].id : headerEvent?.competitors?.[1]?.id,
        name: (headerEvent?.competitors?.find((c: any) => c.homeAway === 'home') || headerEvent?.competitors?.[0])?.team?.displayName || 'Home Team',
        logo: (headerEvent?.competitors?.find((c: any) => c.homeAway === 'home') || headerEvent?.competitors?.[0])?.team?.logos?.[0]?.href || '',
        score: parseInt((headerEvent?.competitors?.find((c: any) => c.homeAway === 'home') || headerEvent?.competitors?.[0])?.score || '0', 10),
      },
      awayTeam: {
        id: headerEvent?.competitors?.[0]?.homeAway === 'away' ? headerEvent.competitors[0].id : headerEvent?.competitors?.[1]?.id,
        name: (headerEvent?.competitors?.find((c: any) => c.homeAway === 'away') || headerEvent?.competitors?.[1])?.team?.displayName || 'Away Team',
        logo: (headerEvent?.competitors?.find((c: any) => c.homeAway === 'away') || headerEvent?.competitors?.[1])?.team?.logos?.[0]?.href || '',
        score: parseInt((headerEvent?.competitors?.find((c: any) => c.homeAway === 'away') || headerEvent?.competitors?.[1])?.score || '0', 10),
      },
      broadcast: data.broadcasts?.[0]?.names?.[0],
    };

    // Extract events (goals, cards, substitutions)
    const events: MatchEvent[] = (data.keyEvents || []).map((k: any, idx: number) => {
      const typeText = (k.type?.text || '').toLowerCase();
      let eventType: MatchEvent['type'] = 'other';
      if (typeText.includes('goal')) eventType = 'goal';
      else if (typeText.includes('card')) eventType = 'card';
      else if (typeText.includes('sub')) eventType = 'sub';
      else if (typeText.includes('penalty')) eventType = 'penalty';

      return {
        id: `ev-${idx}-${k.clock?.value || Date.now()}`,
        type: eventType,
        clock: k.clock?.displayValue || '',
        text: k.text || k.shortText || '',
        teamId: k.team?.id,
        scoreValue: k.scoreValue,
      };
    });

    // Extract stats
    const boxTeams = data.boxscore?.teams || [];
    const stats: MatchStat[] = [];
    if (boxTeams.length >= 2) {
      const homeStats = boxTeams[0]?.statistics || [];
      const awayStats = boxTeams[1]?.statistics || [];

      const statLabels: Record<string, string> = {
        possessionPct: 'Possession %',
        shotsTotal: 'Total Shots',
        shotsOnTarget: 'Shots on Target',
        wonCorners: 'Corner Kicks',
        foulsCommitted: 'Fouls',
        yellowCards: 'Yellow Cards',
        redCards: 'Red Cards',
        offsides: 'Offsides',
        saves: 'Goalkeeper Saves',
      };

      for (const [key, label] of Object.entries(statLabels)) {
        const hStat = homeStats.find((s: any) => s.name === key);
        const aStat = awayStats.find((s: any) => s.name === key);
        if (hStat || aStat) {
          stats.push({
            name: key,
            label,
            homeValue: hStat?.displayValue || '0',
            awayValue: aStat?.displayValue || '0',
          });
        }
      }
    }

    // Extract rosters & lineups
    let rosters: MatchDetail['rosters'] = undefined;
    if (data.rosters && data.rosters.length >= 2) {
      const parseRoster = (r: any): TeamRoster => {
        const allPlayers = r.roster || [];
        const starters: RosterPlayer[] = [];
        const bench: RosterPlayer[] = [];

        for (const p of allPlayers) {
          const item: RosterPlayer = {
            id: String(p.athlete?.id || p.jersey || Math.random()),
            name: p.athlete?.displayName || p.athlete?.shortName || 'Player',
            jersey: p.jersey,
            position: p.position?.abbreviation || p.position?.name,
            starter: Boolean(p.starter),
            subbedOut: Boolean(p.subbedOut),
          };
          if (p.starter) starters.push(item);
          else bench.push(item);
        }

        return {
          formation: r.formation,
          starters,
          bench,
        };
      };

      rosters = {
        home: parseRoster(data.rosters[0]),
        away: parseRoster(data.rosters[1]),
      };
    }

    const detail: MatchDetail = {
      ...baseMatch,
      events,
      stats,
      rosters,
      referee: data.gameInfo?.officials?.[0]?.displayName,
      attendance: data.gameInfo?.attendance,
    };

    setCache(cacheKey, detail, baseMatch.status.completed ? 600 : 30);
    return detail;
  } catch (err) {
    console.error(`Error fetching match summary for ${eventId}:`, err);
    return null;
  }
}

/**
 * Fetch league standings table
 */
export async function fetchLeagueStandings(leagueSlug: string): Promise<StandingEntry[]> {
  const cacheKey = `standings:${leagueSlug}`;
  const cached = getCached<StandingEntry[]>(cacheKey);
  if (cached) return cached;

  const url = `https://site.api.espn.com/apis/v2/sports/soccer/${leagueSlug}/standings`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`Standings request failed with ${res.status}`);
    }

    const data = await res.json();
    const children = data.children || [];
    const entries = children[0]?.standings?.entries || [];

    const standings: StandingEntry[] = entries.map((entry: any) => {
      const statsMap: Record<string, string | number> = {};
      for (const s of entry.stats || []) {
        statsMap[s.name] = s.displayValue ?? s.value;
      }

      return {
        rank: Number(statsMap.rank || entry.rank || 0),
        team: {
          id: String(entry.team?.id),
          name: entry.team?.displayName || entry.team?.name || 'Club',
          shortName: entry.team?.shortDisplayName || entry.team?.abbreviation || entry.team?.name,
          logo:
            entry.team?.logos?.[0]?.href ||
            `https://a.espncdn.com/i/teamlogos/soccer/500/${entry.team?.id}.png`,
        },
        gamesPlayed: Number(statsMap.gamesPlayed || 0),
        won: Number(statsMap.wins || 0),
        drawn: Number(statsMap.ties || 0),
        lost: Number(statsMap.losses || 0),
        goalsFor: Number(statsMap.pointsFor || 0),
        goalsAgainst: Number(statsMap.pointsAgainst || 0),
        goalDifference: Number(statsMap.pointDifferential || 0),
        points: Number(statsMap.points || 0),
        note: entry.note?.description,
      };
    });

    standings.sort((a, b) => a.rank - b.rank);
    setCache(cacheKey, standings, 600); // 10 minutes cache
    return standings;
  } catch (err) {
    console.error(`Error fetching standings for ${leagueSlug}:`, err);
    return [];
  }
}
