export type Place = number | "DNF";

export interface Racer {
  id: string;
  name: string;
  carNumber?: string;
  color: string;
  createdAt: number;
}

export interface RaceResult {
  racerId: string;
  place: Place;
}

export interface Race {
  id: string;
  results: RaceResult[];
  createdAt: number;
}

export type CompetitionStatus = "active" | "completed";

export interface Competition {
  id: string;
  name: string;
  racerIds: string[];
  races: Race[];
  status: CompetitionStatus;
  createdAt: number;
  completedAt?: number;
}
