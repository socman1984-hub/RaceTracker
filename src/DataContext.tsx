import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generateId } from "./id";
import {
  loadCompetitions,
  loadRacers,
  saveCompetitions,
  saveRacers,
} from "./storage";
import { Competition, Race, RaceResult, Racer } from "./types";

interface DataContextValue {
  loading: boolean;
  racers: Racer[];
  competitions: Competition[];
  getRacerById: (id: string) => Racer | undefined;
  addRacer: (name: string, color: string, carNumber?: string) => Racer;
  updateRacer: (
    id: string,
    updates: Partial<Pick<Racer, "name" | "color" | "carNumber">>
  ) => void;
  canDeleteRacer: (id: string) => boolean;
  deleteRacer: (id: string) => void;
  createCompetition: (name: string, racerIds: string[]) => Competition;
  addRace: (competitionId: string, results: RaceResult[]) => void;
  endCompetition: (competitionId: string) => void;
  deleteCompetition: (competitionId: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [racers, setRacers] = useState<Racer[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  useEffect(() => {
    (async () => {
      const [loadedRacers, loadedCompetitions] = await Promise.all([
        loadRacers(),
        loadCompetitions(),
      ]);
      setRacers(loadedRacers);
      setCompetitions(loadedCompetitions);
      setLoading(false);
    })();
  }, []);

  const persistRacers = useCallback((next: Racer[]) => {
    setRacers(next);
    void saveRacers(next);
  }, []);

  const persistCompetitions = useCallback((next: Competition[]) => {
    setCompetitions(next);
    void saveCompetitions(next);
  }, []);

  const getRacerById = useCallback(
    (id: string) => racers.find((r) => r.id === id),
    [racers]
  );

  const addRacer = useCallback(
    (name: string, color: string, carNumber?: string) => {
      const racer: Racer = {
        id: generateId(),
        name,
        color,
        carNumber,
        createdAt: Date.now(),
      };
      persistRacers([...racers, racer]);
      return racer;
    },
    [racers, persistRacers]
  );

  const updateRacer = useCallback(
    (id: string, updates: Partial<Pick<Racer, "name" | "color" | "carNumber">>) => {
      persistRacers(
        racers.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
    },
    [racers, persistRacers]
  );

  const canDeleteRacer = useCallback(
    (id: string) => !competitions.some((c) => c.racerIds.includes(id)),
    [competitions]
  );

  const deleteRacer = useCallback(
    (id: string) => {
      persistRacers(racers.filter((r) => r.id !== id));
    },
    [racers, persistRacers]
  );

  const createCompetition = useCallback(
    (name: string, racerIds: string[]) => {
      const competition: Competition = {
        id: generateId(),
        name,
        racerIds,
        races: [],
        status: "active",
        createdAt: Date.now(),
      };
      persistCompetitions([...competitions, competition]);
      return competition;
    },
    [competitions, persistCompetitions]
  );

  const addRace = useCallback(
    (competitionId: string, results: RaceResult[]) => {
      const race: Race = {
        id: generateId(),
        results,
        createdAt: Date.now(),
      };
      persistCompetitions(
        competitions.map((c) =>
          c.id === competitionId ? { ...c, races: [...c.races, race] } : c
        )
      );
    },
    [competitions, persistCompetitions]
  );

  const endCompetition = useCallback(
    (competitionId: string) => {
      persistCompetitions(
        competitions.map((c) =>
          c.id === competitionId
            ? { ...c, status: "completed" as const, completedAt: Date.now() }
            : c
        )
      );
    },
    [competitions, persistCompetitions]
  );

  const deleteCompetition = useCallback(
    (competitionId: string) => {
      persistCompetitions(competitions.filter((c) => c.id !== competitionId));
    },
    [competitions, persistCompetitions]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      racers,
      competitions,
      getRacerById,
      addRacer,
      updateRacer,
      canDeleteRacer,
      deleteRacer,
      createCompetition,
      addRace,
      endCompetition,
      deleteCompetition,
    }),
    [
      loading,
      racers,
      competitions,
      getRacerById,
      addRacer,
      updateRacer,
      canDeleteRacer,
      deleteRacer,
      createCompetition,
      addRace,
      endCompetition,
      deleteCompetition,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
