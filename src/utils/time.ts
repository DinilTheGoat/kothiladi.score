/**
 * Formats date object to YYYYMMDD string for sports API
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

/**
 * Returns user's detected local timezone (e.g. Europe/London or Asia/Kolkata)
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Format match kickoff time into readable local time
 */
export function formatLocalKickoff(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats full match date & time with day of week
 */
export function formatMatchFullDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculates human-readable countdown string to kickoff
 */
export function getKickoffCountdown(dateStr: string): {
  text: string;
  isImminent: boolean; // < 30 mins
  isLiveOrPast: boolean;
} {
  try {
    const matchTime = new Date(dateStr).getTime();
    const now = Date.now();
    const diffMs = matchTime - now;

    if (diffMs <= 0) {
      return { text: 'Started', isImminent: false, isLiveOrPast: true };
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) {
      return { text: `In ${diffDays} days`, isImminent: false, isLiveOrPast: false };
    }
    if (diffDays === 1) {
      return { text: `Tomorrow (${diffHours}h)`, isImminent: false, isLiveOrPast: false };
    }
    if (diffHours >= 1) {
      const remainingMins = diffMins % 60;
      return {
        text: `In ${diffHours}h ${remainingMins > 0 ? remainingMins + 'm' : ''}`,
        isImminent: diffHours < 1,
        isLiveOrPast: false,
      };
    }
    if (diffMins > 1) {
      return {
        text: `Starts in ${diffMins} mins!`,
        isImminent: true,
        isLiveOrPast: false,
      };
    }
    return {
      text: 'Starting now!',
      isImminent: true,
      isLiveOrPast: false,
    };
  } catch {
    return { text: '', isImminent: false, isLiveOrPast: false };
  }
}
