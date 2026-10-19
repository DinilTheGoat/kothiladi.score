'use client';

import React from 'react';
import Image from 'next/image';
import { SUPPORTED_LEAGUES } from '@/constants/leagues';
import { Star } from 'lucide-react';

interface LeagueFilterStripProps {
  selectedLeague: string;
  onSelectLeague: (slug: string) => void;
  hasFavorites: boolean;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
}

export function LeagueFilterStrip({
  selectedLeague,
  onSelectLeague,
  hasFavorites,
  showFavoritesOnly,
  onToggleFavoritesOnly,
}: LeagueFilterStripProps) {
  return (
    <div className="relative py-2 border-b border-zinc-800/80 bg-zinc-950/60 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
        {/* All Leagues Pill */}
        <button
          onClick={() => {
            if (showFavoritesOnly) onToggleFavoritesOnly();
            onSelectLeague('all');
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedLeague === 'all' && !showFavoritesOnly
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          <span>🌍</span>
          <span>All Leagues</span>
        </button>

        {/* Favorites Pill */}
        {hasFavorites && (
          <button
            onClick={onToggleFavoritesOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              showFavoritesOnly
                ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-400/20'
                : 'bg-zinc-900 text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>My Teams</span>
          </button>
        )}

        {/* Individual League Pills */}
        {SUPPORTED_LEAGUES.map((league) => {
          const isSelected = selectedLeague === league.slug && !showFavoritesOnly;
          return (
            <button
              key={league.slug}
              onClick={() => {
                if (showFavoritesOnly) onToggleFavoritesOnly();
                onSelectLeague(league.slug);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800/80'
              }`}
            >
              <img
                src={league.logo}
                alt={league.name}
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span>{league.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
