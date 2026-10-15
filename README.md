# Racing Tracker

Tracks diecast racing league competitions on your iPhone. Racers, competitions,
per-race finishing order (with DNF), automatic points, and full history — all
stored locally on the device (AsyncStorage), no account or internet required.

## How it works

- **Racers** tab: add/edit racers (name, optional car number, color).
- **Competitions** tab: start a new competition by picking who's racing.
  - Inside a competition, tap **Add Race** and tap racers in the order they
    finish (or mark **DNF**). Repeat for as many races as you run.
  - Points per race: last place = 1 point, each place up = +1
    (e.g. 4 racers → 1st=4, 2nd=3, 3rd=2, 4th=1; DNF = 0).
  - Tap **Competition Over** to lock it in — final standings and the winner
    are calculated from the total points across all races.
  - **History** (the other half of the Competitions tab) shows every
    completed competition and its race-by-race results.

## Running it

You'll test this on your iPhone via the free **Expo Go** app — no Mac or
Xcode required for development.

1. Install dependencies (already done once on this machine, but if you copy
   this project elsewhere or pull it fresh):
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npx expo start
   ```
3. Install **Expo Go** from the App Store on your iPhone, then scan the QR
   code shown in the terminal with your Camera app.

The app will load on your phone and hot-reload as you make changes.

## Later: a real standalone app (no Expo Go)

When you're happy with it and want a proper installable app icon (not just
running inside Expo Go), you can build it with Expo's free cloud build
service — still no Mac needed:

```bash
npx eas-cli build --platform ios --profile preview
```

That requires a (free) Expo account and, for installing on your own iPhone,
a (free) Apple ID at minimum — a paid Apple Developer account is only needed
if you want to distribute it via the App Store instead of installing it
directly on your own device(s).

## Project structure

- `app/` — screens, using Expo Router (file-based navigation)
- `src/types.ts` — data model (Racer, Competition, Race, RaceResult)
- `src/scoring.ts` — points calculation and standings
- `src/DataContext.tsx` — in-memory state + persistence to AsyncStorage
- `src/storage.ts` — the actual AsyncStorage read/write calls
