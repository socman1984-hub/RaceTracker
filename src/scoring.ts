import { Competition, Place, Race } from "./types";

// Points for a single race: last place gets 1 point, first place gets
// (total racers in that race) points. DNF always scores 0.
export function pointsForPlace(place: Place, totalRacersInRace: number): number {
  if (place === "DNF") return 0;
  return Math.max(0, totalRacersInRace - place + 1);
}

export function pointsForRacerInRace(race: Race, racerId: string): number {
  const result = race.results.find((r) => r.racerId === racerId);
  if (!result) return 0;
  return pointsForPlace(result.place, race.results.length);
}

export interface StandingEntry {
  racerId: string;
  points: number;
  racesRun: number;
  wins: number;
  rank: number;
}

export function computeStandings(competition: Competition): StandingEntry[] {
  const totals = new Map<string, { points: number; racesRun: number; wins: number }>();
  for (const racerId of competition.racerIds) {
    totals.set(racerId, { points: 0, racesRun: 0, wins: 0 });
  }

  for (const race of competition.races) {
    const totalRacersInRace = race.results.length;
    for (const result of race.results) {
      const entry = totals.get(result.racerId);
      if (!entry) continue;
      entry.points += pointsForPlace(result.place, totalRacersInRace);
      entry.racesRun += 1;
      if (result.place === 1) entry.wins += 1;
    }
  }

  const entries: StandingEntry[] = Array.from(totals.entries()).map(([racerId, v]) => ({
    racerId,
    points: v.points,
    racesRun: v.racesRun,
    wins: v.wins,
    rank: 0,
  }));

  entries.sort((a, b) => b.points - a.points || b.wins - a.wins);

  let rank = 0;
  let prevPoints: number | null = null;
  entries.forEach((entry, idx) => {
    if (entry.points !== prevPoints) {
      rank = idx + 1;
      prevPoints = entry.points;
    }
    entry.rank = rank;
  });

  return entries;
}

// Racer ids tied for first place. Only meaningful once the competition has
// at least one recorded race.
export function getWinnerIds(standings: StandingEntry[]): string[] {
  if (standings.length === 0) return [];
  const hasAnyPoints = standings.some((s) => s.racesRun > 0);
  if (!hasAnyPoints) return [];
  return standings.filter((s) => s.rank === 1).map((s) => s.racerId);
}

// Pick order for the next race: whoever finished last in the previous race
// picks first. DNFs count as worse than any finishing place, so they always
// pick before racers who scored. When racers are tied (e.g. multiple DNFs),
// the tie is broken by the race before that, and so on back through history.
export function computePickOrder(competition: Competition): string[] {
  const races = [...competition.races].sort((a, b) => a.createdAt - b.createdAt);
  if (races.length === 0) return [];

  // Larger = worse finish. Missing from a race is treated like a DNF.
  function badness(race: Race, racerId: string): number {
    const result = race.results.find((r) => r.racerId === racerId);
    if (!result || result.place === "DNF") return Infinity;
    return result.place;
  }

  return competition.racerIds
    .map((racerId, index) => ({ racerId, index }))
    .sort((a, b) => {
      for (let i = races.length - 1; i >= 0; i--) {
        const diff = badness(races[i], b.racerId) - badness(races[i], a.racerId);
        if (diff !== 0 && !Number.isNaN(diff)) return diff;
      }
      return a.index - b.index;
    })
    .map((e) => e.racerId);
}
