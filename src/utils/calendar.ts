import { Match } from '../types/football';

/**
 * Formats a Date object or ISO string to Google Calendar format (YYYYMMDDTHHmmssZ)
 */
function toCalendarUtcString(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Generates an instant 1-click Google Calendar Event URL with pre-filled match info
 */
export function generateGoogleCalendarUrl(match: Match): string {
  const startDate = new Date(match.date);
  // Default football match duration: ~115 minutes (90m + 15m HT + added time)
  const endDate = new Date(startDate.getTime() + 115 * 60 * 1000);

  const startUtc = toCalendarUtcString(startDate);
  const endUtc = toCalendarUtcString(endDate);

  const title = `⚽ ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.leagueName})`;

  const venueInfo = match.venue
    ? `${match.venue.name}${match.venue.city ? ', ' + match.venue.city : ''}`
    : 'Match Stadium';

  const details = [
    `🏆 Competition: ${match.leagueName}`,
    `⚔️ Matchup: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
    `🏟️ Venue: ${venueInfo}`,
    `⏰ Scheduled Kickoff: ${startDate.toUTCString()} (Local: ${startDate.toLocaleString()})`,
    '',
    'Track live scores, lineups, and match stats on KickOff Tracker.',
    'Reminder: Kickoff in 15 minutes!'
  ].join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details: details,
    location: venueInfo,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates and triggers download of an .ics calendar file with an embedded 15-minute alert
 */
export function downloadIcsFile(match: Match): void {
  const startDate = new Date(match.date);
  const endDate = new Date(startDate.getTime() + 115 * 60 * 1000);
  const now = new Date();

  const startUtc = toCalendarUtcString(startDate);
  const endUtc = toCalendarUtcString(endDate);
  const nowUtc = toCalendarUtcString(now);

  const venueInfo = match.venue
    ? `${match.venue.name}${match.venue.city ? ', ' + match.venue.city : ''}`
    : 'Stadium';

  const summary = `⚽ ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.leagueName})`;
  const description = `Competition: ${match.leagueName}\\n${match.homeTeam.name} vs ${match.awayTeam.name}\\nVenue: ${venueInfo}\\nKeep track of live match updates!`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KickOff Tracker//Football Fixtures//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${match.id}-${Date.now()}@kickofftracker.app`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${venueInfo}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Kickoff Alert: ${match.homeTeam.name} vs ${match.awayTeam.name} in 15 minutes!`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `${match.homeTeam.shortName || match.homeTeam.name}_vs_${match.awayTeam.shortName || match.awayTeam.name}.ics`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
