import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useData } from "../../src/DataContext";
import { confirm } from "../../src/dialogs";
import { formatDate } from "../../src/format";
import { computeStandings, getWinnerIds } from "../../src/scoring";
import { Competition } from "../../src/types";

type Filter = "active" | "completed";

export default function CompetitionsScreen() {
  const { competitions, getRacerById, deleteCompetition, loading } = useData();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("active");

  const filtered = useMemo(
    () =>
      competitions
        .filter((c) => c.status === filter)
        .sort((a, b) => b.createdAt - a.createdAt),
    [competitions, filter]
  );

  function confirmDelete(competition: Competition) {
    confirm(
      "Delete competition",
      `Delete "${competition.name}" and all its race results? This cannot be undone.`,
      "Delete",
      () => deleteCompetition(competition.id)
    );
  }

  function winnerSummary(competition: Competition): string {
    const winnerIds = getWinnerIds(computeStandings(competition));
    if (winnerIds.length === 0) return "No races recorded";
    const names = winnerIds
      .map((id) => getRacerById(id)?.name ?? "Unknown")
      .join(" & ");
    return `Winner: ${names}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.segmented}>
        <Pressable
          style={[styles.segment, filter === "active" && styles.segmentActive]}
          onPress={() => setFilter("active")}
        >
          <Text
            style={[
              styles.segmentText,
              filter === "active" && styles.segmentTextActive,
            ]}
          >
            Active
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, filter === "completed" && styles.segmentActive]}
          onPress={() => setFilter("completed")}
        >
          <Text
            style={[
              styles.segmentText,
              filter === "completed" && styles.segmentTextActive,
            ]}
          >
            History
          </Text>
        </Pressable>
      </View>

      {!loading && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            filtered.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={48} color="#aaa" />
              <Text style={styles.emptyText}>
                {filter === "active" ? "No active competitions" : "No history yet"}
              </Text>
              {filter === "active" && (
                <Text style={styles.emptySubtext}>
                  Start a new competition to begin racing
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/competition/${item.id}`)}
            >
              <View style={styles.rowText}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.subtext}>
                  {formatDate(item.createdAt)} · {item.racerIds.length} racers ·{" "}
                  {item.races.length} {item.races.length === 1 ? "race" : "races"}
                </Text>
                {item.status === "completed" && (
                  <Text style={styles.winnerText}>{winnerSummary(item)}</Text>
                )}
              </View>
              <Pressable
                onPress={() => confirmDelete(item)}
                hitSlop={10}
                accessibilityLabel="Delete competition"
              >
                <Ionicons name="trash-outline" size={22} color="#E63946" />
              </Pressable>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/competition-new")}
        accessibilityLabel="New competition"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  segmented: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentActive: { backgroundColor: "#fff", shadowOpacity: 0.1 },
  segmentText: { fontSize: 14, fontWeight: "600", color: "#777" },
  segmentTextActive: { color: "#111" },
  listContent: { paddingBottom: 8 },
  emptyContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 6,
  },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#555" },
  emptySubtext: { fontSize: 14, color: "#999" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
    gap: 12,
  },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: "600", color: "#111" },
  subtext: { fontSize: 13, color: "#888" },
  winnerText: { fontSize: 13, color: "#2A9D8F", fontWeight: "600", marginTop: 2 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E63946",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
