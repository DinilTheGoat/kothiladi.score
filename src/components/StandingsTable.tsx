'use client';

import React, { useEffect, useState } from 'react';
import { StandingEntry } from '@/types/football';
import { SUPPORTED_LEAGUES } from '@/constants/leagues';
import { Trophy, Shield } from 'lucide-react';

interface StandingsTableProps {
  initialLeague?: string;
}

export function StandingsTable({ initialLeague = 'eng.1' }: StandingsTableProps) {
  const [selectedLeague, setSelectedLeague] = useState(initialLeague);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/standings?league=${selectedLeague}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success && data.standings) {
            setStandings(data.standings);
          } else {
            setStandings([]);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching standings:', err);
        if (isMounted) {
          setStandings([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedLeague]);

  const currentLeagueObj =
    SUPPORTED_LEAGUES.find((l) => l.slug === selectedLeague) ||
    SUPPORTED_LEAGUES[0];

  return (
    <div className="space-y-4">
      {/* League Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {SUPPORTED_LEAGUES.filter((l) => !l.slug.includes('fa') && !l.slug.includes('copa')).map(
          (league) => (
            <button
              key={league.slug}
              onClick={() => setSelectedLeague(league.slug)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedLeague === league.slug
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <img
                src={league.logo}
                alt=""
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span>{league.name}</span>
            </button>
          )
        )}
      </div>

      {/* Standings Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <img
              src={currentLeagueObj.logo}
              alt=""
              className="w-6 h-6 object-contain"
            />
            <h3 className="font-bold text-sm sm:text-base text-zinc-100">
              {currentLeagueObj.name} Table & Standings
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            2026/27 Season
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-zinc-400 text-xs sm:text-sm">
            <span className="inline-block w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2"></span>
            Loading latest league standings...
          </div>
        ) : standings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-950/60 text-zinc-400 text-[11px] uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-3 sm:px-4 w-12 text-center">#</th>
                  <th className="py-3 px-3 sm:px-4">Club</th>
                  <th className="py-3 px-2 sm:px-3 text-center">P</th>
                  <th className="py-3 px-2 sm:px-3 text-center hidden sm:table-cell">W</th>
                  <th className="py-3 px-2 sm:px-3 text-center hidden sm:table-cell">D</th>
                  <th className="py-3 px-2 sm:px-3 text-center hidden sm:table-cell">L</th>
                  <th className="py-3 px-2 sm:px-3 text-center hidden md:table-cell">GD</th>
                  <th className="py-3 px-3 sm:px-4 text-center font-bold text-white">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {standings.map((entry) => {
                  const isTop4 = entry.rank <= 4;
                  const isRelegation = entry.rank >= standings.length - 2;

                  return (
                    <tr
                      key={entry.team.id || entry.rank}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Rank with qualification bar */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold font-mono text-xs ${
                            isTop4
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isRelegation
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'text-zinc-400'
                          }`}
                        >
                          {entry.rank}
                        </span>
                      </td>

                      {/* Team Logo and Name */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={entry.team.logo}
                            alt=""
                            className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="font-semibold text-zinc-100 truncate max-w-[140px] sm:max-w-none">
                            {entry.team.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-2 sm:px-3 text-center font-mono text-zinc-300">
                        {entry.gamesPlayed}
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-center font-mono text-zinc-400 hidden sm:table-cell">
                        {entry.won}
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-center font-mono text-zinc-400 hidden sm:table-cell">
                        {entry.drawn}
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-center font-mono text-zinc-400 hidden sm:table-cell">
                        {entry.lost}
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-center font-mono text-zinc-400 hidden md:table-cell">
                        {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center font-mono font-bold text-white text-sm sm:text-base">
                        {entry.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-500 text-xs">
            Standings table not available for this league at this time.
          </div>
        )}

        {/* Legend */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center gap-4 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span>Champions League / Top spots</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
            <span>Relegation Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
