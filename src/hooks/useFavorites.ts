'use client';

import { useState, useEffect } from 'react';

const FAVORITE_TEAMS_KEY = 'kickoff_favorite_teams';
const FAVORITE_LEAGUES_KEY = 'kickoff_favorite_leagues';

export function useFavorites() {
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedTeams = localStorage.getItem(FAVORITE_TEAMS_KEY);
      const storedLeagues = localStorage.getItem(FAVORITE_LEAGUES_KEY);
      if (storedTeams) setFavoriteTeams(JSON.parse(storedTeams));
      if (storedLeagues) setFavoriteLeagues(JSON.parse(storedLeagues));
    } catch (e) {
      console.warn('Failed reading favorites from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const toggleFavoriteTeam = (teamName: string) => {
    setFavoriteTeams((prev) => {
      const exists = prev.includes(teamName);
      const next = exists ? prev.filter((t) => t !== teamName) : [...prev, teamName];
      try {
        localStorage.setItem(FAVORITE_TEAMS_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const isFavoriteTeam = (teamName: string) => {
    return favoriteTeams.includes(teamName);
  };

  const toggleFavoriteLeague = (leagueSlug: string) => {
    setFavoriteLeagues((prev) => {
      const exists = prev.includes(leagueSlug);
      const next = exists ? prev.filter((l) => l !== leagueSlug) : [...prev, leagueSlug];
      try {
        localStorage.setItem(FAVORITE_LEAGUES_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const isFavoriteLeague = (leagueSlug: string) => {
    return favoriteLeagues.includes(leagueSlug);
  };

  return {
    favoriteTeams,
    favoriteLeagues,
    toggleFavoriteTeam,
    isFavoriteTeam,
    toggleFavoriteLeague,
    isFavoriteLeague,
    isLoaded,
  };
}
