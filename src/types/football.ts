export interface Team {
  id: string;
  name: string;
  shortName?: string;
  abbreviation?: string;
  logo: string;
  score?: number;
}

export interface Competition {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  logo: string;
}

export type MatchStatusState = 'pre' | 'in' | 'post';

export interface MatchStatus {
  state: MatchStatusState;
  completed: boolean;
  clock?: string;
  displayClock?: string;
  period?: number;
  description: string;
  detail: string;
}

export interface Match {
  id: string;
  leagueId: string;
  leagueName: string;
  leagueSlug: string;
  leagueLogo: string;
  date: string; // ISO 8601 UTC string
  venue?: {
    name: string;
    city?: string;
  };
  status: MatchStatus;
  homeTeam: Team;
  awayTeam: Team;
  broadcast?: string;
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'card' | 'sub' | 'var' | 'penalty' | 'other';
  clock: string;
  text: string;
  teamId?: string;
  scoreValue?: string;
  isHomeTeam?: boolean;
}

export interface RosterPlayer {
  id: string;
  name: string;
  jersey?: string;
  position?: string;
  starter: boolean;
  subbedOut?: boolean;
}

export interface TeamRoster {
  formation?: string;
  starters: RosterPlayer[];
  bench: RosterPlayer[];
}

export interface MatchStat {
  name: string;
  label: string;
  homeValue: string | number;
  awayValue: string | number;
}

export interface MatchDetail extends Match {
  events: MatchEvent[];
  stats: MatchStat[];
  rosters?: {
    home: TeamRoster;
    away: TeamRoster;
  };
  referee?: string;
  attendance?: number;
  notes?: string;
}

export interface StandingEntry {
  rank: number;
  team: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
  };
  gamesPlayed: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string[];
  note?: string;
}

export interface LeagueInfo {
  id: string;
  name: string;
  slug: string;
  country: string;
  logo: string;
}
