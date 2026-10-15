import AsyncStorage from "@react-native-async-storage/async-storage";
import { Competition, Racer } from "./types";

const RACERS_KEY = "racing-tracker:racers";
const COMPETITIONS_KEY = "racing-tracker:competitions";

export async function loadRacers(): Promise<Racer[]> {
  const raw = await AsyncStorage.getItem(RACERS_KEY);
  return raw ? (JSON.parse(raw) as Racer[]) : [];
}

export async function saveRacers(racers: Racer[]): Promise<void> {
  await AsyncStorage.setItem(RACERS_KEY, JSON.stringify(racers));
}

export async function loadCompetitions(): Promise<Competition[]> {
  const raw = await AsyncStorage.getItem(COMPETITIONS_KEY);
  return raw ? (JSON.parse(raw) as Competition[]) : [];
}

export async function saveCompetitions(competitions: Competition[]): Promise<void> {
  await AsyncStorage.setItem(COMPETITIONS_KEY, JSON.stringify(competitions));
}
