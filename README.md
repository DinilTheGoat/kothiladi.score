# ⚽ KickOff Tracker

> **Never lose track of a football match again.** Real-time live scoreboards, upcoming fixtures across all major leagues and domestic cups, and instant **Google Calendar** integration with automatic kickoff reminders.

---

## 🌟 Key Features

### 1. 📅 Google Calendar & Reminder Integration
- **1-Click Google Calendar Sync**: Every upcoming fixture has an instant **"Add to Google Calendar"** button that pre-fills the match title, venue, local/UTC kickoff time, and competition.
- **15-Minute Kickoff Alerts**: Embedded reminders so your phone alerts you before kickoff.
- **iCal / `.ics` Export**: Option to download calendar files for Apple Calendar, Outlook, and other calendar apps.
- **Automatic Local Timezone Conversion**: Automatically detects your device's timezone (e.g., IST, BST, CET, EST) and eliminates UTC confusion.
- **Live Countdown Clocks**: Real-time badges showing *"Starts in 1h 24m"* or *"Starts in 12 mins!"*.

### 2. 🏆 Global Coverage Across All Major Competitions
- **Premier League** (England)
- **UEFA Champions League** & **Europa League** (Europe)
- **La Liga** & **Copa del Rey** (Spain)
- **Serie A** (Italy)
- **Bundesliga** (Germany)
- **Ligue 1** (France)
- **FA Cup** (England)
- **Major League Soccer** (USA)

### 3. 🎯 Smart Match Categorization & Discovery
- **Status Tabs**: *All Fixtures*, *Live Now* (with pulsing badge & active match count), *Upcoming*, *Finished Results*, and *League Standings*.
- **League Filter Strip**: Quick-access pills with official league crests.
- **Date Navigator**: Jump between *Yesterday*, *Today*, *Tomorrow*, or pick any custom date.
- **Global Search**: Instantly find matches by team name (e.g. *Arsenal*, *Barcelona*), league, or stadium name (*Anfield*, *Bernabéu*).
- **⭐ Pinned / Favorite Teams**: Star your favorite clubs. Starred teams stay pinned at the top of your dashboard (persisted in `localStorage`).

### 4. 📊 Full Match Center & Scoreboards
- **Live Match Clock & Scores**: Real-time score updates with period and minute indicators (`45'`, `HT`, `82'`).
- **Match Events Timeline**: Chronological stream of goals (⚽), yellow/red cards (🟨/🟥), substitutions (🔄), and penalties.
- **Tactical Lineups**: Formations (e.g. `4-3-3`, `4-2-3-1`), starting XI with jersey numbers, positions, and substitute benches.
- **Head-to-Head Statistics**: Visual comparison progress bars for Possession (%), Total Shots, Shots on Target, Corners, and Fouls.
- **League Tables**: Full standings tables with games played, goal difference, points, and Champions League/relegation cutoff zones.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested with Node 20 LTS)
- npm or pnpm

### Running Locally
```bash
cd kickoff-tracker
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) (or the assigned port) in your browser.

### Building for Production
```bash
npm run build
npm run start
```
