import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RACER_COLORS } from "../src/colors";
import { useData } from "../src/DataContext";
import { formatDate, ordinal } from "../src/format";
import { computeStandings, getWinnerIds } from "../src/scoring";

export default function RacerForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { racers, competitions, addRacer, updateRacer, deleteRacer, canDeleteRacer } =
    useData();
  const router = useRouter();
  const existing = racers.find((r) => r.id === id);
  const isEdit = !!existing;

  const history = (existing ? competitions : [])
    .filter((c) => c.racerIds.includes(existing!.id))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((c) => {
      const standings = computeStandings(c);
      const entry = standings.find((s) => s.racerId === existing!.id)!;
      return {
        competition: c,
        rank: entry.rank,
        points: entry.points,
        raceCount: c.races.length,
        isWinner:
          c.status === "completed" && getWinnerIds(standings).includes(existing!.id),
      };
    });

  const finished = history.filter(
    (h) => h.competition.status === "completed" && h.raceCount > 0
  );
  const allResults = history.flatMap((h) =>
    h.competition.races.flatMap((r) =>
      r.results.filter((res) => res.racerId === existing!.id)
    )
  );
  const stats = {
    competitions: history.length,
    wins: finished.filter((h) => h.isWinner).length,
    podiums: finished.filter((h) => h.rank <= 3).length,
    races: allResults.length,
    raceWins: allResults.filter((r) => r.place === 1).length,
    dnfs: allResults.filter((r) => r.place === "DNF").length,
  };

  const [name, setName] = useState(existing?.name ?? "");
  const [carNumber, setCarNumber] = useState(existing?.carNumber ?? "");
  const [color, setColor] = useState(existing?.color ?? RACER_COLORS[0]);

  function handleSave() {
    const trimmedName = name.trim();
    const trimmedCarNumber = carNumber.trim();
    if (!trimmedName) {
      Alert.alert("Name required", "Please enter a name for this racer.");
      return;
    }
    if (isEdit) {
      updateRacer(existing.id, {
        name: trimmedName,
        carNumber: trimmedCarNumber || undefined,
        color,
      });
    } else {
      addRacer(trimmedName, color, trimmedCarNumber || undefined);
    }
    router.back();
  }

  function handleDelete() {
    if (!existing) return;
    if (!canDeleteRacer(existing.id)) {
      Alert.alert(
        "Can't delete",
        `${existing.name} is part of a competition and can't be deleted, since that would break past race results. Remove them from future competitions instead.`
      );
      return;
    }
    Alert.alert(
      "Delete racer",
      `Delete ${existing.name}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteRacer(existing.id);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: isEdit ? "Edit Racer" : "New Racer" }} />

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Sarah's Charger"
        autoFocus
        returnKeyType="done"
      />

      <Text style={styles.label}>Car Number (optional)</Text>
      <TextInput
        style={styles.input}
        value={carNumber}
        onChangeText={setCarNumber}
        placeholder="e.g. 24"
        returnKeyType="done"
      />

      <Text style={styles.label}>Color</Text>
      <View style={styles.colorGrid}>
        {RACER_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.swatch,
              { backgroundColor: c },
              color === c && styles.swatchSelected,
            ]}
          />
        ))}
      </View>

      {isEdit && (
        <>
          <Text style={styles.sectionTitle}>Career Summary</Text>
          <View style={styles.statsGrid}>
            <Stat label="Competitions" value={stats.competitions} />
            <Stat label="Comp. wins" value={stats.wins} />
            <Stat label="Top 3 finishes" value={stats.podiums} />
            <Stat label="Races" value={stats.races} />
            <Stat label="Race wins" value={stats.raceWins} />
            <Stat label="DNFs" value={stats.dnfs} />
          </View>

          <Text style={styles.sectionTitle}>Competition History</Text>
          {history.length === 0 ? (
            <Text style={styles.noHistory}>Not in any competitions yet.</Text>
          ) : (
            <View style={styles.historyCard}>
              {history.map((h) => {
                const done = h.competition.status === "completed";
                const placeText =
                  h.raceCount === 0
                    ? "No races yet"
                    : `${done ? "" : "Currently "}${ordinal(h.rank)} of ${
                        h.competition.racerIds.length
                      }`;
                return (
                  <Pressable
                    key={h.competition.id}
                    style={styles.historyRow}
                    onPress={() => router.push(`/competition/${h.competition.id}`)}
                  >
                    <View style={styles.historyText}>
                      <Text style={styles.historyName}>
                        {h.isWinner ? "🏆 " : ""}
                        {h.competition.name}
                      </Text>
                      <Text style={styles.historySub}>
                        {formatDate(h.competition.createdAt)} ·{" "}
                        {done ? "Completed" : "In progress"} · {h.raceCount}{" "}
                        {h.raceCount === 1 ? "race" : "races"}
                      </Text>
                    </View>
                    <View style={styles.historyResult}>
                      <Text style={styles.historyPlace}>{placeText}</Text>
                      <Text style={styles.historySub}>{h.points} pts</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>
          {isEdit ? "Save Changes" : "Add Racer"}
        </Text>
      </Pressable>

      {isEdit && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Racer</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginTop: 28,
    marginBottom: 4,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  stat: {
    width: "31%",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "800", color: "#111" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 2, textAlign: "center" },
  noHistory: { fontSize: 14, color: "#999", fontStyle: "italic", marginTop: 6 },
  historyCard: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
    marginTop: 6,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    gap: 10,
  },
  historyText: { flex: 1 },
  historyName: { fontSize: 15, fontWeight: "600", color: "#111" },
  historySub: { fontSize: 12, color: "#888", marginTop: 2 },
  historyResult: { alignItems: "flex-end" },
  historyPlace: { fontSize: 14, fontWeight: "700", color: "#E63946" },
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: "#555", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 6,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "transparent",
  },
  swatchSelected: { borderColor: "#111" },
  saveButton: {
    backgroundColor: "#E63946",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 28,
  },
  saveButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  deleteButton: {
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },
  deleteButtonText: { color: "#E63946", fontSize: 16, fontWeight: "600" },
});
