import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useData } from "../../../src/DataContext";
import { formatDate, placeLabel } from "../../../src/format";
import { computeStandings, getWinnerIds, pointsForRacerInRace } from "../../../src/scoring";

export default function CompetitionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { competitions, getRacerById, endCompetition, deleteCompetition } = useData();
  const router = useRouter();

  const competition = competitions.find((c) => c.id === id);

  const standings = useMemo(
    () => (competition ? computeStandings(competition) : []),
    [competition]
  );
  const winnerIds = useMemo(() => getWinnerIds(standings), [standings]);

  function handleEnd() {
    if (!competition) return;
    Alert.alert(
      "End competition?",
      "Final points will be tallied and no more races can be added.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Competition",
          style: "destructive",
          onPress: () => {
            endCompetition(competition.id);
            const finalStandings = computeStandings(competition);
            const winners = getWinnerIds(finalStandings)
              .map((wid) => getRacerById(wid)?.name ?? "Unknown")
              .join(" & ");
            Alert.alert(
              "Competition complete",
              winners ? `Winner: ${winners} 🏆` : "No races were recorded."
            );
          },
        },
      ]
    );
  }

  function handleDelete() {
    if (!competition) return;
    Alert.alert(
      "Delete competition",
      `Delete "${competition.name}" and all its race results? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCompetition(competition.id);
            router.back();
          },
        },
      ]
    );
  }

  if (!competition) {
    return (
      <View style={styles.centered}>
        <Text>Competition not found.</Text>
      </View>
    );
  }

  const isActive = competition.status === "active";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: competition.name,
          headerRight: () => (
            <Pressable onPress={handleDelete} hitSlop={10}>
              <Ionicons name="trash-outline" size={22} color="#E63946" />
            </Pressable>
          ),
        }}
      />

      <View style={styles.headerBlock}>
        <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeDone]}>
          <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextDone]}>
            {isActive ? "ACTIVE" : "COMPLETED"}
          </Text>
        </View>
        <Text style={styles.dateText}>
          Started {formatDate(competition.createdAt)}
          {competition.completedAt ? ` · Ended ${formatDate(competition.completedAt)}` : ""}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Standings</Text>
      <View style={styles.card}>
        {standings.map((entry) => {
          const racer = getRacerById(entry.racerId);
          const isWinner = !isActive && winnerIds.includes(entry.racerId);
          return (
            <View key={entry.racerId} style={styles.standingRow}>
              <Text style={styles.rank}>{entry.rank}</Text>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: racer?.color ?? "#ccc" },
                ]}
              />
              <Text style={styles.standingName}>{racer?.name ?? "Unknown"}</Text>
              {isWinner && <Ionicons name="trophy" size={18} color="#F4A261" />}
              <Text style={styles.points}>{entry.points} pts</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>
        Races ({competition.races.length})
      </Text>
      {competition.races.length === 0 ? (
        <Text style={styles.noRaces}>No races recorded yet.</Text>
      ) : (
        <View style={styles.card}>
          {[...competition.races]
            .slice()
            .reverse()
            .map((race, idxFromEnd) => {
              const raceNumber = competition.races.length - idxFromEnd;
              const sortedResults = [...race.results].sort((a, b) => {
                if (a.place === "DNF" && b.place === "DNF") return 0;
                if (a.place === "DNF") return 1;
                if (b.place === "DNF") return -1;
                return (a.place as number) - (b.place as number);
              });
              return (
                <View key={race.id} style={styles.raceBlock}>
                  <Text style={styles.raceTitle}>Race {raceNumber}</Text>
                  {sortedResults.map((result) => {
                    const racer = getRacerById(result.racerId);
                    return (
                      <View key={result.racerId} style={styles.raceResultRow}>
                        <Text style={styles.racePlace}>{placeLabel(result.place)}</Text>
                        <Text style={styles.raceResultName}>
                          {racer?.name ?? "Unknown"}
                        </Text>
                        <Text style={styles.racePoints}>
                          {pointsForRacerInRace(race, result.racerId)} pts
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
        </View>
      )}

      {isActive && (
        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push(`/competition/${competition.id}/race-new`)}
          >
            <Text style={styles.primaryButtonText}>Add Race</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={handleEnd}>
            <Text style={styles.secondaryButtonText}>Competition Over</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerBlock: { marginBottom: 20, gap: 8 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeActive: { backgroundColor: "#e6f4f1" },
  badgeDone: { backgroundColor: "#f0f0f0" },
  badgeText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  badgeTextActive: { color: "#2A9D8F" },
  badgeTextDone: { color: "#777" },
  dateText: { fontSize: 13, color: "#888" },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  standingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    gap: 10,
  },
  rank: { width: 20, fontSize: 15, fontWeight: "700", color: "#999" },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  standingName: { flex: 1, fontSize: 15, fontWeight: "600", color: "#111" },
  points: { fontSize: 15, fontWeight: "700", color: "#111" },
  noRaces: { fontSize: 14, color: "#999", fontStyle: "italic" },
  raceBlock: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  raceTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 6 },
  raceResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    gap: 8,
  },
  racePlace: { width: 42, fontSize: 13, fontWeight: "700", color: "#E63946" },
  raceResultName: { flex: 1, fontSize: 14, color: "#333" },
  racePoints: { fontSize: 13, color: "#888" },
  actions: { marginTop: 28, gap: 12 },
  primaryButton: {
    backgroundColor: "#E63946",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  secondaryButtonText: { color: "#333", fontSize: 16, fontWeight: "600" },
});
