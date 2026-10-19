'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Match } from '@/types/football';
import { formatDateToYYYYMMDD, getUserTimezone } from '@/utils/time';
import { Header } from '@/components/Header';
import { LeagueFilterStrip } from '@/components/LeagueFilterStrip';
import { DateNavigator } from '@/components/DateNavigator';
import { MatchCard } from '@/components/MatchCard';
import { MatchCenterModal } from '@/components/MatchCenterModal';
import { StandingsTable } from '@/components/StandingsTable';
import { useFavorites } from '@/hooks/useFavorites';
import {
  Calendar,
  Radio,
  Clock,
  CheckCircle2,
  Trophy,
  Star,
  Search,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'live' | 'upcoming' | 'finished' | 'standings'
  >('all');
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 9, 19));
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedMatchForModal, setSelectedMatchForModal] =
    useState<Match | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date(2026, 9, 19));

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setLastUpdated(now);
  }, []);

  const {
    favoriteTeams,
    favoriteLeagues,
    toggleFavoriteTeam,
    isFavoriteTeam,
    isLoaded: favoritesLoaded,
  } = useFavorites();

  // Fetch matches from API
  const fetchMatches = useCallback(
    async (showLoadingSpinner = true) => {
      if (showLoadingSpinner) setIsLoading(true);

      const dateStr = formatDateToYYYYMMDD(currentDate);
      const params = new URLSearchParams();
      if (selectedLeague !== 'all') params.set('league', selectedLeague);
      params.set('date', dateStr);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      try {
        const res = await fetch(`/api/matches?${params.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.matches)) {
          setMatches(data.matches);
        } else {
          setMatches([]);
        }
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Failed fetching matches:', err);
      } finally {
        if (showLoadingSpinner) setIsLoading(false);
      }
    },
    [selectedLeague, currentDate, searchQuery]
  );

  useEffect(() => {
    fetchMatches(true);
  }, [fetchMatches]);

  // Auto-refresh interval (30s)
  useEffect(() => {
    if (!isAutoRefresh || selectedStatus === 'standings') return;

    const interval = setInterval(() => {
      fetchMatches(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [isAutoRefresh, selectedStatus, fetchMatches]);

  // Compute live match count
  const liveCount = useMemo(() => {
    return matches.filter((m) => m.status.state === 'in').length;
  }, [matches]);

  // Filter matches based on selected status and favorites
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      // Status filter
      if (selectedStatus === 'live' && match.status.state !== 'in') return false;
      if (selectedStatus === 'upcoming' && match.status.state !== 'pre')
        return false;
      if (
        selectedStatus === 'finished' &&
        match.status.state !== 'post' &&
        !match.status.completed
      )
        return false;

      // Favorites filter
      if (showFavoritesOnly) {
        const isHomeFav = isFavoriteTeam(match.homeTeam.name);
        const isAwayFav = isFavoriteTeam(match.awayTeam.name);
        if (!isHomeFav && !isAwayFav) return false;
      }

      return true;
    });
  }, [matches, selectedStatus, showFavoritesOnly, isFavoriteTeam]);

  // Group matches by favorite vs rest, and by league
  const { favoriteMatches, matchesByLeague } = useMemo(() => {
    const favs: Match[] = [];
    const leagueMap = new Map<string, { info: { name: string; logo: string }; list: Match[] }>();

    for (const match of filteredMatches) {
      const isHomeFav = isFavoriteTeam(match.homeTeam.name);
      const isAwayFav = isFavoriteTeam(match.awayTeam.name);

      if (isHomeFav || isAwayFav) {
        favs.push(match);
      }

      if (!leagueMap.has(match.leagueSlug)) {
        leagueMap.set(match.leagueSlug, {
          info: { name: match.leagueName, logo: match.leagueLogo },
          list: [],
        });
      }
      leagueMap.get(match.leagueSlug)!.list.push(match);
    }

    return {
      favoriteMatches: favs,
      matchesByLeague: Array.from(leagueMap.entries()).map(([slug, data]) => ({
        slug,
        name: data.info.name,
        logo: data.info.logo,
        matches: data.list,
      })),
    };
  }, [filteredMatches, isFavoriteTeam]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        liveCount={liveCount}
        isAutoRefresh={isAutoRefresh}
        onToggleAutoRefresh={() => setIsAutoRefresh(!isAutoRefresh)}
        lastUpdated={lastUpdated}
        onManualRefresh={() => fetchMatches(true)}
        isLoading={isLoading}
      />

      {/* Horizontal League Filter Strip */}
      <LeagueFilterStrip
        selectedLeague={selectedLeague}
        onSelectLeague={setSelectedLeague}
        hasFavorites={favoriteTeams.length > 0}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesOnly={() => setShowFavoritesOnly(!showFavoritesOnly)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Anti-Lost-Track Hero Notice Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-zinc-900 border border-emerald-500/20 p-4 sm:p-5 mb-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Never Miss Kickoff Again</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    Google Sync
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Click <strong className="text-emerald-400 font-semibold">"Google Calendar"</strong> on any upcoming fixture to auto-create phone reminders 15 minutes before kickoff.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800">
                {filteredMatches.length} {filteredMatches.length === 1 ? 'Match' : 'Matches'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Navigation Tabs (All, Live, Upcoming, Finished, Standings) */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === 'all'
                  ? 'bg-zinc-100 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              All Matches
            </button>

            <button
              onClick={() => setSelectedStatus('live')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === 'live'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  liveCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'
                }`}
              ></span>
              <span>Live Now</span>
              {liveCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 text-[10px]">
                  {liveCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setSelectedStatus('upcoming')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === 'upcoming'
                  ? 'bg-zinc-100 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Upcoming</span>
            </button>

            <button
              onClick={() => setSelectedStatus('finished')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === 'finished'
                  ? 'bg-zinc-100 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Finished</span>
            </button>

            <button
              onClick={() => setSelectedStatus('standings')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === 'standings'
                  ? 'bg-zinc-100 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Standings</span>
            </button>
          </div>
        </div>

        {/* Standings View */}
        {selectedStatus === 'standings' ? (
          <div className="mt-4">
            <StandingsTable
              initialLeague={selectedLeague !== 'all' ? selectedLeague : 'eng.1'}
            />
          </div>
        ) : (
          <>
            {/* Date Navigator Bar */}
            <DateNavigator
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />

            {/* Loading Indicator */}
            {isLoading && (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-zinc-400 text-xs font-medium">
                  Fetching live scores and fixtures...
                </p>
              </div>
            )}

            {/* Content: Matches List */}
            {!isLoading && (
              <>
                {/* Section: Pinned Favorite Teams Matches (if any) */}
                {favoriteMatches.length > 0 && !showFavoritesOnly && (
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <h3 className="font-bold text-sm text-amber-300 uppercase tracking-wide">
                        My Pinned Teams
                      </h3>
                      <span className="text-[11px] text-zinc-500">
                        ({favoriteMatches.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {favoriteMatches.map((match) => (
                        <MatchCard
                          key={`fav-${match.id}`}
                          match={match}
                          onOpenMatchCenter={setSelectedMatchForModal}
                          isFavoriteHome={isFavoriteTeam(match.homeTeam.name)}
                          isFavoriteAway={isFavoriteTeam(match.awayTeam.name)}
                          onToggleFavoriteTeam={toggleFavoriteTeam}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Categorized Matches by League */}
                {matchesByLeague.length > 0 ? (
                  <div className="space-y-6">
                    {matchesByLeague.map((group) => (
                      <div key={group.slug} className="space-y-3">
                        {/* League Header */}
                        <div className="flex items-center justify-between px-1 border-b border-zinc-800/60 pb-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={group.logo}
                              alt=""
                              className="w-5 h-5 object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                            <h4 className="font-extrabold text-sm sm:text-base text-zinc-200">
                              {group.name}
                            </h4>
                          </div>
                          <span className="text-xs font-mono text-zinc-500">
                            {group.matches.length}{' '}
                            {group.matches.length === 1 ? 'fixture' : 'fixtures'}
                          </span>
                        </div>

                        {/* Matches Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {group.matches.map((match) => (
                            <MatchCard
                              key={match.id}
                              match={match}
                              onOpenMatchCenter={setSelectedMatchForModal}
                              isFavoriteHome={isFavoriteTeam(match.homeTeam.name)}
                              isFavoriteAway={isFavoriteTeam(match.awayTeam.name)}
                              onToggleFavoriteTeam={toggleFavoriteTeam}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty state */
                  <div className="py-20 text-center space-y-4 max-w-md mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-2xl text-zinc-500">
                      ⚽
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-zinc-200">
                        No matches found
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        {showFavoritesOnly
                          ? "None of your starred teams have scheduled matches on this date."
                          : searchQuery
                          ? `No matches matching "${searchQuery}". Try a different search.`
                          : "No matches scheduled for this date in the selected league. Use the date navigator to view other matchdays."}
                      </p>
                    </div>

                    <div className="flex justify-center gap-2 pt-2">
                      {showFavoritesOnly && (
                        <button
                          onClick={() => setShowFavoritesOnly(false)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200"
                        >
                          Show All Matches
                        </button>
                      )}
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200"
                        >
                          Clear Search
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedLeague('all');
                          setSelectedStatus('all');
                          setCurrentDate(new Date());
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors"
                      >
                        Reset to Today
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Match Center Detailed Modal */}
      <MatchCenterModal
        match={selectedMatchForModal}
        onClose={() => setSelectedMatchForModal(null)}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">KickOff Tracker</span>
            <span>•</span>
            <span>Google Calendar Enabled</span>
          </div>
          <p>
            Real-time live scores, upcoming fixtures, team lineups, and match stats.
          </p>
        </div>
      </footer>
    </div>
  );
}
