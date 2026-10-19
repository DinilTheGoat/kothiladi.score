'use client';

import React, { useState, useEffect } from 'react';
import { Match, MatchDetail } from '@/types/football';
import {
  formatMatchFullDate,
  formatLocalKickoff,
  getKickoffCountdown,
} from '@/utils/time';
import { generateGoogleCalendarUrl, downloadIcsFile } from '@/utils/calendar';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Shield,
  Activity,
  Award,
  AlertCircle,
  Tv,
} from 'lucide-react';

interface MatchCenterModalProps {
  match: Match | null;
  onClose: () => void;
}

export function MatchCenterModal({ match, onClose }: MatchCenterModalProps) {
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'lineups' | 'stats' | 'info'>('timeline');

  useEffect(() => {
    if (!match) {
      setDetail(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/matches/${match.id}?league=${match.leagueSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success && data.match) {
            setDetail(data.match);
          } else {
            // fallback to basic match
            setDetail({
              ...match,
              events: [],
              stats: [],
            });
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed fetching match summary', err);
        if (isMounted) {
          setDetail({
            ...match,
            events: [],
            stats: [],
          });
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [match]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (match) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [match]);

  if (!match) return null;

  const currentMatch = detail || match;
  const isLive = currentMatch.status.state === 'in';
  const isUpcoming = currentMatch.status.state === 'pre';
  const isFinished = currentMatch.status.state === 'post' || currentMatch.status.completed;
  const countdown = isUpcoming ? getKickoffCountdown(currentMatch.date) : null;
  const googleCalUrl = isUpcoming ? generateGoogleCalendarUrl(currentMatch) : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100"
      >
        {/* Top Bar with Competition & Close */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <img
              src={currentMatch.leagueLogo}
              alt={currentMatch.leagueName}
              className="w-5 h-5 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-bold text-xs sm:text-sm text-zinc-200">
              {currentMatch.leagueName}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Scoreboard Banner */}
        <div className="px-6 py-6 bg-gradient-to-b from-zinc-900 via-zinc-900/70 to-zinc-950 border-b border-zinc-800/60">
          <div className="grid grid-cols-7 items-center gap-2">
            {/* Home Team */}
            <div className="col-span-3 flex flex-col items-center text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-800/50 p-2 flex items-center justify-center shadow-lg mb-2">
                <img
                  src={currentMatch.homeTeam.logo}
                  alt={currentMatch.homeTeam.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://a.espncdn.com/i/teamlogos/soccer/500/default.png';
                  }}
                />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-100 line-clamp-2">
                {currentMatch.homeTeam.name}
              </h3>
              <span className="text-[11px] text-zinc-500 font-medium">Home</span>
            </div>

            {/* Score / Status Center */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              {isUpcoming ? (
                <div className="flex flex-col items-center text-center">
                  <span className="text-xl sm:text-2xl font-black text-zinc-500">VS</span>
                  <span className="mt-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-mono text-xs font-bold whitespace-nowrap">
                    {formatLocalKickoff(currentMatch.date)}
                  </span>
                  {countdown?.text && (
                    <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                      {countdown.text}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 font-mono text-3xl sm:text-4xl font-black text-white">
                    <span>{currentMatch.homeTeam.score ?? 0}</span>
                    <span className="text-zinc-600">:</span>
                    <span>{currentMatch.awayTeam.score ?? 0}</span>
                  </div>
                  <div className="mt-1">
                    {isLive && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {currentMatch.status.displayClock || 'LIVE'}
                      </span>
                    )}
                    {isFinished && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-400">
                        {currentMatch.status.detail || 'Final'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="col-span-3 flex flex-col items-center text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-800/50 p-2 flex items-center justify-center shadow-lg mb-2">
                <img
                  src={currentMatch.awayTeam.logo}
                  alt={currentMatch.awayTeam.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://a.espncdn.com/i/teamlogos/soccer/500/default.png';
                  }}
                />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-100 line-clamp-2">
                {currentMatch.awayTeam.name}
              </h3>
              <span className="text-[11px] text-zinc-500 font-medium">Away</span>
            </div>
          </div>

          {/* Quick Match Sub-info & Google Calendar CTA */}
          <div className="mt-4 pt-4 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                {formatMatchFullDate(currentMatch.date)}
              </span>
              {currentMatch.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  {currentMatch.venue.name}
                  {currentMatch.venue.city ? `, ${currentMatch.venue.city}` : ''}
                </span>
              )}
            </div>

            {/* Google Calendar Link inside modal */}
            {isUpcoming && (
              <div className="flex items-center gap-2">
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-colors shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Sync Google Calendar</span>
                </a>
                <button
                  type="button"
                  onClick={() => downloadIcsFile(currentMatch)}
                  className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                  title="Download .ics file"
                >
                  .ICS
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-zinc-800 bg-zinc-900/60 px-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'timeline'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Match Events
          </button>
          <button
            onClick={() => setActiveTab('lineups')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'lineups'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Lineups & Rosters
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Match Stats
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Info & Broadcast
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-zinc-400 text-sm">
              <span className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3"></span>
              Loading match details and lineups...
            </div>
          )}

          {!isLoading && activeTab === 'timeline' && (
            <div className="space-y-4">
              {detail?.events && detail.events.length > 0 ? (
                <div className="space-y-3">
                  {detail.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-xs sm:text-sm"
                    >
                      <span className="w-10 font-mono font-bold text-emerald-400 flex-shrink-0">
                        {ev.clock || '•'}
                      </span>
                      <div className="flex-shrink-0">
                        {ev.type === 'goal' && <span className="text-lg">⚽</span>}
                        {ev.type === 'card' && (
                          <span className="text-lg">
                            {ev.text.toLowerCase().includes('red') ? '🟥' : '🟨'}
                          </span>
                        )}
                        {ev.type === 'sub' && <span className="text-lg">🔄</span>}
                        {ev.type === 'penalty' && <span className="text-lg">🎯</span>}
                        {ev.type === 'other' && <span className="text-lg">⏱️</span>}
                      </div>
                      <p className="flex-1 text-zinc-300 leading-relaxed">
                        {ev.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="font-semibold text-zinc-400">
                    {isUpcoming
                      ? 'No match events yet'
                      : 'Event commentary not available for this fixture'}
                  </p>
                  <p className="text-xs">
                    {isUpcoming
                      ? `Match kicks off at ${formatLocalKickoff(currentMatch.date)} (${countdown?.text || 'soon'}). Add it to your calendar to get alerted!`
                      : 'Final score and statistics are confirmed.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {!isLoading && activeTab === 'lineups' && (
            <div className="space-y-6">
              {detail?.rosters?.home?.starters?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Home Roster */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <img
                          src={currentMatch.homeTeam.logo}
                          alt=""
                          className="w-5 h-5 object-contain"
                        />
                        <span className="font-bold text-sm text-zinc-200">
                          {currentMatch.homeTeam.name}
                        </span>
                      </div>
                      {detail.rosters.home.formation && (
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-zinc-800 px-2 py-0.5 rounded">
                          {detail.rosters.home.formation}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Starting XI
                      </h5>
                      {detail.rosters.home.starters.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded bg-zinc-900/50 text-xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="w-5 font-mono text-zinc-500 text-right">
                              {player.jersey || '•'}
                            </span>
                            <span className="text-zinc-200 truncate font-medium">
                              {player.name}
                            </span>
                          </div>
                          <span className="text-zinc-500 text-[11px] font-mono">
                            {player.position}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Away Roster */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <img
                          src={currentMatch.awayTeam.logo}
                          alt=""
                          className="w-5 h-5 object-contain"
                        />
                        <span className="font-bold text-sm text-zinc-200">
                          {currentMatch.awayTeam.name}
                        </span>
                      </div>
                      {detail.rosters.away.formation && (
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-zinc-800 px-2 py-0.5 rounded">
                          {detail.rosters.away.formation}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Starting XI
                      </h5>
                      {detail.rosters.away.starters.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded bg-zinc-900/50 text-xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span className="w-5 font-mono text-zinc-500 text-right">
                              {player.jersey || '•'}
                            </span>
                            <span className="text-zinc-200 truncate font-medium">
                              {player.name}
                            </span>
                          </div>
                          <span className="text-zinc-500 text-[11px] font-mono">
                            {player.position}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500 space-y-2">
                  <Users className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="font-semibold text-zinc-400">
                    Lineups not announced yet
                  </p>
                  <p className="text-xs">
                    Official tactical formations and player rosters are usually
                    confirmed 60 minutes before kickoff.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isLoading && activeTab === 'stats' && (
            <div className="space-y-5">
              {detail?.stats && detail.stats.length > 0 ? (
                <div className="space-y-4">
                  {detail.stats.map((stat) => {
                    const hVal = parseFloat(String(stat.homeValue)) || 0;
                    const aVal = parseFloat(String(stat.awayValue)) || 0;
                    const total = hVal + aVal || 1;
                    const hPct = Math.round((hVal / total) * 100);
                    const aPct = 100 - hPct;

                    return (
                      <div key={stat.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="font-mono text-zinc-200">
                            {stat.homeValue}
                          </span>
                          <span className="text-zinc-400">{stat.label}</span>
                          <span className="font-mono text-zinc-200">
                            {stat.awayValue}
                          </span>
                        </div>
                        {/* Dual Bar Comparison */}
                        <div className="h-2 w-full bg-zinc-800 rounded-full flex overflow-hidden">
                          <div
                            style={{ width: `${hPct}%` }}
                            className="bg-emerald-500 h-full transition-all duration-300"
                          ></div>
                          <div
                            style={{ width: `${aPct}%` }}
                            className="bg-blue-500 h-full transition-all duration-300"
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500 space-y-2">
                  <Activity className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="font-semibold text-zinc-400">
                    No stats available yet
                  </p>
                  <p className="text-xs">
                    In-depth match statistics (possession %, shots, fouls) will
                    stream in real-time once the match begins.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isLoading && activeTab === 'info' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                  Stadium / Venue
                </span>
                <p className="font-semibold text-sm text-zinc-200">
                  {currentMatch.venue?.name || 'Venue to be confirmed'}
                </p>
                {currentMatch.venue?.city && (
                  <p className="text-xs text-zinc-400">{currentMatch.venue.city}</p>
                )}
                {detail?.attendance && (
                  <p className="text-xs text-zinc-400">
                    Attendance: {detail.attendance.toLocaleString()} fans
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                  Broadcast & Coverage
                </span>
                <p className="font-semibold text-sm text-zinc-200">
                  {currentMatch.broadcast || 'Global Sports Networks'}
                </p>
                <p className="text-xs text-zinc-400">
                  Check local listings or your regional sports provider for live stream options.
                </p>
              </div>

              {detail?.referee && (
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                    Match Official
                  </span>
                  <p className="font-semibold text-sm text-zinc-200">
                    {detail.referee}
                  </p>
                  <p className="text-xs text-zinc-400">Referee</p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                  Google Calendar Reminder
                </span>
                <p className="text-xs text-zinc-300">
                  One click to save this fixture directly to your Google Calendar or download an .ics file with a 15-minute alert.
                </p>
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline pt-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Add to Google Calendar &rarr;
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
