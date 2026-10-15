import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useData } from "../../../src/DataContext";
import { ordinal, placeLabel } from "../../../src/format";
import { computePickOrder } from "../../../src/scoring";
import { RaceResult } from "../../../src/types";

export default function RaceNew() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { competitions, getRacerById, addRace } = useData();
  const router = useRouter();

  const competition = competitions.find((c) => c.id === id);
  const [finishOrder, setFinishOrder] = useState<string[]>([]);
  const [dnf, setDnf] = useState<string[]>([]);
  const [showPickOrder, setShowPickOrder] = useState(
    () => (competition?.races.length ?? 0) > 0
  );

  if (!competition) {
    return (
      <View style={styles.centered}>
        <Text>Competition not found.</Text>
      </View>
    );
  }

  const remaining = competition.racerIds.filter(
    (rid) => !finishOrder.includes(rid) && !dnf.includes(rid)
  );

  const allAssigned =
    finishOrder.length + dnf.length === competition.racerIds.length;
  const canSave = allAssigned && finishOrder.length > 0;

  if (showPickOrder) {
    const pickOrder = computePickOrder(competition);
    const lastRace = [...competition.races].sort((a, b) => b.createdAt - a.createdAt)[0];
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.instructions}>
            Last place from the previous race picks first. DNFs go before anyone
            who scored; ties are broken by the race before that.
          </Text>
          <Text style={styles.sectionTitle}>Pick Order</Text>
          <View style={styles.card}>
            {pickOrder.map((racerId, index) => {
              const racer = getRacerById(racerId);
              const lastPlace = lastRace?.results.find((r) => r.racerId === racerId)?.place;
              return (
                <View key={racerId} style={styles.orderRow}>
                  <Text style={styles.placeText}>{ordinal(index + 1)}</Text>
                  <View
                    style={[styles.colorDot, { backgroundColor: racer?.color ?? "#ccc" }]}
                  />
                  <Text style={styles.orderName}>{racer?.name ?? "Unknown"}</Text>
                  <Text style={styles.lastPlaceText}>
                    {lastPlace !== undefined ? `Last: ${placeLabel(lastPlace)}` : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable style={styles.saveButton} onPress={() => setShowPickOrder(false)}>
            <Text style={styles.saveButtonText}>Enter Results</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function addToFinishOrder(racerId: string) {
    setFinishOrder((prev) => [...prev, racerId]);
  }

  function addToDnf(racerId: string) {
    setDnf((prev) => [...prev, racerId]);
  }

  function removeFromFinishOrder(racerId: string) {
    setFinishOrder((prev) => prev.filter((rid) => rid !== racerId));
  }

  function removeFromDnf(racerId: string) {
    setDnf((prev) => prev.filter((rid) => rid !== racerId));
  }

  function moveInFinishOrder(index: number, direction: -1 | 1) {
    setFinishOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleSave() {
    if (!canSave || !competition) return;
    const results: RaceResult[] = [
      ...finishOrder.map((racerId, idx) => ({ racerId, place: idx + 1 })),
      ...dnf.map((racerId) => ({ racerId, place: "DNF" as const })),
    ];
    addRace(competition.id, results);
    router.back();
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.instructions}>
          Tap each racer in the order they finished. Use DNF for cars that didn't
          finish.
        </Text>

        {finishOrder.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Finish Order</Text>
            <View style={styles.card}>
              {finishOrder.map((racerId, index) => {
                const racer = getRacerById(racerId);
                return (
                  <View key={racerId} style={styles.orderRow}>
                    <Text style={styles.placeText}>{ordinal(index + 1)}</Text>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: racer?.color ?? "#ccc" },
                      ]}
                    />
                    <Text style={styles.orderName}>{racer?.name ?? "Unknown"}</Text>
                    <Pressable
                      onPress={() => moveInFinishOrder(index, -1)}
                      hitSlop={8}
                      disabled={index === 0}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={20}
                        color={index === 0 ? "#ddd" : "#555"}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => moveInFinishOrder(index, 1)}
                      hitSlop={8}
                      disabled={index === finishOrder.length - 1}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={index === finishOrder.length - 1 ? "#ddd" : "#555"}
                      />
                    </Pressable>
                    <Pressable onPress={() => removeFromFinishOrder(racerId)} hitSlop={8}>
                      <Ionicons name="close-circle" size={20} color="#ccc" />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {remaining.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Still Racing</Text>
            <View style={styles.card}>
              {remaining.map((racerId) => {
                const racer = getRacerById(racerId);
                return (
                  <View key={racerId} style={styles.remainingRow}>
                    <Pressable
                      style={styles.remainingMain}
                      onPress={() => addToFinishOrder(racerId)}
                    >
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: racer?.color ?? "#ccc" },
                        ]}
                      />
                      <Text style={styles.orderName}>{racer?.name ?? "Unknown"}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.dnfButton}
                      onPress={() => addToDnf(racerId)}
                    >
                      <Text style={styles.dnfButtonText}>DNF</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {dnf.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>DNF</Text>
            <View style={styles.card}>
              {dnf.map((racerId) => {
                const racer = getRacerById(racerId);
                return (
                  <View key={racerId} style={styles.orderRow}>
                    <Text style={styles.dnfLabel}>DNF</Text>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: racer?.color ?? "#ccc" },
                      ]}
                    />
                    <Text style={styles.orderName}>{racer?.name ?? "Unknown"}</Text>
                    <Pressable onPress={() => removeFromDnf(racerId)} hitSlop={8}>
                      <Ionicons name="close-circle" size={20} color="#ccc" />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, !canSave && styles.disabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveButtonText}>Save Race</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  instructions: { fontSize: 14, color: "#777", marginBottom: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    overflow: "hidden",
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    gap: 10,
  },
  placeText: { width: 36, fontSize: 14, fontWeight: "700", color: "#E63946" },
  lastPlaceText: { fontSize: 13, color: "#999" },
  dnfLabel: { width: 36, fontSize: 13, fontWeight: "700", color: "#999" },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  orderName: { flex: 1, fontSize: 15, fontWeight: "600", color: "#111" },
  remainingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  remainingMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  dnfButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  dnfButtonText: { fontSize: 13, fontWeight: "700", color: "#999" },
  footer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5e5",
  },
  saveButton: {
    backgroundColor: "#E63946",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  disabled: { opacity: 0.4 },
  saveButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
