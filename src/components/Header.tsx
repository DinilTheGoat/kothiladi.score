'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  RefreshCw,
  Search,
  Radio,
  Trophy,
  Star,
  Globe,
} from 'lucide-react';
import { getUserTimezone } from '@/utils/time';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  liveCount: number;
  isAutoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  lastUpdated: Date;
  onManualRefresh: () => void;
  isLoading: boolean;
}

export function Header({
  searchQuery,
  onSearchChange,
  liveCount,
  isAutoRefresh,
  onToggleAutoRefresh,
  lastUpdated,
  onManualRefresh,
  isLoading,
}: HeaderProps) {
  const [userTz, setUserTz] = useState('Detecting...');

  useEffect(() => {
    setUserTz(getUserTimezone());
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20 font-bold text-xl">
              ⚽
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  KickOff Tracker
                </span>
                {liveCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {liveCount} LIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Never lose track of matches • Google Calendar Sync & Live Scores
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search teams, leagues, venues (e.g. Arsenal, Real Madrid, Anfield)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Controls: Timezone, Refresh, Auto-refresh */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Timezone pill */}
            <div
              title={`Kickoff times automatically converted to: ${userTz}`}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[130px] font-mono text-[11px]">
                {userTz}
              </span>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={onManualRefresh}
              disabled={isLoading}
              title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Auto-Refresh Toggle */}
            <button
              onClick={onToggleAutoRefresh}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isAutoRefresh
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-300'
              }`}
              title={
                isAutoRefresh
                  ? 'Auto-refresh active (every 30s for live matches)'
                  : 'Auto-refresh paused'
              }
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  isAutoRefresh ? 'animate-pulse text-emerald-400' : ''
                }`}
              />
              <span className="hidden sm:inline">Auto</span>
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search teams or leagues..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
