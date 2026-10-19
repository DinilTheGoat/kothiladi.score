'use client';

import React, { useState } from 'react';
import { Match } from '@/types/football';
import {
  formatLocalKickoff,
  getKickoffCountdown,
  formatMatchFullDate,
} from '@/utils/time';
import { generateGoogleCalendarUrl, downloadIcsFile } from '@/utils/calendar';
import {
  Calendar,
  Clock,
  Star,
  Tv,
  ChevronRight,
  Download,
  ExternalLink,
  MapPin,
  Flame,
} from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onOpenMatchCenter: (match: Match) => void;
  isFavoriteHome: boolean;
  isFavoriteAway: boolean;
  onToggleFavoriteTeam: (teamName: string) => void;
}

export function MatchCard({
  match,
  onOpenMatchCenter,
  isFavoriteHome,
  isFavoriteAway,
  onToggleFavoriteTeam,
}: MatchCardProps) {
  const [showCalDropdown, setShowCalDropdown] = useState(false);

  const isLive = match.status.state === 'in';
  const isUpcoming = match.status.state === 'pre';
  const isFinished = match.status.state === 'post' || match.status.completed;

  const countdown = isUpcoming ? getKickoffCountdown(match.date) : null;
  const localKickoff = formatLocalKickoff(match.date);
  const googleCalUrl = isUpcoming ? generateGoogleCalendarUrl(match) : '#';

  const hasFavorite = isFavoriteHome || isFavoriteAway;

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 bg-zinc-900/80 hover:bg-zinc-850 hover:shadow-lg ${
        isLive
          ? 'border-emerald-500/50 shadow-emerald-500/5 bg-zinc-900'
          : hasFavorite
          ? 'border-amber-500/40 bg-zinc-900/90'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Top Banner: League & Status */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/60 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={match.leagueLogo}
            alt={match.leagueName}
            className="w-4 h-4 object-contain flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-semibold text-zinc-300 truncate">
            {match.leagueName}
          </span>
          {match.venue && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-500 truncate max-w-[160px]">
              • <MapPin className="w-3 h-3 flex-shrink-0" /> {match.venue.name}
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{match.status.displayClock || 'LIVE'}</span>
            </span>
          )}

          {isUpcoming && (
            <div className="flex items-center gap-2">
              {countdown?.isImminent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                  <Flame className="w-3 h-3" />
                  {countdown.text}
                </span>
              )}
              {!countdown?.isImminent && countdown?.text && (
                <span className="text-[11px] text-zinc-400 hidden sm:inline">
                  {countdown.text}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono font-medium text-xs">
                {localKickoff}
              </span>
            </div>
          )}

          {isFinished && (
            <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 font-semibold text-[11px]">
              {match.status.detail || 'FT'}
            </span>
          )}
        </div>
      </div>

      {/* Main Scoreboard Body */}
      <div
        onClick={() => onOpenMatchCenter(match)}
        className="px-4 py-4 cursor-pointer hover:bg-zinc-800/40 transition-colors"
      >
        <div className="space-y-3">
          {/* Home Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavoriteTeam(match.homeTeam.name);
                }}
                className={`p-1 rounded-md transition-colors ${
                  isFavoriteHome
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-zinc-600 hover:text-zinc-400 opacity-60 hover:opacity-100'
                }`}
                title={
                  isFavoriteHome
                    ? `Unstar ${match.homeTeam.name}`
                    : `Pin ${match.homeTeam.name} to favorites`
                }
              >
                <Star
                  className={`w-4 h-4 ${isFavoriteHome ? 'fill-amber-400' : ''}`}
                />
              </button>

              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800/60 p-1 flex-shrink-0">
                <img
                  src={match.homeTeam.logo}
                  alt={match.homeTeam.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://a.espncdn.com/i/teamlogos/soccer/500/default.png';
                  }}
                />
              </div>

              <span
                className={`font-semibold text-sm sm:text-base truncate ${
                  isFavoriteHome ? 'text-amber-200' : 'text-zinc-100'
                }`}
              >
                {match.homeTeam.name}
              </span>
            </div>

            {/* Home Score */}
            <div className="flex-shrink-0">
              {match.homeTeam.score !== undefined ? (
                <span
                  className={`font-mono text-xl sm:text-2xl font-black ${
                    isLive
                      ? 'text-emerald-400'
                      : isFinished
                      ? 'text-zinc-200'
                      : 'text-zinc-500'
                  }`}
                >
                  {match.homeTeam.score}
                </span>
              ) : (
                <span className="text-zinc-600 font-mono text-lg">-</span>
              )}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavoriteTeam(match.awayTeam.name);
                }}
                className={`p-1 rounded-md transition-colors ${
                  isFavoriteAway
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-zinc-600 hover:text-zinc-400 opacity-60 hover:opacity-100'
                }`}
                title={
                  isFavoriteAway
                    ? `Unstar ${match.awayTeam.name}`
                    : `Pin ${match.awayTeam.name} to favorites`
                }
              >
                <Star
                  className={`w-4 h-4 ${isFavoriteAway ? 'fill-amber-400' : ''}`}
                />
              </button>

              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800/60 p-1 flex-shrink-0">
                <img
                  src={match.awayTeam.logo}
                  alt={match.awayTeam.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://a.espncdn.com/i/teamlogos/soccer/500/default.png';
                  }}
                />
              </div>

              <span
                className={`font-semibold text-sm sm:text-base truncate ${
                  isFavoriteAway ? 'text-amber-200' : 'text-zinc-100'
                }`}
              >
                {match.awayTeam.name}
              </span>
            </div>

            {/* Away Score */}
            <div className="flex-shrink-0">
              {match.awayTeam.score !== undefined ? (
                <span
                  className={`font-mono text-xl sm:text-2xl font-black ${
                    isLive
                      ? 'text-emerald-400'
                      : isFinished
                      ? 'text-zinc-200'
                      : 'text-zinc-500'
                  }`}
                >
                  {match.awayTeam.score}
                </span>
              ) : (
                <span className="text-zinc-600 font-mono text-lg">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Broadcast info if available */}
        {match.broadcast && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Tv className="w-3.5 h-3.5 text-zinc-400" />
            <span>Watch on: <strong className="text-zinc-300">{match.broadcast}</strong></span>
          </div>
        )}
      </div>

      {/* Card Footer: Google Calendar button & Match Center Link */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/60 border-t border-zinc-800/70 rounded-b-xl gap-2">
        {/* Anti-Lost-Track: Add to Google Calendar */}
        {isUpcoming ? (
          <div className="relative">
            <div className="flex items-center">
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all hover:scale-[1.02]"
                title="Add to Google Calendar with 15-minute alert"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Google Calendar</span>
              </a>

              {/* Sub-button for .ics file download */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalDropdown(!showCalDropdown);
                }}
                className="px-1.5 py-1.5 rounded-r-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-y border-r border-emerald-500/30 text-xs transition-colors"
                title="More calendar options"
              >
                ▼
              </button>
            </div>

            {/* Dropdown for ICS download */}
            {showCalDropdown && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 bottom-full mb-1 z-30 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 text-xs text-zinc-200"
              >
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 text-emerald-400 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Calendar</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    downloadIcsFile(match);
                    setShowCalDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800 text-left"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Download .ICS (Apple/Outlook)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-zinc-500">
            {isLive ? '🔴 Live in play' : '🏁 Match concluded'}
          </div>
        )}

        {/* Match Center trigger */}
        <button
          type="button"
          onClick={() => onOpenMatchCenter(match)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition-colors"
        >
          <span>Match Center</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
